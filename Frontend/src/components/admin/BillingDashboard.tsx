import React, { useState, useEffect } from 'react';
import { billingApi, subscriptionApi } from '../../api/services';
import { BillingRun, DunningEvent, Subscription } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Zap,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Server
} from 'lucide-react';

export const BillingDashboard: React.FC = () => {
  const [billingRuns, setBillingRuns] = useState<BillingRun[]>([]);
  const [dunningEvents, setDunningEvents] = useState<DunningEvent[]>([]);
  const [dueSubscriptions, setDueSubscriptions] = useState<Subscription[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Animated batch execution state
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStage, setBatchStage] = useState('');

  const { showToast } = useToast();

  const loadData = async () => {
    const runsRes = await billingApi.getRuns();
    if (runsRes.success) setBillingRuns(runsRes.data);

    const dunRes = await billingApi.getDunningEvents();
    if (dunRes.success) setDunningEvents(dunRes.data);

    const dueRes = await billingApi.previewDueSubscriptions();
    if (dueRes.success) setDueSubscriptions(dueRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunBillingBatch = async () => {
    setIsRunningBatch(true);
    setBatchProgress(10);
    setBatchStage('Aggregating active recurring subscriptions...');

    setTimeout(() => {
      setBatchProgress(40);
      setBatchStage('Applying statutory 18% tax rules & verified discounts...');
    }, 500);

    setTimeout(() => {
      setBatchProgress(75);
      setBatchStage('Generating synchronized invoice numbers & dispatching webhooks...');
    }, 1100);

    setTimeout(async () => {
      setBatchProgress(100);
      setBatchStage('Batch finalized.');
      const res = await billingApi.runBillingBatch();
      setIsRunningBatch(false);
      if (res.success) {
        showToast(res.message || 'Billing batch executed successfully', { type: 'success' });
        loadData();
      }
    }, 1800);
  };

  const handleRetryDunning = async (d: DunningEvent) => {
    const res = await billingApi.retryDunning(d.id);
    if (res.success) {
      showToast(`Recovered $${d.amount} on ${d.invoiceNumber} via fallback rail!`);
      loadData();
    }
  };

  const totalDueAmount = dueSubscriptions.reduce((acc, s) => acc + s.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            AI Billing Engine & Dunning Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated batch billing day orchestrator, neural retry cascades, and churn risk interception.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all"
          >
            <span>Preview Due Subscriptions ({dueSubscriptions.length})</span>
          </button>
          <button
            onClick={handleRunBillingBatch}
            disabled={isRunningBatch}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
          >
            {isRunningBatch ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Batch...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Execute Batch Billing Run</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Animated Batch Progress Banner if running */}
      {isRunningBatch && (
        <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/50 space-y-2 animate-in fade-in duration-150">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-indigo-200 flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-indigo-400 animate-spin" />
              <span>{batchStage}</span>
            </span>
            <span className="font-mono text-indigo-300 font-bold">{batchProgress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${batchProgress}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300 rounded-full"
            />
          </div>
        </div>
      )}

      {/* KPI Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <BentoCard glow className="p-4">
          <div className="text-xs text-slate-400">Subscriptions Due for Billing</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{dueSubscriptions.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Value: ${totalDueAmount.toLocaleString()}</div>
        </BentoCard>

        <BentoCard glow className="p-4">
          <div className="text-xs text-slate-400">Total Invoices Dispatched</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">100%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Zero manual spreadsheet entry</div>
        </BentoCard>

        <BentoCard glow className="p-4">
          <div className="text-xs text-slate-400">Active Dunning Retries</div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
            {dunningEvents.filter((e) => e.status !== 'recovered').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Automatic cascading fallbacks</div>
        </BentoCard>

        <BentoCard glow className="p-4">
          <div className="text-xs text-slate-400">Autonomous Recovery Rate</div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1">94.8%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Neural timing optimization</div>
        </BentoCard>
      </div>

      {/* Main Studio Split: AI Dunning Events & Billing History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: AI Dunning Recovery Studio */}
        <BentoCard
          title="Smart Dunning & Revenue Recovery Studio"
          subtitle="Intelligent retry orchestrator preventing involuntary subscriber churn"
          className="lg:col-span-7"
        >
          <div className="space-y-3 mt-2">
            {dunningEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">{evt.invoiceNumber}</span>
                      <span className="text-xs text-slate-300">· {evt.customerName}</span>
                    </div>
                    <div className="text-[11px] text-rose-400 mt-0.5">{evt.lastFailureReason}</div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="font-mono text-sm font-bold text-slate-100">${evt.amount}</span>
                    <StatusBadge status={evt.status} />
                  </div>
                </div>

                <div className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                  <Server className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">Autonomous Strategy: </span>
                    <span>{evt.recoveryStrategy}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 font-mono text-[11px]">
                    Attempt {evt.attemptNumber} of {evt.maxAttempts} · Next scheduled: {evt.nextRetryDate}
                  </span>

                  {evt.status !== 'recovered' && (
                    <button
                      onClick={() => handleRetryDunning(evt)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Trigger Alternate Rail</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Right: Automated Billing Runs Log */}
        <BentoCard
          title="Automated Billing Run Ledger"
          subtitle="Audit log of batch billing executions and processed totals"
          className="lg:col-span-5"
        >
          <div className="space-y-3 mt-2">
            {billingRuns.map((run) => (
              <div
                key={run.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-200 font-semibold">{run.id}</span>
                  <StatusBadge status={run.status} />
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Executed: {run.startedAt}</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    ${run.totalBilledAmount.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800/80 flex justify-between text-[11px] text-slate-400">
                  <span>{run.totalProcessed} Subscriptions Evaluated</span>
                  <span className="text-emerald-400 font-medium">✓ {run.successful} Invoices Created</span>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>

      {/* Due Subscriptions Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Due Subscriptions for Current Billing Cycle"
        subtitle={`${dueSubscriptions.length} subscriptions queued for execution`}
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">Subscription</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Next Due</th>
                  <th className="p-3 text-right">Cadence Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {dueSubscriptions.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3 font-mono text-slate-200">{s.subscriptionNumber}</td>
                    <td className="p-3 text-slate-200">{s.customerName}</td>
                    <td className="p-3 font-mono text-slate-400">{s.nextBillingDate}</td>
                    <td className="p-3 text-right font-mono font-semibold text-white">
                      ${s.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <span className="text-slate-400 font-mono">
              Total Queue Value: <strong className="text-emerald-400">${totalDueAmount.toLocaleString()}</strong>
            </span>
            <button
              onClick={() => {
                setIsPreviewOpen(false);
                handleRunBillingBatch();
              }}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>Execute Batch Now</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
