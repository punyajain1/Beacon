'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Network,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Upload,
  ZoomIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import type { ComponentType } from 'react';

interface ForceGraphProps {
  graphData: {
    nodes: { id: string; label?: string; x?: number; y?: number }[];
    links: { source: string; target: string; amount: number; date: string }[];
  };
  width?: number;
  height?: number;
  backgroundColor?: string;
  nodeLabel?: (node: GraphCanvasNode) => string;
  nodeColor?: (node: GraphCanvasNode) => string;
  nodeRelSize?: number;
  linkColor?: () => string;
  linkDirectionalArrowLength?: number;
  linkDirectionalArrowRelPos?: number;
  linkLabel?: (link: GraphEdge) => string;
  linkWidth?: number;
  onNodeClick?: (node: GraphCanvasNode) => void;
  nodeCanvasObject?: (
    node: GraphCanvasNode,
    ctx: CanvasRenderingContext2D,
    globalScale: number
  ) => void;
}

// SSR-safe import for react-force-graph-2d
const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d'),
  { ssr: false }
) as unknown as ComponentType<ForceGraphProps>;

const API_BASE = 'http://localhost:4000/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FraudRing {
  id: string;
  nodes: string[];
  edges: GraphEdge[];
  riskScore: number;
  totalMoved: number;
  status: string;
  detectedAt: string;
}

interface GraphNode {
  id: string;
  label: string;
}

interface GraphCanvasNode {
  id: string;
  label?: string;
  x?: number;
  y?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  amount: number;
  date: string;
}

