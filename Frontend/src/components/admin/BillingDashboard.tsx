import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { billingApi } from '../../api/services';
import { BillingRun, Subscription } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Zap,
  RotateCw,
} from 'lucide-react';

export const BillingDashboard: React.FC = () => {
  const [billingRuns, setBillingRuns] = useState<BillingRun[]>([]);
  const [dueSubscriptions, setDueSubscriptions] = useState<Subscription[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRunningBatch, setIsRunningBatch] = useState(false);

  const { showToast } = useToast();

  const loadData = async () => {
    try {
      const runsRes = await billingApi.getRuns().catch(() => ({ success: false, data: [] }));
      if (runsRes && runsRes.success) setBillingRuns(runsRes.data || []);
    } catch (e) {
      // ignore
    }

    try {
      const dueRes = await billingApi.preview().catch(() => ({ success: false, data: [] }));
      if (dueRes && dueRes.success) setDueSubscriptions(dueRes.data || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRunBillingBatch = async () => {
    setIsRunningBatch(true);
    try {
      const res = await billingApi.runBilling();
      if (res.success) {
        showToast(res.message || 'Billing batch executed successfully', { type: 'success' });
        await loadData();
      }
    } catch (error) {
      const responseMessage = axios.isAxiosError(error) &&
        error.response?.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string'
        ? error.response.data.message
        : undefined;
      showToast('Billing run failed', {
        type: 'error',
        message: responseMessage || (error instanceof Error ? error.message : 'Please try again.'),
      });
    } finally {
      setIsRunningBatch(false);
    }
  };

  const totalDueAmount = dueSubscriptions.reduce((acc, s) => acc + s.totalAmount, 0);
  const latestRun = billingRuns[0];

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

      {/* KPI Bento Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <BentoCard glow className="p-4">
          <div className="text-xs text-slate-400">Subscriptions Due for Billing</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{dueSubscriptions.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Value: ${totalDueAmount.toLocaleString()}</div>
        </BentoCard>

        <BentoCard glow className="p-4">
          <div className="text-xs text-slate-400">Billing Runs Recorded</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{billingRuns.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Most recent runs</div>
        </BentoCard>

        <BentoCard glow className="p-4">
          <div className="text-xs text-slate-400">Latest Run Successful</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {latestRun?.successful ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Invoices created</div>
        </BentoCard>

        <BentoCard glow className="p-4">
          <div className="text-xs text-slate-400">Latest Run Failed</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {latestRun?.failed ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Items needing attention</div>
        </BentoCard>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <BentoCard
          title="Automated Billing Run Ledger"
          subtitle="Audit log of batch billing executions and processed totals"
          className="lg:col-span-12"
        >
          <div className="space-y-3 mt-2">
            {billingRuns.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-500">No billing runs have been recorded.</p>
            )}
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
