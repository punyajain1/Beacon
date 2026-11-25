import Graph from 'graphology';
import { bfsFromNode } from 'graphology-traversal';
import prisma from '../config/database';
import { logger } from '../utils/logger';

interface TransactionInput {
  fromAccount: string;
  toAccount: string;
  amount: number;
  currency?: string;
  date: string;
  description?: string;
}

interface GraphNode {
  id: string;
  label: string;
}

interface GraphEdge {
  source: string;
  target: string;
  amount: number;
  date: string;
}

class FraudService {
  /**
   * Bulk create transactions in the database
   */
  async ingestTransactions(transactions: TransactionInput[]): Promise<number> {
    try {
      const data = transactions.map((t) => ({
        fromAccount: t.fromAccount,
        toAccount: t.toAccount,
        amount: t.amount,
        currency: t.currency ?? 'USD',
        date: new Date(t.date),
        description: t.description ?? null,
      }));

      const result = await prisma.transaction.createMany({
        data,
        skipDuplicates: false,
      });

      logger.info(`Ingested ${result.count} transactions`);
      return result.count;
    } catch (error) {
      logger.error('Error ingesting transactions:', error);
      throw error;
    }
  }

  /**
   * Detect money mule rings using DFS cycle detection on a directed graph
   */
  async detectRings(): Promise<any[]> {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const transactions = await prisma.transaction.findMany({
        where: {
          date: { gte: ninetyDaysAgo },
        },
      });

      logger.info(`Loaded ${transactions.length} transactions for ring detection`);

      if (transactions.length === 0) {
        return [];
      }

      // Build directed multigraph
      const graph = new Graph({ type: 'directed', multi: true });

      for (const tx of transactions) {
        if (!graph.hasNode(tx.fromAccount)) graph.addNode(tx.fromAccount);
        if (!graph.hasNode(tx.toAccount)) graph.addNode(tx.toAccount);
        graph.addEdge(tx.fromAccount, tx.toAccount, {
          amount: tx.amount,
          date: tx.date.toISOString(),
        });
      }

      // DFS cycle detection — find all cycles up to length 8
      const cycles: string[][] = [];
      const globalVisited = new Set<string>();

      function findCycles(
        startNode: string,
        currentNode: string,
        path: string[],
        pathSet: Set<string>
      ) {
        const neighbors = graph.outNeighbors(currentNode);
        for (const neighbor of neighbors) {
          if (neighbor === startNode && path.length >= 2) {
            cycles.push([...path, neighbor]);
          } else if (
            !pathSet.has(neighbor) &&
            !globalVisited.has(neighbor) &&
            path.length < 8
          ) {
            path.push(neighbor);
            pathSet.add(neighbor);
            findCycles(startNode, neighbor, path, pathSet);
            path.pop();
            pathSet.delete(neighbor);
          }
        }
      }

      for (const node of graph.nodes()) {
        findCycles(node, node, [node], new Set([node]));
        globalVisited.add(node);
      }

      logger.info(`Found ${cycles.length} cycles before scoring`);

      // Score each cycle
      function computeRiskScore(cycle: string[], txList: any[]): number {
        // Factor 1: amount uniformity (similar amounts = suspicious)
        const cycleAmounts = txList
          .filter((t) => cycle.includes(t.fromAccount) && cycle.includes(t.toAccount))
          .map((t) => t.amount);

        if (cycleAmounts.length === 0) return 0;

        const avgAmount = cycleAmounts.reduce((a, b) => a + b, 0) / cycleAmounts.length;
        const variance =
          cycleAmounts.reduce((a, b) => a + Math.pow(b - avgAmount, 2), 0) /
          cycleAmounts.length;
        const uniformityScore = Math.max(
          0,
          100 - (Math.sqrt(variance) / (avgAmount || 1)) * 100
        );

        // Factor 2: transaction velocity (transactions in short window)
        const velocityScore = Math.min(100, cycleAmounts.length * 15);

        // Factor 3: ring size (larger rings = more suspicious)
        const sizeScore = Math.min(100, cycle.length * 12);

        return Math.round(
          uniformityScore * 0.5 + velocityScore * 0.3 + sizeScore * 0.2
        );
      }

      // Build scored rings
      const scoredCycles = cycles
        .map((cycle) => {
          const riskScore = computeRiskScore(cycle, transactions);
          const cycleTxs = transactions.filter(
            (t) => cycle.includes(t.fromAccount) && cycle.includes(t.toAccount)
          );
          const totalMoved = cycleTxs.reduce((sum, t) => sum + t.amount, 0);

          // Build edges for this ring
          const edges: { from: string; to: string; amount: number }[] = [];
          for (let i = 0; i < cycle.length - 1; i++) {
            const from = cycle[i];
            const to = cycle[i + 1];
            const tx = transactions.find(
              (t) => t.fromAccount === from && t.toAccount === to
            );
            if (tx) edges.push({ from, to, amount: tx.amount });
          }

          return { cycle, riskScore, totalMoved, edges };
        })
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 20);

