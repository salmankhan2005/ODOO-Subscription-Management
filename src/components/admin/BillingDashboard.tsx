import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { billingApi } from '../../api/services';
import { BillingRun, DunningEvent, Subscription } from '../../types';
import { BentoCard } from '../common/BentoCard';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { IsometricBillingWorkflow } from './IsometricBillingWorkflow';
import { useToast } from '../../context/ToastContext';
import { Zap, RotateCw, Server } from 'lucide-react';

export const BillingDashboard: React.FC = () => {
  const [billingRuns, setBillingRuns] = useState<BillingRun[]>([]);
  const [dunningEvents, setDunningEvents] = useState<DunningEvent[]>([]);
  const [dueSubscriptions, setDueSubscriptions] = useState<Subscription[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Animated batch execution state
  const [isRunningBatch, setIsRunningBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchStepIndex, setBatchStepIndex] = useState(-1);
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
    setBatchStepIndex(0);
    setBatchProgress(18);
    setBatchStage('Aggregating active recurring subscriptions in current billing cohort...');

    setTimeout(() => {
      setBatchStepIndex(1);
      setBatchProgress(46);
      setBatchStage('Applying statutory 18% GST/VAT rules and verified discount vouchers...');
    }, 550);

    setTimeout(() => {
      setBatchStepIndex(2);
      setBatchProgress(78);
      setBatchStage('Generating sequential invoice ledgers and dispatching customer webhooks...');
    }, 1150);

    setTimeout(async () => {
      setBatchStepIndex(3);
      setBatchProgress(100);
      setBatchStage('Settling payment mandates and updating billing run ledger.');
      const res = await billingApi.runBillingBatch();
      setIsRunningBatch(false);
      setBatchStepIndex(-1);
      if (res.success) {
        showToast(res.message || 'Billing batch executed successfully', { type: 'success' });
        loadData();
      }
    }, 1850);
  };

  const handleRetryDunning = async (d: DunningEvent) => {
    const res = await billingApi.retryDunning(d.id);
    if (res.success) {
      showToast(`Recovered $${d.amount.toLocaleString()} on ${d.invoiceNumber} via alternate settlement rail`);
      loadData();
    }
  };

  const totalDueAmount = dueSubscriptions.reduce((acc, s) => acc + s.totalAmount, 0);
  const activeDunningCount = dunningEvents.filter((e) => e.status !== 'recovered').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#252B2E] font-display">
            Batch Billing &amp; Dunning Studio
          </h1>
          <p className="text-xs text-[#56666B] mt-1">
            Automated billing cycle orchestrator, multi-rail retry cascades, and involuntary churn recovery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E5ECEC] hover:border-[#345C64]/50 text-[#252B2E] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <span>Preview Due Queue ({dueSubscriptions.length})</span>
          </button>
          <button
            type="button"
            onClick={handleRunBillingBatch}
            disabled={isRunningBatch}
            className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
          >
            {isRunningBatch ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Executing Batch...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 transition-transform duration-150 group-hover:scale-115 group-hover:-rotate-6" />
                <span>Execute Batch Billing Run</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Animated Progress Banner when Running */}
      <AnimatePresence>
        {isRunningBatch && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="p-4 rounded-xl bg-[#DDF3F0] border border-[#2E9F92]/50 space-y-2"
          >
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-[#1F3F47] flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-[#2E9F92] animate-spin" />
                <span>{batchStage}</span>
              </span>
              <span className="font-mono tabular-nums text-[#1F3F47] font-bold">{batchProgress}%</span>
            </div>
            <div className="w-full h-2 bg-white rounded-full overflow-hidden">
              <motion.div
                initial={false}
                animate={{ scaleX: batchProgress / 100 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="h-full w-full origin-left bg-[#2E9F92] rounded-full"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero KPI Row: Primary Teal (#345C64) Anchor Cards + Crisp White Operational Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BentoCard variant="teal" className="p-5">
          <div className="text-xs text-[#DDF3F0]">Subscriptions Queued</div>
          <div className="text-2xl font-extrabold font-mono text-white mt-1">
            <AnimatedCounter value={dueSubscriptions.length} />
          </div>
          <div className="text-[11px] text-[#8CE6DB] font-mono tabular-nums mt-1">
            Batch Value: <AnimatedCounter value={totalDueAmount} prefix="$" />
          </div>
        </BentoCard>

        <BentoCard variant="teal" className="p-5">
          <div className="text-xs text-[#DDF3F0]">Autonomous Recovery Rate</div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-white mt-1">94.8%</div>
          <div className="text-[11px] text-[#DDF3F0]/85 mt-1">Multi-rail card &amp; ACH cascade</div>
        </BentoCard>

        <BentoCard className="p-5">
          <div className="text-xs text-[#56666B]">Active Dunning Retries</div>
          <div className="text-2xl font-extrabold font-mono text-[#E96F50] mt-1">
            <AnimatedCounter value={activeDunningCount} />
          </div>
          <div className="text-[11px] text-[#56666B] mt-1">Scheduled fallback evaluation</div>
        </BentoCard>

        <BentoCard className="p-5">
          <div className="text-xs text-[#56666B]">Invoice Automation Coverage</div>
          <div className="text-2xl font-extrabold font-mono tabular-nums text-[#2E9F92] mt-1">100%</div>
          <div className="text-[11px] text-[#56666B] mt-1">Zero manual spreadsheet entry</div>
        </BentoCard>
      </div>

      {/* Interactive Isometric Batch Workflow Pipeline */}
      <IsometricBillingWorkflow
        dueCount={dueSubscriptions.length}
        totalDueAmount={totalDueAmount}
        dunningActiveCount={activeDunningCount}
        isRunningBatch={isRunningBatch}
        batchStepIndex={batchStepIndex}
      />

      {/* Main Studio Split: Smart Dunning Events & Billing Run Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <BentoCard
          title="Smart Dunning & Revenue Recovery Queue"
          subtitle="Declined renewals routed through intelligent backup payment rails"
          className="lg:col-span-7"
        >
          <div className="space-y-3 mt-1">
            {dunningEvents.map((evt) => (
              <motion.div
                key={evt.id}
                layout
                transition={{ duration: 0.18 }}
                className="p-4 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5ECEC] pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#252B2E]">{evt.invoiceNumber}</span>
                      <span className="text-xs text-[#56666B]">· {evt.customerName}</span>
                    </div>
                    <div className="text-[11px] font-medium text-[#C85234] mt-0.5">
                      {evt.lastFailureReason}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <span className="font-mono tabular-nums text-sm font-bold text-[#252B2E]">
                      ${evt.amount.toLocaleString()}
                    </span>
                    <StatusBadge status={evt.status} />
                  </div>
                </div>

                <div className="text-xs text-[#252B2E] flex items-start gap-2 bg-white p-3 rounded-lg border border-[#E5ECEC]">
                  <Server className="w-3.5 h-3.5 text-[#345C64] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#1F3F47]">Recovery Policy: </span>
                    <span className="text-[#56666B]">{evt.recoveryStrategy}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-[#56666B] font-mono tabular-nums text-[11px]">
                    Attempt {evt.attemptNumber} of {evt.maxAttempts} · Next retry: {evt.nextRetryDate}
                  </span>

                  {evt.status !== 'recovered' && (
                    <button
                      type="button"
                      onClick={() => handleRetryDunning(evt)}
                      className="group px-3 py-1.5 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <RotateCw className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180" />
                      <span>Trigger Alternate Rail</span>
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </BentoCard>

        {/* Right: Automated Billing Runs Log */}
        <BentoCard
          title="Batch Billing Audit Ledger"
          subtitle="Immutable log of executed billing runs and generated invoices"
          className="lg:col-span-5"
        >
          <div className="space-y-3 mt-1">
            {billingRuns.map((run) => (
              <motion.div
                key={run.id}
                layout
                transition={{ duration: 0.18 }}
                className="p-3.5 rounded-xl bg-[#F7FAFA] border border-[#E5ECEC] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[#1F3F47] font-bold">{run.id}</span>
                  <StatusBadge status={run.status} />
                </div>
                <div className="flex justify-between text-[#56666B]">
                  <span>Executed: {run.startedAt}</span>
                  <span className="font-mono tabular-nums text-[#2E9F92] font-bold">
                    ${run.totalBilledAmount.toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#E5ECEC] flex justify-between text-[11px] text-[#56666B]">
                  <span>{run.totalProcessed} Contracts Evaluated</span>
                  <span className="text-[#1E7A70] font-semibold">{run.successful} Invoices Created</span>
                </div>
              </motion.div>
            ))}
          </div>
        </BentoCard>
      </div>

      {/* Due Subscriptions Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Queued Subscriptions for Current Billing Cycle"
        subtitle={`${dueSubscriptions.length} active contracts scheduled for invoice generation`}
        maxWidth="2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="border border-[#E5ECEC] rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#F7FAFA] text-[#56666B] text-[11px] border-b border-[#E5ECEC]">
                <tr>
                  <th className="p-3 font-semibold">Subscription</th>
                  <th className="p-3 font-semibold">Customer</th>
                  <th className="p-3 font-semibold">Next Due</th>
                  <th className="p-3 font-semibold text-right">Cadence Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5ECEC]">
                {dueSubscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F7FAFA]">
                    <td className="p-3 font-mono font-semibold text-[#1F3F47]">{s.subscriptionNumber}</td>
                    <td className="p-3 text-[#252B2E] font-medium">{s.customerName}</td>
                    <td className="p-3 font-mono tabular-nums text-[#56666B]">{s.nextBillingDate}</td>
                    <td className="p-3 text-right font-mono tabular-nums font-bold text-[#252B2E]">
                      ${s.totalAmount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-[#E5ECEC]">
            <span className="text-[#56666B] font-mono tabular-nums">
              Total Queue Value: <strong className="text-[#2E9F92]">${totalDueAmount.toLocaleString()}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setIsPreviewOpen(false);
                handleRunBillingBatch();
              }}
              className="group px-4 py-2 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-white font-semibold flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 transition-transform duration-150 group-hover:scale-115" />
              <span>Execute Batch Now</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