interface GraphData {
  nodes: { id: string; label?: string }[];
  links: { source: string; target: string; amount: number; date: string }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function riskBadgeStyle(score: number) {
  if (score >= 70) return 'bg-red-500/15 text-red-400 border-red-500/30';
  if (score >= 40) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
}

function riskLabel(score: number) {
  if (score >= 70) return 'High Risk';
  if (score >= 40) return 'Medium Risk';
  return 'Low Risk';
}

function statusBadgeStyle(status: string) {
  switch (status) {
    case 'INVESTIGATED':
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    case 'CLEARED':
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    default:
      return 'bg-red-500/15 text-red-300 border-red-500/30';
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FraudGraph({ className }: { className?: string }) {
  const [activeTab, setActiveTab] = useState<'detect' | 'graph'>('detect');

  // Detect Rings state
  const [rings, setRings] = useState<FraudRing[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'INVESTIGATED' | 'CLEARED'>('ALL');
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState('');

  // CSV upload state
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual ingest state
  const [form, setForm] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    date: '',
  });
  const [ingestMsg, setIngestMsg] = useState('');
  const [ingesting, setIngesting] = useState(false);

  // Account Graph state
  const [accountId, setAccountId] = useState('');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState('');
  const [highlightNode, setHighlightNode] = useState('');
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const [graphWidth, setGraphWidth] = useState(720);

  // Measure graph container width responsively
  useEffect(() => {
    const el = graphContainerRef.current;
    if (!el) return;
    const updateWidth = () => {
      if (el.clientWidth > 0) setGraphWidth(el.clientWidth);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab, graphData]);

  // Derived KPI metrics
  const stats = useMemo(() => {
    const highRisk = rings.filter((r) => r.riskScore >= 70).length;
    const openCount = rings.filter((r) => r.status === 'OPEN').length;
    const totalVolume = rings.reduce((acc, r) => acc + (Number(r.totalMoved) || 0), 0);
    return {
      total: rings.length,
      highRisk,
      openCount,
      totalVolume,
    };
  }, [rings]);

  const filteredRings = useMemo(() => {
    if (statusFilter === 'ALL') return rings;
    return rings.filter((r) => r.status === statusFilter);
  }, [rings, statusFilter]);

  const sampleAccounts = useMemo(() => {
    const set = new Set<string>();
    rings.forEach((r) => r.nodes.forEach((n) => set.add(n)));
    return Array.from(set).slice(0, 6);
  }, [rings]);

  // ── Detect rings ──────────────────────────────────────────────────────────

  const runDetection = async () => {
    setDetecting(true);
    setDetectError('');
    try {
      const res = await fetch(`${API_BASE}/fraud/detect`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Detection failed');
      setRings(json.data ?? []);
    } catch (err: unknown) {
      setDetectError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setDetecting(false);
    }
  };

  const loadDemoData = async () => {
    setDetecting(true);
    setDetectError('');
    const now = new Date().toISOString().split('T')[0];
    const demoTransactions = [
      { fromAccount: 'MULE-A', toAccount: 'MULE-B', amount: 48500, currency: 'USD', date: now, description: 'Wire Transfer #101' },
      { fromAccount: 'MULE-B', toAccount: 'MULE-C', amount: 48200, currency: 'USD', date: now, description: 'Wire Transfer #102' },
      { fromAccount: 'MULE-C', toAccount: 'MULE-D', amount: 47900, currency: 'USD', date: now, description: 'Wire Transfer #103' },
      { fromAccount: 'MULE-D', toAccount: 'MULE-A', amount: 47600, currency: 'USD', date: now, description: 'Wire Transfer #104' },
      { fromAccount: 'SHELL-1', toAccount: 'HUB-9', amount: 9800, currency: 'USD', date: now, description: 'Structured Deposit' },
      { fromAccount: 'SHELL-2', toAccount: 'HUB-9', amount: 9750, currency: 'USD', date: now, description: 'Structured Deposit' },
      { fromAccount: 'SHELL-3', toAccount: 'HUB-9', amount: 9900, currency: 'USD', date: now, description: 'Structured Deposit' },
      { fromAccount: 'HUB-9', toAccount: 'OFFSHORE-X', amount: 29200, currency: 'USD', date: now, description: 'Consolidation Sweep' },
      { fromAccount: 'OFFSHORE-X', toAccount: 'SHELL-1', amount: 28900, currency: 'USD', date: now, description: 'Return Layering' },
    ];
    try {
      const ingestRes = await fetch(`${API_BASE}/fraud/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: demoTransactions }),
      });
      const ingestJson = await ingestRes.json();
      if (!ingestJson.success) throw new Error(ingestJson.message || 'Demo ingest failed');

      const detectRes = await fetch(`${API_BASE}/fraud/detect`);
      const detectJson = await detectRes.json();
      if (!detectJson.success) throw new Error(detectJson.message || 'Detection failed');
      setRings(detectJson.data ?? []);
      setAccountId('MULE-A');
      setCsvResult('✓ Loaded 9 demo transactions & ran ring detection');
    } catch (err: unknown) {
      setDetectError(err instanceof Error ? err.message : 'Failed to load demo data');
    } finally {
      setDetecting(false);
    }
  };

  const fetchRings = async (status?: string) => {
    setDetectError('');
    try {
      const url = status
        ? `${API_BASE}/fraud/rings?status=${status}`
        : `${API_BASE}/fraud/rings`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setRings(json.data ?? []);
    } catch (err: unknown) {
      setDetectError(err instanceof Error ? err.message : 'Failed to load saved rings');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/fraud/rings/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        setRings((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        );
      }
    } catch {}
  };

  // ── CSV upload ────────────────────────────────────────────────────────────

  const uploadCsvFile = async (file: File) => {
    setCsvUploading(true);
    setCsvResult('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_BASE}/fraud/upload-csv`, {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();
      if (json.success) {
        setCsvResult(`✓ Ingested ${json.data.ingested} transactions from ${file.name}`);
      } else {
        setCsvResult(`✗ ${json.message}`);
      }
    } catch (err: unknown) {
      setCsvResult(`✗ ${err instanceof Error ? err.message : 'Upload failed'}`);
    } finally {
      setCsvUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadCsvFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadCsvFile(file);
  };

  // ── Manual ingest ─────────────────────────────────────────────────────────

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIngesting(true);
    setIngestMsg('');
    try {
      const res = await fetch(`${API_BASE}/fraud/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: [
            {
              fromAccount: form.fromAccount,
              toAccount: form.toAccount,
              amount: parseFloat(form.amount),
              date: form.date,
            },
          ],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIngestMsg('✓ Transaction added to ledger');
        setForm({ fromAccount: '', toAccount: '', amount: '', date: '' });
      } else {
        setIngestMsg(`✗ ${json.message}`);
      }
    } catch (err: unknown) {
      setIngestMsg(`✗ ${err instanceof Error ? err.message : 'Ingest failed'}`);
    } finally {
      setIngesting(false);
    }
  };

  // ── Account graph ─────────────────────────────────────────────────────────

  const loadGraph = useCallback(async (id: string) => {
    if (!id) return;
    setGraphLoading(true);
    setGraphError('');
    setHighlightNode(id);
    try {
      const res = await fetch(`${API_BASE}/fraud/graph/${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Failed to load graph');
      const { nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] } =
        json.data;
      setGraphData({
        nodes: nodes.map((n) => ({ id: n.id, label: n.label })),
        links: edges.map((e) => ({
          source: e.source,
          target: e.target,
          amount: e.amount,
          date: e.date,
        })),
      });
    } catch (err: unknown) {
      setGraphError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setGraphLoading(false);
    }
  }, []);

  const handleLoadGraph = () => loadGraph(accountId.trim());

  const inspectAccount = (id: string) => {
    setAccountId(id);
    setActiveTab('graph');
    loadGraph(id);
  };

  const handleNodeClick = useCallback(
    (node: GraphCanvasNode) => {
      setAccountId(node.id);
      loadGraph(node.id);
    },
    [loadGraph]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={cn('flex flex-col gap-6 w-full', className)}>
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="text-red-400 w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Money Mule Ring Detector
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Graph cycle analysis for circular layering, smurfing hubs, and rapid pass-through accounts.
            </p>
          </div>
        </div>

        {/* Segmented Tab Switcher + Primary Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center p-1 rounded-xl bg-secondary/70 border border-border">
            <button
              onClick={() => setActiveTab('detect')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeTab === 'detect'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Detect Rings
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeTab === 'graph'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Network className="w-3.5 h-3.5" />
              Account Graph
            </button>
          </div>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-card border border-border p-4 flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            Detected Rings
          </span>
          <span className="text-2xl font-bold text-foreground">{stats.total}</span>
          <span className="text-xs text-muted-foreground">Active cycle clusters</span>
        </div>
        <div className="rounded-xl bg-card border border-border p-4 flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            High Risk (70+)
          </span>
          <span className={cn('text-2xl font-bold', stats.highRisk > 0 ? 'text-red-400' : 'text-foreground')}>
            {stats.highRisk}
          </span>
          <span className="text-xs text-muted-foreground">Priority escalation</span>
        </div>
        <div className="rounded-xl bg-card border border-border p-4 flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            Flagged Volume
          </span>
          <span className="text-2xl font-bold text-primary">
            ${stats.totalVolume.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">Aggregate ring flow</span>
        </div>
        <div className="rounded-xl bg-card border border-border p-4 flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
            Open Cases
          </span>
          <span className="text-2xl font-bold text-foreground">{stats.openCount}</span>
          <span className="text-xs text-muted-foreground">Pending review</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── DETECT RINGS TAB ────────────────────────────────────────────── */}
        {activeTab === 'detect' && (
          <motion.div
            key="detect"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Left Column: Detected Rings Feed */}
            <div className="lg:col-span-7 rounded-xl bg-card border border-border p-5 flex flex-col gap-4 min-h-[460px]">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={runDetection}
                    disabled={detecting}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-4 py-2 rounded-xl text-xs font-semibold transition-colors shadow-sm shadow-primary/15"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${detecting ? 'animate-spin' : ''}`} />
                    {detecting ? 'Scanning Graph…' : 'Run Detection'}
                  </button>
                  <button
                    onClick={loadDemoData}
                    disabled={detecting}
                    className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 disabled:opacity-50 text-emerald-300 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Load Demo Data
                  </button>
                  <button
                    onClick={() => fetchRings()}
                    className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground px-3.5 py-2 rounded-xl text-xs font-medium transition-colors"
                  >
                    <Database className="w-3.5 h-3.5 text-muted-foreground" />
                    Load Saved
                  </button>
                </div>

                {/* Status Filter Pills */}
                <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-lg border border-border">
                  {(['ALL', 'OPEN', 'INVESTIGATED', 'CLEARED'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        'px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors',
                        statusFilter === status
                          ? 'bg-secondary text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {detectError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/25 px-3.5 py-2.5 text-xs text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{detectError}</span>
                </div>
              )}

              {/* Ring Cards or Empty State */}
              {filteredRings.length > 0 ? (
                <div className="space-y-3 max-h-[540px] overflow-y-auto custom-scrollbar pr-1">
                  {filteredRings.map((ring) => (
                    <motion.div
                      key={ring.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-secondary/20 hover:bg-secondary/35 border border-border rounded-xl p-4 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-[11px] font-bold px-2.5 py-0.5 rounded-full border',
                              riskBadgeStyle(ring.riskScore)
                            )}
                          >
                            {riskLabel(ring.riskScore)} · {ring.riskScore}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                              statusBadgeStyle(ring.status)
                            )}
                          >
                            {ring.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={ring.status}
                            onChange={(e) => updateStatus(ring.id, e.target.value)}
                            aria-label="Update ring status"
                            className="bg-secondary text-foreground text-xs rounded-lg px-2.5 py-1 border border-border focus:outline-none focus:border-primary/50"
                          >
                            <option value="OPEN">OPEN</option>
                            <option value="INVESTIGATED">INVESTIGATED</option>
                            <option value="CLEARED">CLEARED</option>
                          </select>
                          {ring.nodes[0] && (
                            <button
                              onClick={() => inspectAccount(ring.nodes[0])}
                              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline px-2 py-1"
                              title="Open in Account Graph"
                            >
                              <Network className="w-3.5 h-3.5" />
                              Graph
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Account Cycle Flow */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        {ring.nodes.map((n, idx) => (
                          <div key={`${n}-${idx}`} className="flex items-center gap-1.5">
                            <button
                              onClick={() => inspectAccount(n)}
                              className="bg-secondary/80 hover:bg-primary/20 hover:text-primary hover:border-primary/40 border border-border text-foreground text-xs px-2.5 py-1 rounded-lg font-mono transition-colors"
                              title={`Inspect ${n} graph`}
                            >
                              {n}
                            </button>
                            {idx < ring.nodes.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-border text-xs text-muted-foreground">
                        <span>
                          Total moved:{' '}
                          <span className="text-foreground font-semibold">
                            ${ring.totalMoved.toLocaleString()}
                          </span>
                        </span>
                        <span>
                          Detected {new Date(ring.detectedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                !detecting && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-14 px-6 rounded-xl border border-dashed border-border bg-secondary/10">
                    <div className="h-12 w-12 rounded-2xl bg-secondary/60 border border-border flex items-center justify-center mb-3">
                      <Network className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {rings.length === 0 ? 'No Mule Rings Detected Yet' : `No ${statusFilter} Rings`}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mt-1.5 mb-5">
                      {rings.length === 0
                        ? 'Upload a CSV ledger, add transactions manually, or load the synthetic demo ring to scan for circular money flow.'
                        : 'Try switching the status filter above to inspect other detected rings.'}
                    </p>
                    {rings.length === 0 && (
                      <div className="flex flex-wrap items-center justify-center gap-2.5">
                        <button
                          onClick={loadDemoData}
                          disabled={detecting}
                          className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Load Demo Ring & Scan
                        </button>
                        <button
                          onClick={runDetection}
                          disabled={detecting}
                          className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground px-4 py-2 rounded-xl text-xs font-medium transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Scan Existing Ledger
                        </button>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Right Column: Data Ingestion (CSV + Manual) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* CSV Dropzone Card */}
              <div className="rounded-xl bg-card border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-primary" />
                    Batch CSV Upload
                  </h2>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Max 10 MB
                  </span>
                </div>

                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    'flex flex-col items-center justify-center text-center rounded-xl border border-dashed p-6 cursor-pointer transition-all',
                    isDragging
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-secondary/15 hover:bg-secondary/30 hover:border-white/20'
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCSVUpload}
                    disabled={csvUploading}
                    className="sr-only"
                  />
                  <div className="h-10 w-10 rounded-xl bg-secondary border border-border flex items-center justify-center mb-3">
                    {csvUploading ? (
                      <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    {csvUploading ? 'Uploading & parsing CSV…' : 'Click to choose CSV or drag & drop'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Required columns below
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    {['fromAccount', 'toAccount', 'amount', 'currency', 'date', 'description'].map(
                      (col) => (
                        <span
                          key={col}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border"
                        >
                          {col}
                        </span>
                      )
                    )}
                  </div>
                </label>

                {csvResult && (
                  <div
                    className={cn(
                      'mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs border',
                      csvResult.startsWith('✓')
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/25 text-red-400'
                    )}
                  >
                    {csvResult.startsWith('✓') ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{csvResult.replace(/^[✓✗]\s*/, '')}</span>
                  </div>
                )}
              </div>

              {/* Manual Transaction Entry Card */}
              <div className="rounded-xl bg-card border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Plus className="w-4 h-4 text-primary" />
                  Add Transaction Manually
                </h2>
                <form onSubmit={handleIngest} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                      From Account
                    </label>
                    <input
                      required
                      placeholder="e.g. MULE-A"
                      value={form.fromAccount}
                      onChange={(e) => setForm((p) => ({ ...p, fromAccount: e.target.value }))}
                      className="w-full bg-secondary/60 text-foreground text-sm rounded-xl px-3.5 py-2.5 placeholder:text-muted-foreground/50 border border-border focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                      To Account
                    </label>
                    <input
                      required
                      placeholder="e.g. MULE-B"
                      value={form.toAccount}
                      onChange={(e) => setForm((p) => ({ ...p, toAccount: e.target.value }))}
                      className="w-full bg-secondary/60 text-foreground text-sm rounded-xl px-3.5 py-2.5 placeholder:text-muted-foreground/50 border border-border focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                      Amount (USD)
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="25000.00"
                      value={form.amount}
                      onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                      className="w-full bg-secondary/60 text-foreground text-sm rounded-xl px-3.5 py-2.5 placeholder:text-muted-foreground/50 border border-border focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                      Transfer Date
                    </label>
                    <input
                      required
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                      className="w-full bg-secondary/60 text-foreground text-sm rounded-xl px-3.5 py-2.5 border border-border focus:outline-none focus:border-primary/50 transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div className="sm:col-span-2 pt-1">
                    <button
                      type="submit"
                      disabled={ingesting}
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors shadow-sm shadow-primary/15"
                    >
                      <Plus className="w-4 h-4" />
                      {ingesting ? 'Adding Transaction…' : 'Add Transaction'}
                    </button>
                  </div>
                </form>

                {ingestMsg && (
                  <p
                    className={cn(
                      'text-xs mt-3 flex items-center gap-1.5',
                      ingestMsg.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'
                    )}
                  >
                    {ingestMsg}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── ACCOUNT GRAPH TAB ────────────────────────────────────────────── */}
        {activeTab === 'graph' && (
          <motion.div
            key="graph"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="rounded-xl bg-card border border-border p-5 flex flex-col gap-4"
          >
            {/* Search bar + quick account chips */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLoadGraph()}
                    placeholder="Enter account ID (e.g. MULE-A, HUB-9)…"
                    className="w-full bg-secondary/60 text-foreground text-sm rounded-xl pl-10 pr-4 py-2.5 border border-border focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground/50 font-mono"
                  />
                </div>
                <button
                  onClick={handleLoadGraph}
                  disabled={graphLoading || !accountId.trim()}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shrink-0"
                >
                  <Network className="w-4 h-4" />
                  {graphLoading ? 'Loading…' : 'Load Graph'}
                </button>
              </div>

              {sampleAccounts.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground mr-1">Flagged accounts:</span>
                  {sampleAccounts.map((acc) => (
                    <button
                      key={acc}
                      onClick={() => inspectAccount(acc)}
                      className={cn(
                        'px-2.5 py-0.5 rounded-full font-mono text-[11px] border transition-colors',
                        highlightNode === acc
                          ? 'bg-primary/15 text-primary border-primary/40'
                          : 'bg-secondary/60 text-muted-foreground border-border hover:text-foreground'
                      )}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {graphError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/25 px-3.5 py-2.5 text-xs text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{graphError}</span>
              </div>
            )}

            {/* Graph Canvas */}
            <div ref={graphContainerRef} className="w-full">
              {graphLoading ? (
                <div className="h-[460px] flex flex-col items-center justify-center gap-3 rounded-xl bg-background border border-border">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                  <p className="text-xs text-muted-foreground">Mapping transaction subgraph…</p>
                </div>
              ) : graphData ? (
                <div className="relative bg-background rounded-xl border border-border overflow-hidden">
                  {/* Overlay Controls & Legend */}
                  <div className="absolute top-3 left-3 z-10 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-card/90 backdrop-blur border border-border text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#bef264]" />
                      Focus Node
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                      Counterparty
                    </span>
                    <span className="hidden sm:flex items-center gap-1 border-l border-border pl-3">
                      <ZoomIn className="w-3.5 h-3.5" />
                      Scroll to zoom · Click node to pivot
                    </span>
                  </div>

                  <ForceGraph2D
                    graphData={graphData}
                    width={graphWidth}
                    height={480}
                    backgroundColor="#0A0A0A"
                    nodeLabel={(node: GraphCanvasNode) => node.label ?? node.id}
                    nodeColor={(node: GraphCanvasNode) =>
                      node.id === highlightNode ? '#bef264' : '#64748b'
                    }
                    nodeRelSize={5}
                    linkColor={() => 'rgba(255,255,255,0.18)'}
                    linkDirectionalArrowLength={4.5}
                    linkDirectionalArrowRelPos={1}
                    linkLabel={(link: GraphEdge) =>
                      `$${Number(link.amount).toLocaleString()}`
                    }
                    linkWidth={1.5}
                    onNodeClick={handleNodeClick}
                    nodeCanvasObject={(
                      node: GraphCanvasNode,
                      ctx: CanvasRenderingContext2D,
                      globalScale: number
                    ) => {
                      const x = node.x ?? 0;
                      const y = node.y ?? 0;
                      const isHighlight = node.id === highlightNode;
                      const r = isHighlight ? 7 : 5;
                      ctx.beginPath();
                      ctx.arc(x, y, r, 0, 2 * Math.PI);
                      ctx.fillStyle = isHighlight ? '#bef264' : '#475569';
                      ctx.fill();
                      if (isHighlight) {
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                      }
                      if (globalScale > 1.2) {
                        const label = node.id;
                        ctx.font = `${11 / globalScale}px monospace`;
                        ctx.fillStyle = isHighlight ? '#bef264' : '#e2e8f0';
                        ctx.textAlign = 'center';
                        ctx.fillText(label, x, y + r + 5 / globalScale);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="h-[380px] flex flex-col items-center justify-center text-center px-6 bg-secondary/10 rounded-xl border border-dashed border-border">
                  <div className="h-12 w-12 rounded-2xl bg-secondary/60 border border-border flex items-center justify-center mb-3">
                    <Network className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Account Network Visualizer
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1.5">
                    Search any account ID above or click an account badge in the Detect Rings tab to explore incoming and outgoing transfer hops.
                  </p>
                </div>
              )}
            </div>

            {/* Stats Footer */}
            {graphData && (
              <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                <div className="flex gap-5">
                  <span>
                    <span className="text-foreground font-semibold">{graphData.nodes.length}</span>{' '}
                    connected accounts
                  </span>
                  <span>
                    <span className="text-foreground font-semibold">{graphData.links.length}</span>{' '}
                    directed transfers
                  </span>
                </div>
                <span className="font-mono text-primary">Focus: {highlightNode}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FraudGraph;
