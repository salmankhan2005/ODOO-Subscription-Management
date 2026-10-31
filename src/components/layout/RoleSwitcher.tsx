import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
      desc: 'Full control over catalog, tax rules, staff & batch billing runner',
      icon: <ShieldCheck className="w-4 h-4 text-[#1F3F47]" />
    },
    {
      id: 'staff',
      title: 'Sales & Finance Ops',
      desc: 'Quotation wizard, customer contracts, invoices & payment logs',
      icon: <Users className="w-4 h-4 text-[#2E9F92]" />
    },
    {
      id: 'customer',
      title: 'Subscriber Portal',
      desc: 'Self-service portal for active plans, renewals & tax statements',
      icon: <UserCircle className="w-4 h-4 text-[#E96F50]" />
    }
  ];

  const currentRoleObj = roles.find((r) => r.id === role) || roles[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F7FAFA] border border-[#E5ECEC] hover:border-[#345C64]/50 text-[#252B2E] text-xs font-medium transition-colors whitespace-nowrap shrink-0"
        title="Switch active workspace role"
      >
        <motion.span
          key={role}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-1.5"
        >
          <span className="transition-transform duration-150 group-hover:scale-110">
            {currentRoleObj.icon}
          </span>
          <span className="font-semibold text-[#1F3F47]">{currentRoleObj.title}</span>
        </motion.span>
        <span className="text-[#9AB0B4]">·</span>
        <span className="text-[#56666B] truncate max-w-[96px]">{user?.name?.split(' ')[0]}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex shrink-0"
        >
          <ChevronDown className="w-3.5 h-3.5 text-[#56666B]" />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 mt-2 w-72 rounded-xl bg-white border border-[#E5ECEC] shadow-[0_20px_40px_-14px_rgba(11,26,32,0.22)] p-2 z-50"
            >
              <div className="px-2.5 py-1.5 border-b border-[#E5ECEC] mb-1">
                <div className="text-[11px] font-semibold text-[#56666B]">
                  Workspace Role Perspective
                </div>
              </div>
              <div className="space-y-1">
                {roles.map((r) => {
                  const isActive = r.id === role;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        switchRole(r.id);
                        setIsOpen(false);
                      }}
                      className={`group relative w-full text-left p-2.5 rounded-lg flex items-start gap-3 transition-colors ${
                        isActive ? 'text-[#1F3F47]' : 'hover:bg-[#F7FAFA] text-[#252B2E]'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="role-switcher-active"
                          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                          className="absolute inset-0 rounded-lg bg-[#DDF3F0]"
                        />
                      )}
                      <div className="relative z-10 mt-0.5 shrink-0 transition-transform duration-150 group-hover:scale-110">
                        {r.icon}
                      </div>
                      <div className="relative z-10 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{r.title}</span>
                          {isActive && <Check className="w-3.5 h-3.5 text-[#1F3F47]" />}
                        </div>
                        <p className="text-[11px] text-[#56666B] mt-0.5 leading-snug">{r.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
