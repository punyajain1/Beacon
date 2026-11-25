'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, Eye, EyeOff, RefreshCw, Radio, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WS_URL } from '@/lib/api';

const API_BASE = 'http://localhost:4000/api';

interface InsiderFiling {
  id: string;
  ticker?: string;
  company?: string;
  insiderName: string;
  insiderRole: string;
  shares: number;
  pricePerShare: number;
  totalValue: number;
  filingDate: string;
}

interface InsiderAlert {
  id: string;
  ticker: string;
  company: string;
  insiderCount: number;
  totalValue: number;
  windowDays: number;
  seen: boolean;
  filings: InsiderFiling[];
  clusterDate: string;
  createdAt: string;
}

interface ScanStats {
  entriesScanned: number;
  purchasesSaved: number;
  clustersDetected: number;
}

function formatValue(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

function CountBadge({ count }: { count: number }) {
  const color =
    count >= 5
      ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : count >= 3
      ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider',
        color
      )}
    >
      <Users size={10} />
      {count} insider{count !== 1 ? 's' : ''}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="p-4 border border-border rounded-lg bg-secondary/10 animate-pulse">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="h-4 w-20 bg-secondary rounded mb-2" />
          <div className="h-3 w-32 bg-secondary/60 rounded" />
        </div>
        <div className="h-5 w-24 bg-secondary rounded-full" />
      </div>
      <div className="h-3 w-full bg-secondary/40 rounded mb-2" />
      <div className="h-3 w-3/4 bg-secondary/40 rounded" />
    </div>
  );
}

interface AlertCardProps {
  alert: InsiderAlert;
  onMarkSeen: (id: string) => void;
}

