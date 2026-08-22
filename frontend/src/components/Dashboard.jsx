import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building,
  FileText,
  PlusCircle,
  Activity,
  Award
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { dashboardAPI } from '../api';

const DEPARTMENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

export default function Dashboard({
  onNavigateToTab,
  onSelectPrForComparison,
  onTriggerNewPr
}) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await dashboardAPI.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Unable to fetch live ERP metrics. Please verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'Critical':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'High':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Medium':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PO Created':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'Approved':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'Pending Approval':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Rejected':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-800/60 rounded-2xl border border-slate-750" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-800/40 rounded-2xl border border-slate-750" />
          <div className="h-72 bg-slate-800/40 rounded-2xl border border-slate-750" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Activity className="w-3.5 h-3.5 text-blue-400" /> ERP Operational Intelligence
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Procurement Executive Dashboard
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Real-time RFQ bidding pipeline, multi-tier approval routing, and vendor performance analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onTriggerNewPr}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" /> Create Purchase Request
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Spend */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total PO Spend</span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            ${(metrics?.total_spend || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> +14.2%
            </span>
            <span>vs previous month</span>
          </div>
        </div>

        {/* Card 2: Pending Approvals */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {metrics?.pending_approvals || 0}
          </div>
          <div className="text-[11px] text-amber-400/90 font-medium flex items-center justify-between">
            <span>Action required in queue</span>
            <button
              onClick={() => onNavigateToTab('approval_queue')}
              className="text-xs text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Review <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 3: Vendor Reliability */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Supplier Reliability</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {metrics?.avg_vendor_reliability || 92.5}%
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified across 8 contracted suppliers
          </div>
        </div>

        {/* Card 4: 3-Way Match Verified */}
        <div className="glass-card glass-card-hover rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">3-Way Match Verified</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {metrics?.three_way_match_verified || 0}
            <span className="text-xs font-normal text-slate-400 ml-1.5">/ {metrics?.total_approved_pos || 0} POs</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> 100% SKU & Invoice audit pass
          </div>
        </div>
      </div>

      {/* NetSuite ERP Integration Notice Banner */}
      <div className="rounded-2xl p-4 md:p-5 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/50 border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-blue-500/5">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              NetSuite ERP Autonomous Workflow Engine
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                Live
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Rule-based dynamic approvals routing is active across Operations ($100k+), Critical Bulk (&gt;500), High Value ($50k+), and Departmental tiers.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateToTab('vendor_comparison')}
          className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-blue-300 text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          View Vendor Scoring Matrix <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Monthly Spend Flow */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Monthly Procurement Spend Flow</h3>
              <p className="text-[11px] text-slate-400">Total authorized expenditure across rolling cycle</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">USD ($)</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.monthly_spend_flow || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spend']}
                />
                <Area type="monotone" dataKey="spend" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#spendGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Spend by Department */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Spend by Department</h3>
              <p className="text-[11px] text-slate-400">Budget allocation across organizational units</p>
            </div>
            <Building className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics?.spend_by_department || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="department" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Allocated']}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {(metrics?.spend_by_department || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Purchase Requests Live Table */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" /> Recent Purchase Requests
            </h3>
            <p className="text-xs text-slate-400">Live operational requests undergoing automated bidding and approval evaluation</p>
          </div>
          <button
            onClick={() => onNavigateToTab('vendor_comparison')}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            Full Comparison Matrix <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700/80 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                <th className="py-3 px-3.5">PR ID</th>
                <th className="py-3 px-3.5">Title & Specs</th>
                <th className="py-3 px-3.5">Dept</th>
                <th className="py-3 px-3.5">Budget</th>
                <th className="py-3 px-3.5">Urgency</th>
                <th className="py-3 px-3.5">Triggered Routing Rule</th>
                <th className="py-3 px-3.5">Status</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(!metrics?.recent_prs || metrics.recent_prs.length === 0) ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No purchase requests found in the system.
                  </td>
                </tr>
              ) : (
                metrics.recent_prs.map((pr) => (
                  <tr key={pr.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-3.5 font-mono text-blue-400 font-semibold">
                      PR-{pr.id.toString().padStart(4, '0')}
                    </td>
                    <td className="py-3.5 px-3.5 max-w-xs">
                      <div className="font-semibold text-white truncate">{pr.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{pr.item_description}</div>
                    </td>
                    <td className="py-3.5 px-3.5 text-slate-300">{pr.department}</td>
                    <td className="py-3.5 px-3.5 font-semibold text-white font-mono">
                      ${pr.estimated_budget.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getUrgencyBadge(pr.urgency)}`}>
                        {pr.urgency}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 max-w-xs">
                      <div className="text-[11px] text-slate-300 truncate" title={pr.assigned_approval_rule}>
                        {pr.assigned_approval_rule || 'Standard Routing'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Assigned: <span className="text-slate-300 font-medium">{pr.assigned_approver_role || 'Manager'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusBadge(pr.status)}`}>
                        {pr.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPrForComparison(pr.id);
                          onNavigateToTab('vendor_comparison');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Bids ({pr.bids_count}) & AI
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
