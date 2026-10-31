import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, BarChart3, Grid, CreditCard, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

type TimeframeKey = 'q3' | 'q4' | 't12m';
type SegmentKey = 'all' | 'odoo' | 'enterprise';

interface MonthPoint {
  period: string;
  baseMrr: number;
  expansionMrr: number;
  contracts: number;
}

interface RailMetric {
  id: string;
  name: string;
  share: number;
  volume: string;
  authRate: string;
  latency: string;
  colorClass: string;
}

interface CohortRow {
  cohort: string;
  startingArr: string;
  cells: number[];
}

interface TelemetrySlice {
  ndr: string;
  grossChurn: string;
  recoveredArr: string;
  dso: string;
  series: MonthPoint[];
  cohorts: CohortRow[];
  rails: RailMetric[];
}

const ANALYTICS_DATA: Record<TimeframeKey, Record<SegmentKey, TelemetrySlice>> = {
  q4: {
    all: {
      ndr: '118.4%',
      grossChurn: '0.8%',
      recoveredArr: '$112,400',
      dso: '4.2 Days',
      series: [
        { period: 'Jul', baseMrr: 68400, expansionMrr: 9200, contracts: 34 },
        { period: 'Aug', baseMrr: 72100, expansionMrr: 11400, contracts: 36 },
        { period: 'Sep', baseMrr: 76900, expansionMrr: 12800, contracts: 38 },
        { period: 'Oct', baseMrr: 81500, expansionMrr: 14100, contracts: 40 },
        { period: 'Nov', baseMrr: 86200, expansionMrr: 15900, contracts: 41 },
        { period: 'Dec', baseMrr: 94820, expansionMrr: 18400, contracts: 42 }
      ],
      cohorts: [
        { cohort: '2026 · Q1', startingArr: '$248K', cells: [100, 99, 102, 106, 111, 115, 118] },
        { cohort: '2026 · Q2', startingArr: '$312K', cells: [100, 100, 104, 108, 113, 117, 119] },
        { cohort: '2026 · Q3', startingArr: '$386K', cells: [100, 99, 103, 109, 114, 116, 0] },
        { cohort: '2026 · Oct', startingArr: '$194K', cells: [100, 101, 106, 112, 0, 0, 0] },
        { cohort: '2026 · Nov', startingArr: '$228K', cells: [100, 102, 107, 0, 0, 0, 0] }
      ],
      rails: [
        {
          id: 'card',
          name: 'Stripe Card Capture',
          share: 62,
          volume: '$58,788 / mo',
          authRate: '98.9%',
          latency: '142ms',
          colorClass: 'bg-[#2E9F92]'
        },
        {
          id: 'ach',
          name: 'ACH Bank Wire Mandate',
          share: 27,
          volume: '$25,601 / mo',
          authRate: '99.7%',
          latency: 'Same-Day',
          colorClass: 'bg-[#345C64]'
        },
        {
          id: 'upi',
          name: 'UPI & Instant Settlement',
          share: 11,
          volume: '$10,431 / mo',
          authRate: '99.4%',
          latency: '1.8s',
          colorClass: 'bg-[#E96F50]'
        }
      ]
    },
    odoo: {
      ndr: '122.6%',
      grossChurn: '0.6%',
      recoveredArr: '$64,800',
      dso: '3.6 Days',
      series: [
        { period: 'Jul', baseMrr: 34200, expansionMrr: 6100, contracts: 18 },
        { period: 'Aug', baseMrr: 36800, expansionMrr: 7400, contracts: 19 },
        { period: 'Sep', baseMrr: 39400, expansionMrr: 8200, contracts: 20 },
        { period: 'Oct', baseMrr: 42900, expansionMrr: 9400, contracts: 22 },
        { period: 'Nov', baseMrr: 46100, expansionMrr: 10800, contracts: 23 },
        { period: 'Dec', baseMrr: 51040, expansionMrr: 12320, contracts: 24 }
      ],
      cohorts: [
        { cohort: '2026 · Q1', startingArr: '$136K', cells: [100, 100, 105, 110, 115, 119, 123] },
        { cohort: '2026 · Q2', startingArr: '$172K', cells: [100, 101, 106, 112, 117, 121, 124] },
        { cohort: '2026 · Q3', startingArr: '$210K', cells: [100, 100, 105, 111, 118, 120, 0] },
        { cohort: '2026 · Oct', startingArr: '$108K', cells: [100, 102, 108, 115, 0, 0, 0] },
        { cohort: '2026 · Nov', startingArr: '$124K', cells: [100, 103, 109, 0, 0, 0, 0] }
      ],
      rails: [
        {
          id: 'card',
          name: 'Stripe Card Capture',
          share: 68,
          volume: '$34,707 / mo',
          authRate: '99.1%',
          latency: '138ms',
          colorClass: 'bg-[#2E9F92]'
        },
        {
          id: 'ach',
          name: 'ACH Bank Wire Mandate',
          share: 22,
          volume: '$11,229 / mo',
          authRate: '99.8%',
          latency: 'Same-Day',
          colorClass: 'bg-[#345C64]'
        },
        {
          id: 'upi',
          name: 'UPI & Instant Settlement',
          share: 10,
          volume: '$5,104 / mo',
          authRate: '99.5%',
          latency: '1.6s',
          colorClass: 'bg-[#E96F50]'
        }
      ]
    },
    enterprise: {
      ndr: '126.1%',
      grossChurn: '0.4%',
      recoveredArr: '$47,600',
      dso: '5.1 Days',
      series: [
        { period: 'Jul', baseMrr: 26500, expansionMrr: 4800, contracts: 10 },
        { period: 'Aug', baseMrr: 29150, expansionMrr: 5300, contracts: 11 },
        { period: 'Sep', baseMrr: 31800, expansionMrr: 6200, contracts: 12 },
        { period: 'Oct', baseMrr: 34450, expansionMrr: 7100, contracts: 13 },
        { period: 'Nov', baseMrr: 37100, expansionMrr: 7950, contracts: 14 },
        { period: 'Dec', baseMrr: 39750, expansionMrr: 9200, contracts: 15 }
      ],
      cohorts: [
        { cohort: '2026 · Q1', startingArr: '$112K', cells: [100, 100, 104, 111, 118, 122, 126] },
        { cohort: '2026 · Q2', startingArr: '$140K', cells: [100, 100, 106, 114, 119, 125, 127] },
        { cohort: '2026 · Q3', startingArr: '$176K', cells: [100, 101, 107, 113, 120, 123, 0] },
        { cohort: '2026 · Oct', startingArr: '$86K', cells: [100, 100, 109, 116, 0, 0, 0] },
        { cohort: '2026 · Nov', startingArr: '$104K', cells: [100, 104, 111, 0, 0, 0, 0] }
      ],
      rails: [
        {
          id: 'ach',
          name: 'ACH Bank Wire Mandate',
          share: 54,
          volume: '$21,465 / mo',
          authRate: '99.9%',
          latency: 'Same-Day',
          colorClass: 'bg-[#345C64]'
        },
        {
          id: 'card',
          name: 'Stripe Card Capture',
          share: 39,
          volume: '$15,502 / mo',
          authRate: '98.7%',
          latency: '145ms',
          colorClass: 'bg-[#2E9F92]'
        },
        {
          id: 'upi',
          name: 'UPI & Instant Settlement',
          share: 7,
          volume: '$2,783 / mo',
          authRate: '99.6%',
          latency: '1.9s',
          colorClass: 'bg-[#E96F50]'
        }
      ]
    }
  },
  q3: {
    all: {
      ndr: '115.2%',
      grossChurn: '1.1%',
      recoveredArr: '$89,500',
      dso: '4.8 Days',
      series: [
        { period: 'Apr', baseMrr: 54200, expansionMrr: 6800, contracts: 28 },
        { period: 'May', baseMrr: 57900, expansionMrr: 7400, contracts: 30 },
        { period: 'Jun', baseMrr: 61400, expansionMrr: 8100, contracts: 31 },
        { period: 'Jul', baseMrr: 68400, expansionMrr: 9200, contracts: 34 },
        { period: 'Aug', baseMrr: 72100, expansionMrr: 11400, contracts: 36 },
        { period: 'Sep', baseMrr: 76900, expansionMrr: 12800, contracts: 38 }
      ],
      cohorts: [
        { cohort: '2025 · Q4', startingArr: '$210K', cells: [100, 98, 101, 104, 108, 112, 115] },
        { cohort: '2026 · Q1', startingArr: '$248K', cells: [100, 99, 102, 106, 111, 114, 116] },
        { cohort: '2026 · Q2', startingArr: '$312K', cells: [100, 100, 104, 108, 112, 0, 0] },
        { cohort: '2026 · Jul', startingArr: '$142K', cells: [100, 99, 103, 0, 0, 0, 0] },
        { cohort: '2026 · Aug', startingArr: '$168K', cells: [100, 101, 0, 0, 0, 0, 0] }
      ],
      rails: [
        {
          id: 'card',
          name: 'Stripe Card Capture',
          share: 65,
          volume: '$49,985 / mo',
          authRate: '98.6%',
          latency: '149ms',
          colorClass: 'bg-[#2E9F92]'
        },
        {
          id: 'ach',
          name: 'ACH Bank Wire Mandate',
          share: 25,
          volume: '$19,225 / mo',
          authRate: '99.6%',
          latency: 'Same-Day',
          colorClass: 'bg-[#345C64]'
        },
        {
          id: 'upi',
          name: 'UPI & Instant Settlement',
          share: 10,
          volume: '$7,690 / mo',
          authRate: '99.2%',
          latency: '1.9s',
          colorClass: 'bg-[#E96F50]'
        }
      ]
    },
    odoo: {
      ndr: '119.0%',
      grossChurn: '0.9%',
      recoveredArr: '$51,200',
      dso: '4.1 Days',
      series: [
        { period: 'Apr', baseMrr: 27400, expansionMrr: 4200, contracts: 14 },
        { period: 'May', baseMrr: 29800, expansionMrr: 4900, contracts: 15 },
        { period: 'Jun', baseMrr: 31900, expansionMrr: 5400, contracts: 17 },
        { period: 'Jul', baseMrr: 34200, expansionMrr: 6100, contracts: 18 },
        { period: 'Aug', baseMrr: 36800, expansionMrr: 7400, contracts: 19 },
        { period: 'Sep', baseMrr: 39400, expansionMrr: 8200, contracts: 20 }
      ],
      cohorts: [
        { cohort: '2025 · Q4', startingArr: '$118K', cells: [100, 99, 103, 107, 111, 115, 119] },
        { cohort: '2026 · Q1', startingArr: '$136K', cells: [100, 100, 105, 110, 114, 118, 120] },
        { cohort: '2026 · Q2', startingArr: '$172K', cells: [100, 101, 106, 111, 115, 0, 0] },
        { cohort: '2026 · Jul', startingArr: '$84K', cells: [100, 100, 104, 0, 0, 0, 0] },
        { cohort: '2026 · Aug', startingArr: '$96K', cells: [100, 102, 0, 0, 0, 0, 0] }
      ],
      rails: [
        {
          id: 'card',
          name: 'Stripe Card Capture',
          share: 70,
          volume: '$27,580 / mo',
          authRate: '98.9%',
          latency: '141ms',
          colorClass: 'bg-[#2E9F92]'
        },
        {
          id: 'ach',
          name: 'ACH Bank Wire Mandate',
          share: 21,
          volume: '$8,274 / mo',
          authRate: '99.7%',
          latency: 'Same-Day',
          colorClass: 'bg-[#345C64]'
        },
        {
          id: 'upi',
          name: 'UPI & Instant Settlement',
          share: 9,
          volume: '$3,546 / mo',
          authRate: '99.3%',
          latency: '1.7s',
          colorClass: 'bg-[#E96F50]'
        }
      ]
    },
    enterprise: {
      ndr: '123.4%',
      grossChurn: '0.5%',
      recoveredArr: '$38,300',
      dso: '5.4 Days',
      series: [
        { period: 'Apr', baseMrr: 21200, expansionMrr: 3400, contracts: 8 },
        { period: 'May', baseMrr: 23850, expansionMrr: 3900, contracts: 9 },
        { period: 'Jun', baseMrr: 23850, expansionMrr: 4300, contracts: 9 },
        { period: 'Jul', baseMrr: 26500, expansionMrr: 4800, contracts: 10 },
        { period: 'Aug', baseMrr: 29150, expansionMrr: 5300, contracts: 11 },
        { period: 'Sep', baseMrr: 31800, expansionMrr: 6200, contracts: 12 }
      ],
      cohorts: [
        { cohort: '2025 · Q4', startingArr: '$92K', cells: [100, 100, 104, 109, 114, 119, 123] },
        { cohort: '2026 · Q1', startingArr: '$112K', cells: [100, 100, 104, 111, 117, 121, 124] },
        { cohort: '2026 · Q2', startingArr: '$140K', cells: [100, 100, 106, 113, 118, 0, 0] },
        { cohort: '2026 · Jul', startingArr: '$58K', cells: [100, 100, 105, 0, 0, 0, 0] },
        { cohort: '2026 · Aug', startingArr: '$72K', cells: [100, 103, 0, 0, 0, 0, 0] }
      ],
      rails: [
        {
          id: 'ach',
          name: 'ACH Bank Wire Mandate',
          share: 52,
          volume: '$16,536 / mo',
          authRate: '99.8%',
          latency: 'Same-Day',
          colorClass: 'bg-[#345C64]'
        },
        {
          id: 'card',
          name: 'Stripe Card Capture',
          share: 41,
          volume: '$13,038 / mo',
          authRate: '98.5%',
          latency: '148ms',
          colorClass: 'bg-[#2E9F92]'
        },
        {
          id: 'upi',
          name: 'UPI & Instant Settlement',
          share: 7,
          volume: '$2,226 / mo',
          authRate: '99.5%',
          latency: '1.9s',
          colorClass: 'bg-[#E96F50]'
        }
      ]
    }
  },
  t12m: {
    all: {
      ndr: '121.8%',
      grossChurn: '0.7%',
      recoveredArr: '$412,000',
      dso: '4.1 Days',
      series: [
        { period: 'Q1', baseMrr: 52400, expansionMrr: 7100, contracts: 27 },
        { period: 'Q2', baseMrr: 61400, expansionMrr: 8900, contracts: 31 },
        { period: 'Jul', baseMrr: 68400, expansionMrr: 9200, contracts: 34 },
        { period: 'Sep', baseMrr: 76900, expansionMrr: 12800, contracts: 38 },
        { period: 'Nov', baseMrr: 86200, expansionMrr: 15900, contracts: 41 },
        { period: 'Dec', baseMrr: 94820, expansionMrr: 18400, contracts: 42 }
      ],
      cohorts: [
        { cohort: '2025 · H2', startingArr: '$420K', cells: [100, 99, 103, 108, 113, 118, 122] },
        { cohort: '2026 · Q1', startingArr: '$248K', cells: [100, 99, 102, 106, 111, 115, 118] },
        { cohort: '2026 · Q2', startingArr: '$312K', cells: [100, 100, 104, 108, 113, 117, 119] },
        { cohort: '2026 · Q3', startingArr: '$386K', cells: [100, 99, 103, 109, 114, 116, 0] },
        { cohort: '2026 · Q4', startingArr: '$422K', cells: [100, 101, 107, 112, 0, 0, 0] }
      ],
      rails: [
        {
          id: 'card',
          name: 'Stripe Card Capture',
          share: 61,
          volume: '$694,100 / yr',
          authRate: '99.0%',
          latency: '142ms',
          colorClass: 'bg-[#2E9F92]'
        },
        {
          id: 'ach',
          name: 'ACH Bank Wire Mandate',
          share: 28,
          volume: '$318,600 / yr',
          authRate: '99.8%',
          latency: 'Same-Day',
          colorClass: 'bg-[#345C64]'
        },
        {
          id: 'upi',
          name: 'UPI & Instant Settlement',
          share: 11,
          volume: '$125,140 / yr',
          authRate: '99.4%',
          latency: '1.8s',
          colorClass: 'bg-[#E96F50]'
        }
      ]
    },
    odoo: {
      ndr: '124.5%',
      grossChurn: '0.6%',
      recoveredArr: '$238,000',
      dso: '3.5 Days',
      series: [
        { period: 'Q1', baseMrr: 26100, expansionMrr: 4400, contracts: 14 },
        { period: 'Q2', baseMrr: 31900, expansionMrr: 5400, contracts: 17 },
        { period: 'Jul', baseMrr: 34200, expansionMrr: 6100, contracts: 18 },
        { period: 'Sep', baseMrr: 39400, expansionMrr: 8200, contracts: 20 },
        { period: 'Nov', baseMrr: 46100, expansionMrr: 10800, contracts: 23 },
        { period: 'Dec', baseMrr: 51040, expansionMrr: 12320, contracts: 24 }
      ],
      cohorts: [
        { cohort: '2025 · H2', startingArr: '$225K', cells: [100, 100, 105, 111, 116, 121, 125] },
        { cohort: '2026 · Q1', startingArr: '$136K', cells: [100, 100, 105, 110, 115, 119, 123] },
        { cohort: '2026 · Q2', startingArr: '$172K', cells: [100, 101, 106, 112, 117, 121, 124] },
        { cohort: '2026 · Q3', startingArr: '$210K', cells: [100, 100, 105, 111, 118, 120, 0] },
        { cohort: '2026 · Q4', startingArr: '$232K', cells: [100, 102, 108, 115, 0, 0, 0] }
      ],
      rails: [
        {
          id: 'card',
          name: 'Stripe Card Capture',
          share: 67,
          volume: '$410,300 / yr',
          authRate: '99.2%',
          latency: '138ms',
          colorClass: 'bg-[#2E9F92]'
        },
        {
          id: 'ach',
          name: 'ACH Bank Wire Mandate',
          share: 23,
          volume: '$140,870 / yr',
          authRate: '99.8%',
          latency: 'Same-Day',
          colorClass: 'bg-[#345C64]'
        },
        {
          id: 'upi',
          name: 'UPI & Instant Settlement',
          share: 10,
          volume: '$61,250 / yr',
          authRate: '99.5%',
          latency: '1.6s',
          colorClass: 'bg-[#E96F50]'
        }
      ]
    },
    enterprise: {
      ndr: '128.0%',
      grossChurn: '0.3%',
      recoveredArr: '$174,000',
      dso: '4.9 Days',
      series: [
        { period: 'Q1', baseMrr: 18550, expansionMrr: 3100, contracts: 7 },
        { period: 'Q2', baseMrr: 23850, expansionMrr: 4300, contracts: 9 },
        { period: 'Jul', baseMrr: 26500, expansionMrr: 4800, contracts: 10 },
        { period: 'Sep', baseMrr: 31800, expansionMrr: 6200, contracts: 12 },
        { period: 'Nov', baseMrr: 37100, expansionMrr: 7950, contracts: 14 },
        { period: 'Dec', baseMrr: 39750, expansionMrr: 9200, contracts: 15 }
      ],
      cohorts: [
        { cohort: '2025 · H2', startingArr: '$195K', cells: [100, 100, 105, 112, 119, 124, 128] },
        { cohort: '2026 · Q1', startingArr: '$112K', cells: [100, 100, 104, 111, 118, 122, 126] },
        { cohort: '2026 · Q2', startingArr: '$140K', cells: [100, 100, 106, 114, 119, 125, 127] },
        { cohort: '2026 · Q3', startingArr: '$176K', cells: [100, 101, 107, 113, 120, 123, 0] },
        { cohort: '2026 · Q4', startingArr: '$190K', cells: [100, 103, 110, 116, 0, 0, 0] }
      ],
      rails: [
        {
          id: 'ach',
          name: 'ACH Bank Wire Mandate',
          share: 55,
          volume: '$262,350 / yr',
          authRate: '99.9%',
          latency: 'Same-Day',
          colorClass: 'bg-[#345C64]'
        },
        {
          id: 'card',
          name: 'Stripe Card Capture',
          share: 38,
          volume: '$181,260 / yr',
          authRate: '98.8%',
          latency: '144ms',
          colorClass: 'bg-[#2E9F92]'
        },
        {
          id: 'upi',
          name: 'UPI & Instant Settlement',
          share: 7,
          volume: '$33,390 / yr',
          authRate: '99.6%',
          latency: '1.9s',
          colorClass: 'bg-[#E96F50]'
        }
      ]
    }
  }
};