function AlertCard({ alert, onMarkSeen }: AlertCardProps) {
  const filings: InsiderFiling[] = Array.isArray(alert.filings)
    ? alert.filings
    : typeof alert.filings === 'string'
    ? JSON.parse(alert.filings)
    : [];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25 }}
      className={cn(
        'p-4 border rounded-lg transition-colors',
        alert.seen
          ? 'border-border bg-secondary/5 opacity-60'
          : 'border-border bg-secondary/10 hover:bg-secondary/20'
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-foreground font-mono">{alert.ticker}</span>
            <CountBadge count={alert.insiderCount} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{alert.company}</p>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-sm font-bold text-primary">{formatValue(alert.totalValue)}</span>
          <span className="text-[10px] text-muted-foreground">
            {new Date(alert.clusterDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Insider list */}
      {filings.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {filings.slice(0, 4).map((f, i) => (
            <div key={f.id || i} className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <TrendingUp size={10} className="text-green-500 shrink-0" />
                <span className="text-foreground truncate font-medium">{f.insiderName}</span>
                {f.insiderRole && (
                  <span className="text-muted-foreground shrink-0 hidden sm:inline">
                    · {f.insiderRole}
                  </span>
                )}
              </div>
              <span className="text-muted-foreground shrink-0 ml-2">
                {f.shares.toLocaleString()} sh @ {formatValue(f.pricePerShare)}
              </span>
            </div>
          ))}
          {filings.length > 4 && (
            <p className="text-[10px] text-muted-foreground">
              +{filings.length - 4} more insider{filings.length - 4 !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-2 border-t border-border">
        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
          {alert.windowDays}-day window
        </span>
        {!alert.seen && (
          <button
            onClick={() => onMarkSeen(alert.id)}
            className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye size={11} />
            Mark seen
          </button>
        )}
        {alert.seen && (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            <EyeOff size={11} />
            Seen
          </span>
        )}
      </div>
    </motion.div>
  );
}

export function InsiderRadar({ className }: { className?: string }) {
  const [alerts, setAlerts] = useState<InsiderAlert[]>([]);
  const [recentFilings, setRecentFilings] = useState<InsiderFiling[]>([]);
  const [scanStats, setScanStats] = useState<ScanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [wsStatus, setWsStatus] = useState<'Connected' | 'Disconnected'>('Disconnected');
  const [showSeen, setShowSeen] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const [alertsRes, filingsRes] = await Promise.all([
        fetch(`${API_BASE}/insider/alerts?limit=50`),
        fetch(`${API_BASE}/insider/filings?limit=25`),
      ]);
      const alertsJson = await alertsRes.json();
      if (alertsJson.success && Array.isArray(alertsJson.data)) {
        setAlerts(alertsJson.data);
      }
      const filingsJson = await filingsRes.json();
      if (filingsJson.success && Array.isArray(filingsJson.data)) {
        setRecentFilings(filingsJson.data);
      }
    } catch (err) {
      console.error('Failed to fetch insider alerts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => setWsStatus('Connected');

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'insider_alert' && payload.data) {
          const incoming: InsiderAlert = payload.data;
          setAlerts((prev) => {
            const idx = prev.findIndex((a) => a.id === incoming.id);
            if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = incoming;
              return updated;
            }
            return [incoming, ...prev];
          });
        }
      } catch (e) {
        console.error('WS parse error', e);
      }
    };

    ws.onerror = () => {
      setWsStatus('Disconnected');
      ws.close();
    };
    ws.onclose = () => setWsStatus('Disconnected');

    return () => ws.close();
  }, [fetchAlerts]);

  const handleMarkSeen = async (id: string) => {
    try {
      await fetch(`${API_BASE}/insider/alerts/${id}/seen`, { method: 'PATCH' });
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, seen: true } : a))
      );
    } catch (err) {
      console.error('Failed to mark alert seen:', err);
    }
  };

  const handleTriggerScan = async () => {
    setScanning(true);
    try {
      const res = await fetch(`${API_BASE}/insider/scan`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        if (Array.isArray(json.data)) setAlerts(json.data);
        if (Array.isArray(json.recentFilings)) setRecentFilings(json.recentFilings);
        if (json.scanStats) setScanStats(json.scanStats);
      } else {
        await fetchAlerts();
      }
    } catch (err) {
      console.error('Scan trigger failed:', err);
    } finally {
      setScanning(false);
    }
  };

  const displayAlerts = showSeen ? alerts : alerts.filter((a) => !a.seen);
  const unseenCount = alerts.filter((a) => !a.seen).length;

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl bg-card p-6 border border-border min-h-[600px]',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 border-b border-border pb-4 gap-4">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <AlertTriangle size={18} className="text-primary" />
            Insider Cluster-Buy Radar
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            SEC Form 4 · 7-day clustering · {unseenCount} unseen alert{unseenCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowSeen((v) => !v)}
            className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            {showSeen ? 'Hide seen' : 'Show seen'}
          </button>

          <button
            onClick={handleTriggerScan}
            disabled={scanning}
            className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Scanning SEC…' : 'Scan Now'}
          </button>

          <div className="flex items-center gap-2">
            <Radio
              size={12}
              className={wsStatus === 'Connected' ? 'text-green-500' : 'text-red-500'}
            />
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              {wsStatus}
            </span>
          </div>
        </div>
      </div>

      {scanStats && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-secondary/20 border border-border text-xs text-muted-foreground flex flex-wrap gap-4">
          <span>Scanned: <strong className="text-foreground">{scanStats.entriesScanned}</strong> Form 4 filings</span>
          <span>Open-market purchases: <strong className="text-foreground">{scanStats.purchasesSaved}</strong></span>
          <span>Active clusters (2+ buys / 7d): <strong className="text-primary">{scanStats.clustersDetected}</strong></span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : displayAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <Users size={32} className="text-muted-foreground/40" />
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                {showSeen || alerts.length === 0
                  ? 'No insider cluster alerts yet'
                  : 'All alerts marked as seen'}
              </p>
              <p className="text-xs text-muted-foreground/60 max-w-sm">
                Clusters appear when 2+ Form 4 open-market purchases occur for the same ticker within 7 days.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {displayAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} onMarkSeen={handleMarkSeen} />
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Recent individual Form 4 open-market purchases */}
        {recentFilings.length > 0 && (
          <div className="border-t border-border pt-4">
            <h4 className="text-[11px] uppercase font-bold tracking-wider text-muted-foreground mb-3">
              Recent Form 4 Open-Market Buys ({recentFilings.length})
            </h4>
            <div className="flex flex-col gap-2">
              {recentFilings.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-secondary/10 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TrendingUp size={12} className="text-green-500 shrink-0" />
                    <span className="font-mono font-bold text-foreground">{f.ticker}</span>
                    <span className="text-foreground truncate">{f.insiderName}</span>
                    {f.insiderRole && (
                      <span className="text-muted-foreground hidden sm:inline">· {f.insiderRole}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-primary font-semibold">{formatValue(f.totalValue)}</span>
                    <span className="text-muted-foreground">
                      {f.shares.toLocaleString()} sh @ {formatValue(f.pricePerShare)}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      {new Date(f.filingDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
