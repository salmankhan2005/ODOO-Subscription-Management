import React from 'react';
import { motion, useReducedMotion, TargetAndTransition } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  FileSpreadsheet,
  Repeat,
  Receipt,
  CreditCard,
  Zap,
  Percent,
  Calculator,
  BarChart3,
  UserCheck,
  TrendingUp,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export type NavIconKind =
  | 'overview'
  | 'customers'
  | 'products'
  | 'plans'
  | 'quotations'
  | 'subscriptions'
  | 'invoices'
  | 'payments'
  | 'billing'
  | 'discounts'
  | 'taxes'
  | 'reports'
  | 'customer_overview'
  | 'customer_plans'
  | 'customer_invoices'
  | 'customer_payments'
  | 'customer_profile'
  | 'trending'
  | 'alert'
  | 'clock'
  | 'sparkles';

interface AnimatedNavIconProps {
  kind: NavIconKind;
  isActive?: boolean;
  isHovered?: boolean;
  className?: string;
}

const ICON_MAP: Record<NavIconKind, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  customers: Users,
  products: Package,
  plans: Layers,
  quotations: FileSpreadsheet,
  subscriptions: Repeat,
  invoices: Receipt,
  payments: CreditCard,
  billing: Zap,
  discounts: Percent,
  taxes: Calculator,
  reports: BarChart3,
  customer_overview: Repeat,
  customer_plans: Layers,
  customer_invoices: Receipt,
  customer_payments: CreditCard,
  customer_profile: UserCheck,
  trending: TrendingUp,
  alert: AlertCircle,
  clock: Clock,
  sparkles: Sparkles
};

function getIconAnimation(kind: NavIconKind, activeOrHovered: boolean): TargetAndTransition {
  if (!activeOrHovered) {
    return { scale: 1, rotate: 0, x: 0, y: 0 };
  }

  switch (kind) {
    case 'subscriptions':
    case 'customer_overview':
      return { rotate: 180, scale: 1.1 };
    case 'billing':
      return { scale: [1, 1.24, 1.1], rotate: [0, -12, 4, 0] };
    case 'plans':
    case 'customer_plans':
      return { y: [0, -2.5, -1], scale: 1.1 };
    case 'products':
      return { y: -2, scale: 1.1 };
    case 'payments':
    case 'customer_payments':
      return { x: [0, 2.5, 0], rotate: -5, scale: 1.08 };
    case 'invoices':
    case 'customer_invoices':
      return { y: [0, -2.5, 0], scale: 1.08 };
    case 'quotations':
      return { rotate: [0, -6, 2, 0], scale: 1.08 };
    case 'discounts':
      return { rotate: [0, 14, 0], scale: 1.12 };
    case 'taxes':
      return { scale: [1, 0.92, 1.12, 1.06] };
    case 'reports':
    case 'trending':
      return { y: -2, scale: 1.12 };
    case 'customers':
    case 'customer_profile':
      return { scale: [1, 1.15, 1.06], x: [0, 1.5, 0] };
    case 'alert':
      return { rotate: [0, -10, 10, -5, 0], scale: 1.1 };
    case 'clock':
      return { rotate: 30, scale: 1.1 };
    case 'overview':
    default:
      return { scale: 1.12, rotate: -4 };
  }
}

export const AnimatedNavIcon: React.FC<AnimatedNavIconProps> = ({
  kind,
  isActive = false,
  isHovered = false,
  className = 'w-4 h-4'
}) => {
  const prefersReducedMotion = useReducedMotion();
  const IconComponent = ICON_MAP[kind] || LayoutDashboard;
  const trigger = isActive || isHovered;

  return (
    <motion.span
      initial={false}
      animate={prefersReducedMotion ? undefined : getIconAnimation(kind, trigger)}
      transition={{
        duration: 0.28,
        ease: [0.16, 1, 0.3, 1]
      }}
      className="inline-flex items-center justify-center shrink-0"
    >
      <IconComponent className={className} />
    </motion.span>
  );
};
