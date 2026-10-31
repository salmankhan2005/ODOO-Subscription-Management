import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldCheck, Users, UserCircle, ChevronDown, Check } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { role, switchRole, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const roles: { id: UserRole; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'admin',
      title: 'Administrator',
      desc: 'Full control over products, tax rules, staff & billing batch runner',
      icon: <ShieldCheck className="w-4 h-4 text-indigo-400" />
    },
    {
      id: 'staff',
      title: 'Internal Staff / Sales',
      desc: 'Quotation templates, customer deals, invoices & payment logs',
      icon: <Users className="w-4 h-4 text-emerald-400" />
    },
    {
      id: 'customer',
      title: 'Customer Self-Service',
      desc: 'Subscriber portal for active plans, renewals & PDF receipts',
      icon: <UserCircle className="w-4 h-4 text-amber-400" />
    }
  ];

  const currentRoleObj = roles.find((r) => r.id === role) || roles[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-indigo-500/50 text-slate-200 text-xs font-medium transition-all"
        title="Switch active user role"
      >
        <span className="flex items-center gap-1.5">
          {currentRoleObj.icon}
          <span className="font-semibold text-slate-100">{currentRoleObj.title}</span>
        </span>
        <span className="text-slate-500">·</span>
        <span className="text-slate-400 truncate max-w-[110px]">{user?.name?.split(' ')[0]}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#111827] border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1.5 border-b border-slate-800 mb-1">
              <div className="text-[11px] font-semibold text-slate-400 tracking-wider">
                SWITCH SIMULATION ROLE
              </div>
            </div>
            <div className="space-y-1">
              {roles.map((r) => {
                const isActive = r.id === role;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      switchRole(r.id);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg flex items-start gap-3 transition-colors ${
                      isActive ? 'bg-indigo-600/15 border border-indigo-500/30' : 'hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="mt-0.5">{r.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-100">{r.title}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{r.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
