'use client';

import { useCallback, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Network,
  RefreshCw,
  Search,
  ShieldAlert,
  Upload,
  ZoomIn,
  Plus,
} from 'lucide-react';

// SSR-safe import for react-force-graph-2d
const ForceGraph2D = dynamic(
  () => import('react-force-graph-2d'),
  { ssr: false }
) as any;

const API_BASE = 'http://localhost:4000/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FraudRing {
  id: string;
  nodes: string[];
  edges: any[];
  riskScore: number;
  totalMoved: number;
  status: string;
  detectedAt: string;
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

interface GraphData {
  nodes: { id: string; label?: string }[];
  links: { source: string; target: string; amount: number; date: string }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function riskColor(score: number) {
  if (score >= 70) return 'bg-red-500 text-white';
  if (score >= 40) return 'bg-orange-400 text-white';
  return 'bg-green-500 text-white';
}

function riskLabel(score: number) {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FraudGraph({ className }: { className?: string }) {
  const [activeTab, setActiveTab] = useState<'detect' | 'graph'>('detect');

  // Detect Rings state
  const [rings, setRings] = useState<FraudRing[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState('');

  // CSV upload state
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState('');
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

  // ── Detect rings ──────────────────────────────────────────────────────────

  const runDetection = async () => {
    setDetecting(true);
    setDetectError('');
    try {
      const res = await fetch(`${API_BASE}/fraud/detect`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Detection failed');
      setRings(json.data ?? []);
    } catch (err: any) {
      setDetectError(err.message ?? 'Unknown error');
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
    } catch (err: any) {
      setDetectError(err.message ?? 'Failed to load demo data');
    } finally {
      setDetecting(false);
    }
  };

  const fetchRings = async (status?: string) => {
    try {
      const url = status
        ? `${API_BASE}/fraud/rings?status=${status}`
        : `${API_BASE}/fraud/rings`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setRings(json.data ?? []);
    } catch {}
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

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
        setCsvResult(`✓ Ingested ${json.data.ingested} transactions from CSV`);
      } else {
        setCsvResult(`✗ ${json.message}`);
      }
    } catch (err: any) {
      setCsvResult(`✗ ${err.message}`);
    } finally {
      setCsvUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
        setIngestMsg(`✓ Transaction added`);
        setForm({ fromAccount: '', toAccount: '', amount: '', date: '' });
      } else {
        setIngestMsg(`✗ ${json.message}`);
      }
    } catch (err: any) {
      setIngestMsg(`✗ ${err.message}`);
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
    } catch (err: any) {
      setGraphError(err.message ?? 'Unknown error');
    } finally {
      setGraphLoading(false);
    }
  }, []);

  const handleLoadGraph = () => loadGraph(accountId.trim());