function getCohortCellClass(val: number): string {
  if (val === 0) return 'bg-[#F7FAFA] text-[#56666B]/45';
  if (val >= 120) return 'bg-[#1F3F47] text-white font-bold';
  if (val >= 112) return 'bg-[#345C64] text-white font-semibold';
  if (val >= 104) return 'bg-[#2E9F92] text-white font-semibold';
  return 'bg-[#DDF3F0] text-[#1F3F47] font-medium';
}

export const AnalyticsBentoGrid: React.FC = () => {
  const { launchWorkspace } = useAuth();

  const [timeframe, setTimeframe] = useState<TimeframeKey>('q4');
  const [segment, setSegment] = useState<SegmentKey>('all');
  const [hoveredPeriodIdx, setHoveredPeriodIdx] = useState<number>(5);
  const [inspectedCohort, setInspectedCohort] = useState<{
    cohort: string;
    monthIdx: number;
    value: number;
    arr: string;
  } | null>(null);
  const [selectedRailIdx, setSelectedRailIdx] = useState<number>(0);

  const slice = ANALYTICS_DATA[timeframe][segment];
  const maxBarSum = Math.max(...slice.series.map((s) => s.baseMrr + s.expansionMrr));
  const activePoint = slice.series[hoveredPeriodIdx] || slice.series[slice.series.length - 1];
  const activeRail = slice.rails[selectedRailIdx] || slice.rails[0];

  return (
    <section
      id="analytics-bento"
      className="border-y border-[#E5ECEC] bg-white/75 py-16 lg:py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header + Interactive Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold text-[#345C64]">
              Executive Revenue Telemetry · Analytics Bento Grid
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#252B2E] font-display tracking-tight mt-1 text-balance">
              Audit-grade recurring revenue, cohort expansion, and rail velocity
            </h2>
            <p className="text-xs sm:text-sm text-[#56666B] mt-1.5 leading-relaxed">
              Slice realized MRR waterfalls, net dollar retention cohorts, and payment gateway authorization rates across contract editions in real time.
            </p>
          </div>

          {/* Dual Segmented Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC]">
              {[
                { id: 'q3' as const, label: 'Q3 2026' },
                { id: 'q4' as const, label: 'Q4 2026' },
                { id: 't12m' as const, label: 'Trailing 12M' }
              ].map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setTimeframe(tf.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    timeframe === tf.id
                      ? 'bg-[#1F3F47] text-white'
                      : 'text-[#56666B] hover:text-[#252B2E]'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC]">
              {[
                { id: 'all' as const, label: 'All Editions' },
                { id: 'odoo' as const, label: 'Odoo Brand' },
                { id: 'enterprise' as const, label: 'Enterprise' }
              ].map((seg) => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => {
                    setSegment(seg.id);
                    setSelectedRailIdx(0);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    segment === seg.id
                      ? 'bg-[#345C64] text-white'
                      : 'text-[#56666B] hover:text-[#252B2E]'
                  }`}
                >
                  {seg.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 12-Column Analytics Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* BENTO A (7 Cols, Pure White): Net MRR & Expansion Dual-Series Waterfall */}
          <div className="lg:col-span-7 rounded-2xl bg-white border border-[#E5ECEC] p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E5ECEC]">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#345C64]">
                    <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                    <span>Realized Base MRR vs. Variant Expansion</span>
                  </div>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-2xl font-extrabold font-mono tabular-nums text-[#252B2E]">
                      ${(activePoint.baseMrr + activePoint.expansionMrr).toLocaleString()}
                    </span>
                    <span className="text-xs font-mono text-[#2E9F92] font-semibold">
                      {activePoint.period} · {activePoint.contracts} Active Contracts
                    </span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-[#56666B]">
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#2E9F92]" />
                    <span>Base MRR</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#E96F50]" />
                    <span>Expansion</span>
                  </span>
                </div>
              </div>

              {/* Interactive Stacked Column Chart */}
              <div className="mt-6 grid grid-cols-6 gap-3 sm:gap-5 items-end h-48 pt-4 px-1">
                {slice.series.map((pt, idx) => {
                  const total = pt.baseMrr + pt.expansionMrr;
                  const basePct = Math.max(18, Math.round((pt.baseMrr / maxBarSum) * 100));
                  const expPct = Math.max(8, Math.round((pt.expansionMrr / maxBarSum) * 100));
                  const isFocused = hoveredPeriodIdx === idx;

                  return (
                    <button
                      key={pt.period}
                      type="button"
                      onMouseEnter={() => setHoveredPeriodIdx(idx)}
                      onClick={() => setHoveredPeriodIdx(idx)}
                      className="group h-full flex flex-col justify-end items-center gap-2 focus:outline-none"
                    >
                      <div className="text-[10px] font-mono tabular-nums text-[#56666B] group-hover:text-[#1F3F47] font-semibold">
                        ${Math.round(total / 1000)}k
                      </div>
                      <div
                        className={`w-full max-w-[44px] h-36 flex flex-col justify-end rounded-lg p-1 transition-colors ${
                          isFocused ? 'bg-[#DDF3F0]/65' : 'bg-[#F7FAFA]'
                        }`}
                      >
                        <motion.div
                          initial={false}
                          animate={{ height: `${expPct}%` }}
                          transition={{ duration: 0.22 }}
                          className="w-full rounded-t-sm bg-[#E96F50] mb-0.5"
                        />
                        <motion.div
                          initial={false}
                          animate={{ height: `${basePct}%` }}
                          transition={{ duration: 0.22 }}
                          className="w-full rounded-b-sm bg-[#2E9F92]"
                        />
                      </div>
                      <span
                        className={`text-xs font-mono ${
                          isFocused ? 'font-bold text-[#1F3F47]' : 'text-[#56666B]'
                        }`}
                      >
                        {pt.period}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Period Tabular Readout */}
            <div className="mt-5 pt-3.5 border-t border-[#E5ECEC] flex flex-wrap items-center justify-between gap-3 text-xs font-mono tabular-nums">
              <span className="text-[#56666B]">
                {activePoint.period} Base:{' '}
                <strong className="text-[#252B2E]">${activePoint.baseMrr.toLocaleString()}</strong>
              </span>
              <span className="text-[#56666B]">
                Variant &amp; Seat Lift:{' '}
                <strong className="text-[#E96F50]">+${activePoint.expansionMrr.toLocaleString()}</strong>
              </span>
            </div>
          </div>

          {/* BENTO B (5 Cols, Primary Teal #345C64): Executive NDR & Recovery Scorecard */}
          <div className="lg:col-span-5 rounded-2xl bg-[#345C64] border border-[#27484F] text-white p-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#DDF3F0]">
                    <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                    <span>Net Dollar Retention</span>
                  </div>
                  <div className="text-4xl font-extrabold font-mono tabular-nums text-white mt-2">
                    {slice.ndr}
                  </div>
                  <p className="text-xs text-[#DDF3F0]/85 mt-1">
                    Driven by multi-seat upgrades, Odoo edition migrations, and automated dunning recovery.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => launchWorkspace('admin', 'reports')}
                  className="px-3 py-1.5 rounded-lg bg-[#1F3F47] hover:bg-[#162E35] text-xs font-semibold text-white inline-flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Full Reports</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3 Structured Sub-KPIs */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/15">
                <div>
                  <div className="text-[11px] text-[#DDF3F0]/80">Gross Churn</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-[#8CE6DB] mt-0.5">
                    {slice.grossChurn}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#DDF3F0]/80">Dunning Saved</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-white mt-0.5">
                    {slice.recoveredArr}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[#DDF3F0]/80">Median DSO</div>
                  <div className="text-lg font-bold font-mono tabular-nums text-[#FFBFB0] mt-0.5">
                    {slice.dso}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-[#DDF3F0]/90">
              <span>Zero manual spreadsheet adjustments</span>
              <span className="font-mono font-semibold text-[#8CE6DB]">ASC 606 Ready</span>
            </div>
          </div>

          {/* BENTO C (7 Cols, Pure White): Enterprise Cohort Retention Heatmap */}
          <div className="lg:col-span-7 rounded-2xl bg-white border border-[#E5ECEC] p-6 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E5ECEC]">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#345C64]">
                    <Grid className="w-3.5 h-3.5 shrink-0" />
                    <span>Enterprise Net Revenue Retention by Cohort (M0–M6)</span>
                  </div>
                  <p className="text-xs text-[#56666B] mt-0.5">
                    Values above 100% reflect seat expansion and edition adders outpacing churn.
                  </p>
                </div>

                <div className="text-xs font-mono tabular-nums text-[#1F3F47] font-semibold">
                  {inspectedCohort
                    ? `${inspectedCohort.cohort} · M${inspectedCohort.monthIdx}: ${inspectedCohort.value}% (${inspectedCohort.arr})`
                    : 'Hover any cohort cell to inspect'}
                </div>
              </div>

              {/* Heatmap Matrix */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs border-separate border-spacing-1.5">
                  <thead>
                    <tr className="text-[11px] font-mono text-[#56666B]">
                      <th className="text-left font-semibold py-1 pr-2">Cohort</th>
                      <th className="text-right font-semibold py-1 pr-3">Start ARR</th>
                      {['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'].map((m) => (
                        <th key={m} className="text-center font-semibold py-1">
                          {m}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slice.cohorts.map((row) => (
                      <tr key={row.cohort}>
                        <td className="font-mono font-semibold text-[#252B2E] whitespace-nowrap pr-2 py-1">
                          {row.cohort}
                        </td>
                        <td className="font-mono tabular-nums text-right text-[#56666B] pr-3 py-1">
                          {row.startingArr}
                        </td>
                        {row.cells.map((val, mIdx) => (
                          <td key={mIdx} className="p-0">
                            <button
                              type="button"
                              disabled={val === 0}
                              onMouseEnter={() =>
                                val > 0 &&
                                setInspectedCohort({
                                  cohort: row.cohort,
                                  monthIdx: mIdx,
                                  value: val,
                                  arr: row.startingArr
                                })
                              }
                              onClick={() =>
                                val > 0 &&
                                setInspectedCohort({
                                  cohort: row.cohort,
                                  monthIdx: mIdx,
                                  value: val,
                                  arr: row.startingArr
                                })
                              }
                              className={`w-full py-2 px-1.5 rounded-md font-mono tabular-nums text-[11px] text-center transition-transform ${
                                val > 0 ? 'hover:scale-[1.04] cursor-pointer' : 'cursor-default'
                              } ${getCohortCellClass(val)}`}
                            >
                              {val > 0 ? `${val}%` : '—'}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5ECEC] flex items-center justify-between text-[11px] text-[#56666B]">
              <span>Color intensity tracks net expansion from 100% baseline to 120%+ NDR</span>
              <span className="font-mono text-[#2E9F92] font-semibold">Live Cohort Matrix</span>
            </div>
          </div>

          {/* BENTO D (5 Cols, Pure White): Settlement Rail Mix & Authorization Speed */}
          <div className="lg:col-span-5 rounded-2xl bg-white border border-[#E5ECEC] p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-[#E5ECEC]">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#345C64]">
                    <CreditCard className="w-3.5 h-3.5 shrink-0" />
                    <span>Settlement Rail Mix &amp; Speed</span>
                  </div>
                  <h3 className="text-base font-bold text-[#252B2E] font-display mt-1">
                    Multi-rail authorization telemetry
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => launchWorkspace('admin', 'payments')}
                  className="text-xs font-semibold text-[#1F3F47] hover:text-[#2E9F92] inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                >
                  <span>Ledger</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Stacked Share Bar */}
              <div className="h-3 w-full rounded-full overflow-hidden flex gap-0.5 bg-[#F7FAFA]">
                {slice.rails.map((rail) => (
                  <motion.div
                    key={rail.id}
                    initial={false}
                    animate={{ width: `${rail.share}%` }}
                    transition={{ duration: 0.22 }}
                    className={`h-full ${rail.colorClass}`}
                  />
                ))}
              </div>

              {/* Interactive Rail Rows */}
              <div className="space-y-2">
                {slice.rails.map((rail, idx) => {
                  const isSelected = selectedRailIdx === idx;
                  return (
                    <button
                      key={rail.id}
                      type="button"
                      onClick={() => setSelectedRailIdx(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#F7FAFA] border-[#1F3F47]'
                          : 'bg-white border-[#E5ECEC] hover:bg-[#F7FAFA]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-xs shrink-0 ${rail.colorClass}`} />
                        <div className="truncate">
                          <div className="text-xs font-semibold text-[#252B2E] truncate">
                            {rail.name}
                          </div>
                          <div className="text-[11px] font-mono tabular-nums text-[#56666B]">
                            {rail.volume}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono tabular-nums">
                        <div className="text-sm font-bold text-[#1F3F47]">{rail.share}%</div>
                        <div className="text-[10px] text-[#2E9F92] font-semibold">
                          {rail.authRate} Auth
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5ECEC] flex items-center justify-between text-xs font-mono tabular-nums">
              <span className="text-[#56666B]">{activeRail.name} Latency</span>
              <span className="font-bold text-[#1F3F47]">{activeRail.latency}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
