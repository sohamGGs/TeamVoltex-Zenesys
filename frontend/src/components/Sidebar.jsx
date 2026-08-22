import React, { useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Sparkles,
  CheckSquare,
  FileText,
  LogOut,
  Layers,
  ChevronDown,
  UserCheck,
  ShieldCheck,
  Zap,
  Building,
  RefreshCw
} from 'lucide-react';

const QUICK_ROLES = [
  { role: 'Lead Procurement Officer', email: 'admin@procureiq.internal', pass: 'admin123', name: 'Elena Vance' },
  { role: 'Plant Head', email: 'planthead@procureiq.internal', pass: 'plant123', name: 'Marcus Sterling' },
  { role: 'VP Operations', email: 'vpops@procureiq.internal', pass: 'vp123', name: 'Victoria Zhao' },
  { role: 'Finance Director', email: 'finance@procureiq.internal', pass: 'finance123', name: 'Arthur Pendelton' },
  { role: 'Department Manager', email: 'deptmgr@procureiq.internal', pass: 'dept123', name: 'David Kross' },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onSwitchPersona,
  pendingCount = 0
}) {
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      label: 'Executive Dashboard',
      sublabel: 'KPIs & Procurement Insights',
      icon: LayoutDashboard,
    },
    {
      id: 'new_pr',
      label: 'New Purchase Request',
      sublabel: 'Auto-RFQ & Smart Routing',
      icon: PlusCircle,
    },
    {
      id: 'vendor_comparison',
      label: 'Vendor Match & AI Audit',
      sublabel: 'Scoring Matrix & Gemini AI',
      icon: Sparkles,
    },
    {
      id: 'approval_queue',
      label: 'Approval Queue',
      sublabel: 'Dynamic Rule Evaluation',
      icon: CheckSquare,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      id: 'purchase_orders',
      label: 'Purchase Orders',
      sublabel: '3-Way Match & PDF Register',
      icon: FileText,
    },
  ];

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Lead Procurement Officer': return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Plant Head': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'VP Operations': return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Finance Director': return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      default: return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <aside className="w-72 bg-[#0b0f19] border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 z-30 select-none">
      {/* Top Section */}
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-white tracking-tight">ProcureIQ</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  ERP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                <Zap className="w-3 h-3 text-amber-400" /> NetSuite Aligned
              </p>
            </div>
          </div>
        </div>

        {/* User Persona Profile Card */}
        <div className="p-4 border-b border-slate-800/60 relative">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-750">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                  {user?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                </div>
                <div className="overflow-hidden">
                  <div className="font-semibold text-xs text-white truncate">{user?.full_name || 'ERP User'}</div>
                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                    <Building className="w-2.5 h-2.5 text-slate-500" /> {user?.department || 'Operations'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowPersonaMenu(!showPersonaMenu)}
                title="Switch Persona"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Role Badge */}
            <div className="mt-2.5">
              <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getRoleBadgeColor(user?.role)}`}>
                {user?.role || 'Standard Persona'}
              </span>
            </div>
          </div>

          {/* Persona Switcher Dropdown */}
          {showPersonaMenu && (
            <div className="absolute left-4 right-4 top-[105px] z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 space-y-1 animate-fade-in">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Switch Demo Persona
              </div>
              {QUICK_ROLES.map((r) => (
                <button
                  key={r.email}
                  type="button"
                  onClick={() => {
                    setShowPersonaMenu(false);
                    onSwitchPersona(r.email, r.pass);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    user?.email === r.email
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="font-medium truncate">{r.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{r.role}</div>
                  </div>
                  {user?.email === r.email && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1.5 flex-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Procurement Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-3.5 py-3 rounded-xl transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/20 border border-blue-400/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800/80 text-slate-400 group-hover:text-blue-400 group-hover:bg-slate-800'} transition-colors`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold leading-tight">{item.label}</div>
                    <div className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-white text-blue-700' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: NetSuite Status & Logout */}
      <div className="p-4 border-t border-slate-800/80 space-y-3 bg-slate-950/40">
        {/* NetSuite Status Pill */}
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-medium text-slate-300">NetSuite Sync</span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Active 2-Way
          </span>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-2.5 px-3.5 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