      // Upsert FraudRing records
      const rings: any[] = [];
      for (const { cycle, riskScore, totalMoved, edges } of scoredCycles) {
        // Deduplicate by sorted node list as a stable key
        const nodesKey = [...cycle].sort().join('|');

        const existing = await prisma.fraudRing.findFirst({
          where: {
            nodes: { equals: cycle },
          },
        });

        let ring: any;
        if (existing) {
          ring = await prisma.fraudRing.update({
            where: { id: existing.id },
            data: { riskScore, totalMoved, edges: edges as any },
          });
        } else {
          ring = await prisma.fraudRing.create({
            data: {
              nodes: cycle,
              edges: edges as any,
              riskScore,
              totalMoved,
              status: 'OPEN',
            },
          });
        }
        rings.push(ring);
      }

      logger.info(`Upserted ${rings.length} fraud rings`);
      return rings;
    } catch (error) {
      logger.error('Error detecting rings:', error);
      throw error;
    }
  }

  /**
   * Fetch FraudRing records, optionally filtered by status
   */
  async getRings(status?: string): Promise<any[]> {
    try {
      const where: any = {};
      if (status) where.status = status;

      return await prisma.fraudRing.findMany({
        where,
        orderBy: { riskScore: 'desc' },
      });
    } catch (error) {
      logger.error('Error fetching rings:', error);
      throw error;
    }
  }

  /**
   * Get account graph (up to 2 hops) for a given account ID
   */
  async getAccountGraph(
    accountId: string
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    try {
      // Hop 1: direct transactions
      const directTxs = await prisma.transaction.findMany({
        where: {
          OR: [{ fromAccount: accountId }, { toAccount: accountId }],
        },
        take: 500,
      });

      const hop1Accounts = new Set<string>();
      hop1Accounts.add(accountId);
      for (const tx of directTxs) {
        hop1Accounts.add(tx.fromAccount);
        hop1Accounts.add(tx.toAccount);
      }

      // Hop 2: transactions involving hop1 neighbors
      const hop2Txs = await prisma.transaction.findMany({
        where: {
          OR: [
            { fromAccount: { in: Array.from(hop1Accounts) } },
            { toAccount: { in: Array.from(hop1Accounts) } },
          ],
        },
        take: 1000,
      });

      const allTxs = [...directTxs, ...hop2Txs];
      const allAccounts = new Set<string>();
      for (const tx of allTxs) {
        allAccounts.add(tx.fromAccount);
        allAccounts.add(tx.toAccount);
      }

      const nodes: GraphNode[] = Array.from(allAccounts).map((id) => ({
        id,
        label: id === accountId ? `${id} ★` : id,
      }));

      const edgeMap = new Map<string, GraphEdge>();
      for (const tx of allTxs) {
        const key = `${tx.fromAccount}→${tx.toAccount}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            source: tx.fromAccount,
            target: tx.toAccount,
            amount: tx.amount,
            date: tx.date.toISOString(),
          });
        }
      }

      return { nodes, edges: Array.from(edgeMap.values()) };
    } catch (error) {
      logger.error('Error getting account graph:', error);
      throw error;
    }
  }

  /**
   * Update FraudRing status
   */
  async updateRingStatus(id: string, status: string): Promise<any> {
    try {
      return await prisma.fraudRing.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      logger.error('Error updating ring status:', error);
      throw error;
    }
  }

  /**
   * Parse simple CSV text with headers: fromAccount,toAccount,amount,currency,date,description
   */
  parseCSV(csvText: string): TransactionInput[] {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const results: TransactionInput[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',');
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = (values[idx] ?? '').trim();
      });

      if (!row.fromaccount || !row.toaccount || !row.amount || !row.date) {
        continue;
      }

      results.push({
        fromAccount: row.fromaccount,
        toAccount: row.toaccount,
        amount: parseFloat(row.amount),
        currency: row.currency || 'USD',
        date: row.date,
        description: row.description || undefined,
      });
    }

    return results;
  }
}

export default new FraudService();
