import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import websocketService from './websocket.service';

const SEC_RSS_PAGES = [
  'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&dateb=&owner=include&start=0&count=100&output=atom',
];
const SEC_HEADERS = { 'User-Agent': 'Beacon/1.0 beacon-app@gmail.com' };

interface Form4Data {
  ticker: string;
  company: string;
  insiderName: string;
  insiderRole: string;
  transactionCode: string;
  shares: number;
  pricePerShare: number;
  totalValue: number;
  filingDate: Date;
  accessionNumber: string;
}

export interface InsiderScanResult {
  entriesScanned: number;
  purchasesSaved: number;
  clustersDetected: number;
}

function xmlTextVal(node: any): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'object') {
    if ('value' in node) return xmlTextVal(node.value);
    if ('#text' in node) return xmlTextVal(node['#text']);
    return '';
  }
  return String(node).trim();
}

class InsiderService {
  /**
   * Fetch SEC EDGAR Form 4 RSS feed, parse each entry and upsert purchase filings.
   */
  async scanInsiderFilings(): Promise<InsiderScanResult> {
    logger.info('Starting insider filing scan...');

    const parser = new XMLParser({ ignoreAttributes: false });
    const seenUrls = new Set<string>();
    const filingUrls: string[] = [];

    for (const feedUrl of SEC_RSS_PAGES) {
      try {
        const response = await axios.get(feedUrl, { headers: SEC_HEADERS, timeout: 15000 });
        const parsed = parser.parse(response.data as string);
        const feed = parsed?.feed;
        if (!feed) continue;

        const entries: any[] = Array.isArray(feed.entry) ? feed.entry : feed.entry ? [feed.entry] : [];
        for (const entry of entries) {
          const linkNode = Array.isArray(entry?.link) ? entry.link[0] : entry?.link;
          const filingIndexUrl: string = entry?.['filing-href'] || linkNode?.['@_href'] || '';
          if (filingIndexUrl && !seenUrls.has(filingIndexUrl)) {
            seenUrls.add(filingIndexUrl);
            filingUrls.push(filingIndexUrl);
          }
        }
      } catch (err) {
        logger.error(`Failed to fetch/parse SEC EDGAR RSS feed (${feedUrl}):`, err);
      }
    }

    logger.info(`Found ${filingUrls.length} unique entries in SEC Form 4 RSS feed`);

    let purchasesSaved = 0;

    // Respect SEC EDGAR fair-access limit (<=10 req/s): 2 filings (4 reqs) per 400ms window
    const batchSize = 2;
    for (let i = 0; i < filingUrls.length; i += batchSize) {
      const slice = filingUrls.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        slice.map(async (filingIndexUrl) => {
          const form4 = await this.fetchAndParseForm4(filingIndexUrl);
          if (!form4 || form4.transactionCode !== 'P') return false;

          await prisma.insiderFiling.upsert({
            where: { secAccessionNumber: form4.accessionNumber },
            update: {
              ticker: form4.ticker,
              company: form4.company,
              insiderName: form4.insiderName,
              insiderRole: form4.insiderRole,
              transactionCode: form4.transactionCode,
              shares: form4.shares,
              pricePerShare: form4.pricePerShare,
              totalValue: form4.totalValue,
              filingDate: form4.filingDate,
            },
            create: {
              secAccessionNumber: form4.accessionNumber,
              ticker: form4.ticker,
              company: form4.company,
              insiderName: form4.insiderName,
              insiderRole: form4.insiderRole,
              transactionCode: form4.transactionCode,
              shares: form4.shares,
              pricePerShare: form4.pricePerShare,
              totalValue: form4.totalValue,
              filingDate: form4.filingDate,
            },
          });
          return true;
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) purchasesSaved++;
      }

      if (i + batchSize < filingUrls.length) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }

    logger.info(
      `Insider filing scan complete (${purchasesSaved} Form 4 purchases saved from ${filingUrls.length} filings), running cluster detection...`
    );
    const alerts = await this.detectClusters();

    return {
      entriesScanned: filingUrls.length,
      purchasesSaved,
      clustersDetected: alerts.length,
    };
  }

