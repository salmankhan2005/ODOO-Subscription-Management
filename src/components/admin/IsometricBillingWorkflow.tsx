import React, { useState } from 'react';
import { motion } from 'motion/react';

interface IsometricBillingWorkflowProps {
  dueCount: number;
  totalDueAmount: number;
  dunningActiveCount: number;
  isRunningBatch: boolean;
  batchStepIndex: number; // -1 when idle, 0..3 when running
}

export const IsometricBillingWorkflow: React.FC<IsometricBillingWorkflowProps> = ({
  dueCount,
  totalDueAmount,
  dunningActiveCount,
  isRunningBatch,
  batchStepIndex
}) => {
  const [inspectedNode, setInspectedNode] = useState<number>(0);

  const activeIndex = isRunningBatch ? batchStepIndex : inspectedNode;

  const nodes = [
    {
      id: 0,
      cx: 95,
      cy: 95,
      code: '01',
      label: 'COHORT QUEUE',
      metric: `${dueCount} Contracts`,
      summary: `Aggregates ${dueCount} active recurring subscriptions totaling $${totalDueAmount.toLocaleString()} queued for current cycle.`
    },
    {
      id: 1,
      cx: 245,
      cy: 95,
      code: '02',
      label: 'TAX & DISCOUNTS',
      metric: '18% GST/VAT',
      summary: 'Applies statutory 18% jurisdiction tax rules and active multi-seat promo vouchers automatically.'
    },
    {
      id: 2,
      cx: 395,
      cy: 95,
      code: '03',
      label: 'INVOICE LEDGER',
      metric: 'Sync Numbering',
      summary: 'Generates immutable sequential invoice statements and dispatches customer webhooks.'
    },
    {
      id: 3,
      cx: 545,
      cy: 95,
      code: '04',
      label: 'RAIL & DUNNING',
      metric: `${dunningActiveCount} In Retry`,
      summary: 'Settles primary card/ACH mandates and routes soft declines to timed backup dunning rails.'
    }
  ];

  const current = nodes[Math.max(0, Math.min(3, activeIndex))];

  return (
    <div className="rounded-xl bg-white border border-[#E5ECEC] p-5 sm:p-6 iso-grid-light">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#E5ECEC]">
        <div>
          <h3 className="text-sm font-bold text-[#252B2E] font-display">
            Isometric Batch Execution &amp; Settlement Pipeline
          </h3>
          <p className="text-xs text-[#56666B]">
            Click any stage node to inspect live queue parameters, or execute a batch run to watch real-time settlement traversal.
          </p>
        </div>

        <div className="text-xs font-mono font-semibold text-[#1F3F47]">
          {isRunningBatch ? `LIVE EXECUTION · STAGE 0${batchStepIndex + 1}/04` : 'PIPELINE READY'}
        </div>
      </div>

      {/* Isometric 4-Node Horizontal SVG Stage */}
      <div className="py-4 overflow-x-auto">
        <svg
          viewBox="0 0 640 190"
          className="w-full min-w-[540px] h-auto select-none"
          role="img"
          aria-label="Four-stage isometric billing execution workflow"
        >
          {/* Conduits between nodes */}
          {[0, 1, 2].map((idx) => {
            const x1 = nodes[idx].cx + 55;
            const x2 = nodes[idx + 1].cx - 55;
            const isCoralLink = idx === 2 && dunningActiveCount > 0;
            const linkColor = isCoralLink ? '#E96F50' : '#2E9F92';

            return (
              <g key={idx}>
                <line
                  x1={x1}
                  y1={95}
                  x2={x2}
                  y2={95}
                  stroke={linkColor}
                  strokeWidth="2.5"
                  strokeDasharray={isCoralLink ? '5 3' : undefined}
                  strokeOpacity={isRunningBatch && batchStepIndex >= idx ? '1' : '0.45'}
                />
                <motion.circle
                  cy={95}
                  r={isRunningBatch ? 5.5 : 4}
                  fill={linkColor}
                  animate={{
                    cx: [x1, x2],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: isRunningBatch ? 0.75 : 2.1,
                    repeat: Infinity,
                    delay: idx * 0.35,
                    ease: 'easeInOut'
                  }}
                />
              </g>
            );
          })}

          {/* 4 Isometric Pedestal Slabs */}
          {nodes.map((node) => {
            const isSelected = activeIndex === node.id;
            const isDunningNode = node.id === 3 && dunningActiveCount > 0;

            return (
              <motion.g
                key={node.id}
                onClick={() => !isRunningBatch && setInspectedNode(node.id)}
                animate={{
                  y: isSelected ? -8 : 0
                }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="cursor-pointer"
              >
                {/* Ground Shadow */}
                <polygon
                  points={`${node.cx},66 ${node.cx + 62},98 ${node.cx},130 ${node.cx - 62},98`}
                  fill="#345C64"
                  fillOpacity={isSelected ? '0.16' : '0.07'}
                  transform="translate(0, 15)"
                />
                {/* Left 3D Wall */}
                <polygon
                  points={`${node.cx - 62},95 ${node.cx},127 ${node.cx},141 ${node.cx - 62},109`}
                  fill={isSelected ? '#27484F' : '#D5E4E4'}
                />
                {/* Right 3D Wall */}
                <polygon
                  points={`${node.cx + 62},95 ${node.cx},127 ${node.cx},141 ${node.cx + 62},109`}
                  fill={isSelected ? '#1F3F47' : '#BDD1D1'}
                />
                {/* Top Diamond */}
                <polygon
                  points={`${node.cx},63 ${node.cx + 62},95 ${node.cx},127 ${node.cx - 62},95`}
                  fill={isSelected ? '#345C64' : '#FFFFFF'}
                  stroke={
                    isSelected
                      ? isDunningNode
                        ? '#E96F50'
                        : '#2E9F92'
                      : '#345C64'
                  }
                  strokeWidth={isSelected ? '2.2' : '1.2'}
                />
                <text
                  x={node.cx}
                  y={92}
                  textAnchor="middle"
                  fill={isSelected ? '#FFFFFF' : '#1F3F47'}
                  fontSize="9.5"
                  fontWeight="700"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {node.code} · {node.label}
                </text>
                <text
                  x={node.cx}
                  y={106}
                  textAnchor="middle"
                  fill={
                    isSelected
                      ? '#DDF3F0'
                      : isDunningNode
                        ? '#E96F50'
                        : '#2E9F92'
                  }
                  fontSize="9"
                  fontWeight="600"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {node.metric}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Active Stage Strip */}
      <div className="rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="text-[#252B2E]">
          <span className="font-mono font-bold text-[#1F3F47]">STAGE {current.code}: </span>
          <span>{current.summary}</span>
        </div>
        <span className="font-mono font-semibold text-[#345C64] whitespace-nowrap shrink-0">
          {current.metric}
        </span>
      </div>
    </div>
  );
};
