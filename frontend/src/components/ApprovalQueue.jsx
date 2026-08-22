import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Building,
  DollarSign,
  User,
  MessageSquare,
  FileText,
  AlertTriangle,
  Award,
  Filter
} from 'lucide-react';
import { approvalsAPI } from '../api';

export default function ApprovalQueue({
  user,
  onNavigateToTab,
  onSelectPrForComparison,
  onPoGenerated
}) {
  const [queue, setQueue] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null); // { type: 'approve'|'reject', item: wf }
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await approvalsAPI.getQueue(statusFilter === 'All' ? null : statusFilter);
      setQueue(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load approval queue:', err);
      setError(err.response?.data?.detail || 'Unable to load approval workflows.');
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [statusFilter]);

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionModal) return;

    setActionLoading(true);
    setError('');

    try {
      const { type, item } = actionModal;
      if (type === 'approve') {
        // Authorize and generate PO
        const res = await approvalsAPI.generatePO(
          item.pr_id,
          item.top_bid?.vendor_id,
          comment || `Authorized by ${user?.full_name || 'Executive'} (${user?.role || 'Approver'})`
        );
        if (onPoGenerated) onPoGenerated(res.po);
      } else {
        // Reject workflow
        await approvalsAPI.takeAction(
          item.id,
          'Rejected',
          comment || `Rejected by ${user?.full_name || 'Executive'} (${user?.role || 'Approver'})`
        );
      }

      setActionModal(null);
      setComment('');
      fetchQueue();
    } catch (err) {
      console.error('Action error:', err);
      setError(err.response?.data?.detail || 'Failed to submit approval decision.');
    } finally {
      setActionLoading(false);
    }
  };

  const getRuleBadge = (rule) => {
    const r = String(rule || '');
    if (r.includes('Rule 1')) {
      return { label: 'Rule 1: Plant Head CapEx ($100k+)', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    } else if (r.includes('Rule 2')) {
      return { label: 'Rule 2: VP Ops Critical Urgency (>500)', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    } else if (r.includes('Rule 3')) {
      return { label: 'Rule 3: Finance Director (> $50k)', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
    } else {
      return { label: 'Rule 4: Department Manager Standard', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
    }
  };

  const getStatusPill = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Rejected':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <CheckSquare className="w-3.5 h-3.5" /> Governance &amp; Multi-Rule Routing
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Executive Approval Queue
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Dynamic policy verification. Authorizing requests automatically compiles official NetSuite ReportLab Purchase Orders.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs self-start md:self-auto">
          {['Pending', 'Approved', 'Rejected', 'All'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Approver Persona Context Card */}
      <div className="glass-card rounded-2xl p-4 md:p-5 flex items-center justify-between gap-4 border-slate-750">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Current Approver Authority:</div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              {user?.full_name || 'Executive User'}
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          Showing requests assigned to <strong className="text-slate-200">{user?.role}</strong> or full organization queue
        </div>
      </div>

      {/* Queue Items */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-800/40 rounded-2xl border border-slate-750" />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-400/80 mx-auto" />
          <h3 className="text-base font-bold text-white">No {statusFilter} Approvals in Queue</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            All purchase requests matching your criteria have been processed in accordance with NetSuite ERP governance rules.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {queue.map((wf) => {
            const ruleBadge = getRuleBadge(wf.triggered_rule);
            const isPending = wf.status === 'Pending';

            return (
              <div
                key={wf.id}
                className="glass-card rounded-2xl p-6 border-slate-750 space-y-4 transition-all hover:border-slate-650"
              >
                {/* Top Row: PR ID, Title, Rule, Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-blue-400">
                      PR-{(wf.pr_id || 0).toString().padStart(4, '0')}
                    </span>
                    <h3 className="text-base font-bold text-white">{wf.pr_title || 'Purchase Request'}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Compliance Status Badge */}
                    {wf.compliance && (
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        wf.compliance.compliant
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30 animate-pulse'
                      }`}>
                        {wf.compliance.compliant ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Compliant
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3 h-3 text-rose-400" /> Policy Alert ({Array.isArray(wf.compliance.violations) ? wf.compliance.violations.length : 1})
                          </>
                        )}
                      </span>
                    )}

                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${ruleBadge.color}`}>
                      {ruleBadge.label}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getStatusPill(wf.status)}`}>
                      {wf.status || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Middle Grid: PR Details & Supplier Bid Summary */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Left PR Info */}
                  <div className="md:col-span-7 space-y-2 text-xs">
                    <p className="text-slate-300 leading-relaxed">{wf.item_description || 'No description provided.'}</p>
                    
                    <div className="flex flex-wrap gap-4 text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-500" /> Department: <strong className="text-slate-200">{wf.department || 'Operations'}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-500" /> Requester: <strong className="text-slate-200">{wf.requester?.full_name || 'Elena Vance'}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-500" /> Authorized Budget: <strong className="text-emerald-400 font-mono">${(wf.estimated_budget || 0).toLocaleString()}</strong>
                      </span>
                    </div>

                    {/* Policy Compliance Warning Box if Non-Compliant */}
                    {wf.compliance && !wf.compliance.compliant && (
                      <div className="mt-2 p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs space-y-1.5">
                        <div className="font-bold text-rose-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          RAG Policy Guard Alerts:
                        </div>
                        <div className="space-y-1 pl-4">
                          {(Array.isArray(wf.compliance.violations) ? wf.compliance.violations : []).map((v, idx) => (
                            <div key={idx} className="text-[11px] text-slate-300">
                              <strong className="text-rose-200">{v.rule_name || 'Policy Rule'} ({v.severity || 'Medium'}):</strong> {v.explanation || ''}
                            </div>
                          ))}
                        </div>
                        {wf.compliance.required_action && (
                          <div className="text-[11px] text-blue-300 pt-0.5 border-t border-rose-500/20">
                            <strong>Remediation:</strong> {wf.compliance.required_action}
                          </div>
                        )}
                      </div>
                    )}

                    {wf.comment && (
                      <div className="mt-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span><strong>Remarks:</strong> {wf.comment}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Recommended Supplier Bid Card */}
                  <div className="md:col-span-5 p-4 rounded-xl bg-slate-900/80 border border-slate-750 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-400" /> Top Ranked Bidder:
                      </span>
                      <span className="text-emerald-400 font-bold font-mono">
                        Score: {wf.top_bid?.bid_score?.toFixed(1) || '95.0'}/100
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">{wf.top_bid?.vendor_name || 'Primary Supplier'}</div>
                        <div className="text-[10px] text-slate-400">
                          {wf.top_bid?.pricing_tier || 'Enterprise Tier-1'} • SLA: {wf.top_bid?.delivery_days || 3} Business Days
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-mono font-extrabold text-white">
                          ${(wf.top_bid?.quoted_price || wf.estimated_budget || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-emerald-400">
                          Net Savings: ${Math.max(0, (wf.estimated_budget || 0) - (wf.top_bid?.quoted_price || wf.estimated_budget || 0)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Initiated on {wf.created_at ? new Date(wf.created_at).toLocaleDateString() : 'Recently'}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPrForComparison(wf.pr_id);
                        onNavigateToTab('vendor_comparison');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Full Bids Matrix
                    </button>

                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => setActionModal({ type: 'reject', item: wf })}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>

                        <button
                          type="button"
                          onClick={() => setActionModal({ type: 'approve', item: wf })}
                          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Authorize &amp; Issue PO
                        </button>
                      </>
                    )}

                    {wf.has_po && (
                      <button
                        type="button"
                        onClick={() => onNavigateToTab('purchase_orders')}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> View {wf.po_number || 'PO'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal (Authorize / Reject) */}
      {actionModal && actionModal.item && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 md:p-7 max-w-lg w-full space-y-5 border-slate-700 shadow-2xl animate-fade-in">
            <div className="border-b border-slate-700/60 pb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {actionModal.type === 'approve' ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Authorize &amp; Compile NetSuite PO
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-400" />
                    Reject Purchase Request
                  </>
                )}
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="font-bold text-white">{actionModal.item.pr_title || 'Purchase Request'}</div>
                <div className="text-slate-400">
                  Department: <strong className="text-slate-300">{actionModal.item.department || 'Operations'}</strong> • 
                  Budget: <strong className="text-emerald-400 font-mono">${(actionModal.item.estimated_budget || 0).toLocaleString()}</strong>
                </div>
                <div className="text-[11px] text-blue-400 font-semibold pt-1">
                  Policy: {actionModal.item.triggered_rule || 'Standard Policy'}
                </div>
              </div>

              {actionModal.type === 'approve' && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                  Awarding to winning supplier <strong className="text-white">{actionModal.item.top_bid?.vendor_name || 'Primary Supplier'}</strong> at 
                  <strong className="font-mono text-emerald-300"> ${(actionModal.item.top_bid?.quoted_price || actionModal.item.estimated_budget || 0).toLocaleString()}</strong>. 
                  A binding ReportLab PDF Purchase Order will be generated immediately.
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  {actionModal.type === 'approve' ? 'Approver Executive Remarks' : 'Reason for Rejection'}
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={actionModal.type === 'approve' ? 'e.g. Approved. Verified against Q3 CapEx operational plan.' : 'e.g. Budget ceiling exceeded. Please revise specifications.'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handleActionSubmit}
                className={`px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer ${
                  actionModal.type === 'approve'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/20'
                }`}
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Confirm &amp; Proceed</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