  const handleNodeClick = useCallback(
    (node: any) => {
      setAccountId(node.id);
      loadGraph(node.id);
    },
    [loadGraph]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-700 p-5 ${className ?? ''}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <ShieldAlert className="text-red-400 w-6 h-6" />
        <h2 className="text-white font-bold text-lg">Money Mule Ring Detector</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['detect', 'graph'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {tab === 'detect' ? (
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Detect Rings
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Network className="w-4 h-4" /> Account Graph
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── DETECT RINGS TAB ────────────────────────────────────────────── */}
        {activeTab === 'detect' && (
          <motion.div
            key="detect"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Run Detection */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button
                onClick={runDetection}
                disabled={detecting}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${detecting ? 'animate-spin' : ''}`} />
                {detecting ? 'Detecting…' : 'Run Detection'}
              </button>
              <button
                onClick={loadDemoData}
                disabled={detecting}
                className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 disabled:opacity-50 text-emerald-300 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Load Demo Data
              </button>
              <button
                onClick={() => fetchRings()}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg text-sm transition-colors"
              >
                Load Saved Rings
              </button>
            </div>

            {detectError && (
              <p className="text-red-400 text-sm mb-3">{detectError}</p>
            )}

            {/* Ring Cards */}
            {rings.length > 0 && (
              <div className="space-y-3 mb-6 max-h-72 overflow-y-auto pr-1">
                {rings.map((ring) => (
                  <motion.div
                    key={ring.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${riskColor(ring.riskScore)}`}
                      >
                        {riskLabel(ring.riskScore)} Risk — {ring.riskScore}
                      </span>
                      <select
                        value={ring.status}
                        onChange={(e) => updateStatus(ring.id, e.target.value)}
                        className="bg-gray-700 text-gray-200 text-xs rounded px-2 py-1 border border-gray-600"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="INVESTIGATED">INVESTIGATED</option>
                        <option value="CLEARED">CLEARED</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {ring.nodes.map((n) => (
                        <span
                          key={n}
                          className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full font-mono"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-400 text-xs">
                      Total moved:{' '}
                      <span className="text-white font-semibold">
                        ${ring.totalMoved.toLocaleString()}
                      </span>
                      {' · '}
                      {new Date(ring.detectedAt).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}

            {rings.length === 0 && !detecting && (
              <p className="text-gray-500 text-sm mb-6">
                No rings loaded. Click "Run Detection" to scan transactions.
              </p>
            )}

            {/* Upload CSV */}
            <div className="border border-dashed border-gray-600 rounded-lg p-4 mb-5">
              <p className="text-gray-400 text-sm font-medium mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload CSV
              </p>
              <p className="text-gray-500 text-xs mb-3">
                Headers: fromAccount, toAccount, amount, currency, date, description
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleCSVUpload}
                disabled={csvUploading}
                className="text-sm text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-indigo-600 file:text-white file:text-xs file:cursor-pointer hover:file:bg-indigo-500"
              />
              {csvUploading && (
                <p className="text-indigo-400 text-xs mt-2 animate-pulse">Uploading…</p>
              )}
              {csvResult && (
                <p
                  className={`text-xs mt-2 ${
                    csvResult.startsWith('✓') ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {csvResult}
                </p>
              )}
            </div>

            {/* Manual Transaction Form */}
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-gray-300 text-sm font-medium mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Transaction Manually
              </p>
              <form onSubmit={handleIngest} className="grid grid-cols-2 gap-2">
                <input
                  required
                  placeholder="From Account"
                  value={form.fromAccount}
                  onChange={(e) => setForm((p) => ({ ...p, fromAccount: e.target.value }))}
                  className="bg-gray-700 text-white text-sm rounded px-3 py-2 placeholder-gray-500 border border-gray-600 focus:outline-none focus:border-indigo-500"
                />
                <input
                  required
                  placeholder="To Account"
                  value={form.toAccount}
                  onChange={(e) => setForm((p) => ({ ...p, toAccount: e.target.value }))}
                  className="bg-gray-700 text-white text-sm rounded px-3 py-2 placeholder-gray-500 border border-gray-600 focus:outline-none focus:border-indigo-500"
                />
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  className="bg-gray-700 text-white text-sm rounded px-3 py-2 placeholder-gray-500 border border-gray-600 focus:outline-none focus:border-indigo-500"
                />
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  className="bg-gray-700 text-white text-sm rounded px-3 py-2 placeholder-gray-500 border border-gray-600 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={ingesting}
                  className="col-span-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded text-sm font-medium transition-colors"
                >
                  {ingesting ? 'Adding…' : 'Add Transaction'}
                </button>
              </form>
              {ingestMsg && (
                <p
                  className={`text-xs mt-2 ${
                    ingestMsg.startsWith('✓') ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {ingestMsg}
                </p>
              )}
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
            transition={{ duration: 0.2 }}
          >
            {/* Search bar */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLoadGraph()}
                  placeholder="Enter account ID…"
                  className="w-full bg-gray-800 text-white text-sm rounded-lg pl-9 pr-4 py-2.5 border border-gray-600 focus:outline-none focus:border-indigo-500 placeholder-gray-500"
                />
              </div>
              <button
                onClick={handleLoadGraph}
                disabled={graphLoading || !accountId.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Network className="w-4 h-4" />
                {graphLoading ? 'Loading…' : 'Load Graph'}
              </button>
            </div>

            {graphError && (
              <p className="text-red-400 text-sm mb-3">{graphError}</p>
            )}

            {/* Graph hint */}
            {graphData && (
              <p className="text-gray-500 text-xs mb-2 flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5" />
                Scroll to zoom · Click a node to drill down
              </p>
            )}

            {/* Force Graph */}
            {graphData ? (
              <div className="bg-gray-950 rounded-xl border border-gray-700 overflow-hidden">
                <ForceGraph2D
                  graphData={graphData}
                  width={600}
                  height={420}
                  backgroundColor="#030712"
                  nodeLabel={(node: any) => node.label ?? node.id}
                  nodeColor={(node: any) =>
                    node.id === highlightNode ? '#6366f1' : '#64748b'
                  }
                  nodeRelSize={5}
                  linkColor={() => '#374151'}
                  linkDirectionalArrowLength={4}
                  linkDirectionalArrowRelPos={1}
                  linkLabel={(link: any) =>
                    `$${Number(link.amount).toLocaleString()}`
                  }
                  linkWidth={1.5}
                  onNodeClick={handleNodeClick}
                  nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
                    const isHighlight = node.id === highlightNode;
                    const r = isHighlight ? 7 : 5;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
                    ctx.fillStyle = isHighlight ? '#6366f1' : '#475569';
                    ctx.fill();
                    if (isHighlight) {
                      ctx.strokeStyle = '#a5b4fc';
                      ctx.lineWidth = 2;
                      ctx.stroke();
                    }
                    if (globalScale > 1.5) {
                      const label = node.id as string;
                      ctx.font = `${10 / globalScale}px sans-serif`;
                      ctx.fillStyle = '#e2e8f0';
                      ctx.textAlign = 'center';
                      ctx.fillText(label, node.x, node.y + r + 4 / globalScale);
                    }
                  }}
                />
              </div>
            ) : (
              !graphLoading && (
                <div className="h-48 flex items-center justify-center bg-gray-800 rounded-xl border border-dashed border-gray-700">
                  <p className="text-gray-500 text-sm">
                    Enter an account ID to visualize its transaction network
                  </p>
                </div>
              )
            )}

            {graphLoading && (
              <div className="h-48 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
              </div>
            )}

            {/* Stats */}
            {graphData && (
              <div className="mt-3 flex gap-4 text-xs text-gray-500">
                <span>
                  <span className="text-white font-semibold">
                    {graphData.nodes.length}
                  </span>{' '}
                  accounts
                </span>
                <span>
                  <span className="text-white font-semibold">
                    {graphData.links.length}
                  </span>{' '}
                  transactions
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FraudGraph;