  private async fetchSecWithRetry(url: string): Promise<string> {
    try {
      const res = await axios.get(url, { headers: SEC_HEADERS, timeout: 10000 });
      return res.data as string;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429 || status === 502 || status === 503) {
        await new Promise((resolve) => setTimeout(resolve, 750));
        const retryRes = await axios.get(url, { headers: SEC_HEADERS, timeout: 10000 });
        return retryRes.data as string;
      }
      throw err;
    }
  }

  /**
   * Fetch the SEC EDGAR filing index page, find the raw Form 4 XML link, and parse it.
   */
  async fetchAndParseForm4(indexUrl: string): Promise<Form4Data | null> {
    try {
      const indexHtml = await this.fetchSecWithRetry(indexUrl);

      const xmlLinkMatch = indexHtml.match(/href="([^"]+\.xml)"/gi);
      if (!xmlLinkMatch) return null;

      let xmlUrl: string | null = null;
      for (const match of xmlLinkMatch) {
        const href = match.replace(/href="/i, '').replace(/"$/, '');
        // Skip XSLT-rendered HTML links (e.g. /xslF345X05/form4.xml) and index XMLs
        if (!href.endsWith('-index.xml') && !/\/xsl[^/]*\//i.test(href)) {
          xmlUrl = href.startsWith('http') ? href : `https://www.sec.gov${href}`;
          break;
        }
      }

      if (!xmlUrl) return null;

      const xmlText = await this.fetchSecWithRetry(xmlUrl);

      const parser = new XMLParser({ ignoreAttributes: false });
      const doc = parser.parse(xmlText);
      const root = doc?.ownershipDocument || doc;

      // Issuer info
      const issuer = root?.issuer || {};
      const ticker = xmlTextVal(issuer?.issuerTradingSymbol).toUpperCase();
      const company = xmlTextVal(issuer?.issuerName) || ticker;

      if (!ticker || ticker === 'NONE' || ticker === 'N/A') return null;

      // Reporting owner (can be an array when multiple insiders co-file)
      const owner = Array.isArray(root?.reportingOwner)
        ? root.reportingOwner[0]
        : root?.reportingOwner || {};
      const ownerName = xmlTextVal(owner?.reportingOwnerId?.rptOwnerName) || 'Unknown Insider';
      const relationship = owner?.reportingOwnerRelationship || {};
      const officerTitle = xmlTextVal(relationship?.officerTitle);
      const isDirector =
        relationship?.isDirector === 'true' ||
        relationship?.isDirector === true ||
        relationship?.isDirector === 1 ||
        relationship?.isDirector === '1';
      const isTenPct =
        relationship?.isTenPercentOwner === 'true' ||
        relationship?.isTenPercentOwner === true ||
        relationship?.isTenPercentOwner === 1 ||
        relationship?.isTenPercentOwner === '1';
      const insiderRole = officerTitle || (isDirector ? 'Director' : isTenPct ? '10% Owner' : 'Insider');

      const accessionNumber: string = xmlUrl.match(/(\d{10}-\d{2}-\d{6})/)?.[1] || xmlUrl;

      // Non-derivative transactions
      const nonDerivSection = root?.nonDerivativeTable || {};
      let transactions: any[] = nonDerivSection?.nonDerivativeTransaction || [];
      if (!Array.isArray(transactions)) transactions = transactions ? [transactions] : [];

      // Form 4 transactionCode lives under <transactionCoding><transactionCode>
      const getTxCode = (tx: any): string =>
        (
          xmlTextVal(tx?.transactionCoding?.transactionCode) ||
          xmlTextVal(tx?.transactionAmounts?.transactionCode)
        ).toUpperCase();

      // Filter for open-market purchase ('P') transactions
      const purchaseTxs = transactions.filter((tx: any) => getTxCode(tx) === 'P');
      if (purchaseTxs.length === 0) return null;

      let totalShares = 0;
      let weightedPrice = 0;
      let filingDate: Date = new Date();

      for (const tx of purchaseTxs) {
        const shares = parseFloat(xmlTextVal(tx?.transactionAmounts?.transactionShares)) || 0;
        const price = parseFloat(xmlTextVal(tx?.transactionAmounts?.transactionPricePerShare)) || 0;
        const dateStr = xmlTextVal(tx?.transactionDate);
        if (dateStr) {
          const parsedDate = new Date(dateStr);
          if (!isNaN(parsedDate.getTime())) filingDate = parsedDate;
        }
        weightedPrice += price * shares;
        totalShares += shares;
      }

      if (totalShares <= 0) return null;

      const avgPrice = weightedPrice / totalShares;
      const totalValue = totalShares * avgPrice;

      return {
        ticker,
        company,
        insiderName: ownerName,
        insiderRole,
        transactionCode: 'P',
        shares: totalShares,
        pricePerShare: avgPrice,
        totalValue,
        filingDate,
        accessionNumber,
      };
    } catch (err: any) {
      const status = err?.response?.status;
      logger.warn(`Skipped Form 4 (${indexUrl}): ${status ? `HTTP ${status}` : err?.message || 'unknown error'}`);
      return null;
    }
  }

  /**
   * Detect cluster buys: 2+ Form 4 purchases on the same ticker within 7 days -> upsert InsiderAlert.
   */
  async detectClusters(): Promise<any[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const clusters: any[] = await prisma.$queryRaw`
      SELECT
        UPPER(ticker)            AS ticker,
        MAX(company)             AS company,
        COUNT(*)::int            AS "insiderCount",
        COALESCE(SUM("totalValue"), 0) AS "totalValue",
        MAX("filingDate")        AS "clusterDate",
        json_agg(json_build_object(
          'id', id,
          'insiderName', "insiderName",
          'insiderRole', "insiderRole",
          'shares', shares,
          'pricePerShare', "pricePerShare",
          'totalValue', "totalValue",
          'filingDate', "filingDate"
        ) ORDER BY "filingDate" DESC) AS filings
      FROM "InsiderFiling"
      WHERE "filingDate" >= ${sevenDaysAgo}
        AND "transactionCode" = 'P'
      GROUP BY UPPER(ticker)
      HAVING COUNT(*) >= 2
      ORDER BY "insiderCount" DESC
    `;

    const alerts: any[] = [];

    for (const cluster of clusters) {
      const clusterDate = new Date(cluster.clusterDate);
      const existing = await prisma.insiderAlert.findFirst({
        where: {
          ticker: cluster.ticker,
          clusterDate: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      const alert = existing
        ? await prisma.insiderAlert.update({
            where: { id: existing.id },
            data: {
              company: cluster.company,
              insiderCount: cluster.insiderCount,
              totalValue: parseFloat(cluster.totalValue) || 0,
              filings: cluster.filings,
              clusterDate,
            },
          })
        : await prisma.insiderAlert.create({
            data: {
              ticker: cluster.ticker,
              company: cluster.company,
              insiderCount: cluster.insiderCount,
              totalValue: parseFloat(cluster.totalValue) || 0,
              windowDays: 7,
              filings: cluster.filings,
              clusterDate,
            },
          });

      websocketService.broadcastInsiderAlert(alert);
      alerts.push(alert);
      logger.info(`Cluster detected: ${cluster.ticker} — ${cluster.insiderCount} purchases, $${cluster.totalValue}`);
    }

    return alerts;
  }

  /**
   * Return recent InsiderAlert records ordered by createdAt desc.
   */
  async getAlerts(limit = 50): Promise<any[]> {
    return prisma.insiderAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Return alerts filtered by ticker.
   */
  async getAlertsByTicker(ticker: string): Promise<any[]> {
    return prisma.insiderAlert.findMany({
      where: { ticker: ticker.toUpperCase() },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Return recent individual Form 4 purchase filings across all tickers.
   */
  async getRecentFilings(limit = 25): Promise<any[]> {
    return prisma.insiderFiling.findMany({
      where: { transactionCode: 'P' },
      orderBy: { filingDate: 'desc' },
      take: limit,
    });
  }

  /**
   * Return InsiderFiling records for a ticker, ordered by filingDate desc.
   */
  async getFilingsByTicker(ticker: string): Promise<any[]> {
    return prisma.insiderFiling.findMany({
      where: { ticker: ticker.toUpperCase() },
      orderBy: { filingDate: 'desc' },
      take: 100,
    });
  }

  /**
   * Mark an InsiderAlert as seen.
   */
  async markAlertSeen(id: string): Promise<any> {
    return prisma.insiderAlert.update({
      where: { id },
      data: { seen: true },
    });
  }
}

export default new InsiderService();
