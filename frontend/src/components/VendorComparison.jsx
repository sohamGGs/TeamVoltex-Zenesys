import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Award,
  DollarSign,
  Truck,
  ShieldCheck,
  History,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileCheck,
  ChevronDown,
  Check,
  ArrowRight,
  RefreshCw,
  Cpu,
  Info,
  Zap,
  Bot,
  MessageSquare,
  Clock,
  ArrowDownRight,
  ShieldAlert,
  SlidersHorizontal,
  User,
  Building
} from 'lucide-react';
import { prAPI, vendorAPI, dashboardAPI, approvalsAPI } from '../api';

export default function VendorComparison({
  selectedPrId,
  onSelectPr,
  onNavigateToTab,
  onPoGenerated
}) {
  const [prs, setPrs] = useState([]);
  const [activePrId, setActivePrId] = useState(selectedPrId || null);
  const [prDetail, setPrDetail] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [aiAudit, setAiAudit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [generatingPo, setGeneratingPo] = useState(false);
  const [error, setError] = useState('');
  const [poSuccess, setPoSuccess] = useState(null);

  // Negotiation States
  const [isNegotiating, setIsNegotiating] = useState(false);
  const [negotiationData, setNegotiationData] = useState(null);
  const [negotiationSuccess, setNegotiationSuccess] = useState(false);

  // Load all PRs for the dropdown
  useEffect(() => {
    const fetchPrs = async () => {
      try {
        const data = await prAPI.getAll();
        setPrs(data || []);
        if (!activePrId && data && data.length > 0) {
          setActivePrId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load PRs:', err);
      }
    };
    fetchPrs();
  }, []);

  // When selectedPrId changes from parent
  useEffect(() => {
    if (selectedPrId) {
      setActivePrId(selectedPrId);
    }
  }, [selectedPrId]);

  // Load recommendations & PR detail when activePrId changes
  useEffect(() => {
    if (!activePrId) return;

    const fetchPRData = async () => {
      setLoading(true);
      setError('');
      setAiAudit(null);
      setPoSuccess(null);
      setNegotiationData(null);
      setNegotiationSuccess(false);

      try {
        const [detailData, recData] = await Promise.all([
          prAPI.getById(activePrId),
          vendorAPI.getRecommendations(activePrId),
        ]);
        setPrDetail(detailData);
        const recs = recData?.recommendations || [];
        setRecommendations(recs);

        // Check if top recommendations already have saved negotiation transcripts
        const topWithTranscripts = recs.filter((r) => Array.isArray(r.negotiation_transcript) && r.negotiation_transcript.length > 0);
        if (topWithTranscripts.length > 0) {
          // Reconstruct negotiation data from stored bids
          let totalInit = 0;
          let totalNeg = 0;
          const reconstructedResults = topWithTranscripts.map((r) => {
            const origP = r.original_quoted_price ?? r.quoted_price;
            const origD = r.original_delivery_days ?? r.delivery_days;
            const savings = Math.max(0, origP - r.quoted_price);
            const savingsPct = origP > 0 ? (savings / origP) * 100 : 0;
            totalInit += origP;
            totalNeg += r.quoted_price;

            return {
              vendor_id: r.vendor_id,
              vendor_name: r.vendor_name,
              pricing_tier: r.pricing_tier,
              original_price: origP,
              negotiated_price: r.quoted_price,
              original_days: origD,
              negotiated_days: r.delivery_days,
              savings_amount: savings,
              savings_pct: savingsPct,
              days_saved: Math.max(0, origD - r.delivery_days),
              status: 'completed',
              transcript: r.negotiation_transcript,
              updated_score: r.scores?.total_score
            };
          });

          setNegotiationData({
            pr_id: activePrId,
            pr_title: detailData.title,
            estimated_budget: detailData.estimated_budget,
            total_initial_spend: totalInit,
            total_negotiated_spend: totalNeg,
            total_savings: Math.max(0, totalInit - totalNeg),
            total_savings_pct: totalInit > 0 ? ((totalInit - totalNeg) / totalInit) * 100 : 0,
            top_vendor_id: recs[0]?.vendor_id,
            top_vendor_name: recs[0]?.vendor_name,
            results: reconstructedResults,
            recommendations: recs
          });
        }

        // Automatically trigger AI audit
        triggerAiAudit(activePrId);
      } catch (err) {
        console.error('Failed to fetch recommendations:', err);
        setError('Failed to load vendor quotation data.');
      } finally {
        setLoading(false);
      }
    };

    fetchPRData();
  }, [activePrId]);

  const triggerAiAudit = async (prIdToAudit) => {
    const id = prIdToAudit || activePrId;
    if (!id) return;
    setAiLoading(true);
    try {
      const data = await dashboardAPI.runAIAnalysis(id);
      setAiAudit(data);
    } catch (err) {
      console.error('AI audit error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunNegotiation = async () => {
    if (!activePrId) return;
    setIsNegotiating(true);
    setError('');
    setNegotiationSuccess(false);

    try {
      const data = await vendorAPI.negotiate(activePrId);
      setNegotiationData(data);
      if (Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
      }
      setNegotiationSuccess(true);
      // Re-trigger AI audit with the newly negotiated pricing
      triggerAiAudit(activePrId);
    } catch (err) {
      console.error('Negotiation error:', err);
      setError(err.response?.data?.detail || 'Failed to complete autonomous negotiation.');
    } finally {
      setIsNegotiating(false);
    }
  };

  const handleAuthorizePo = async (vendorId) => {
    if (!activePrId) return;
    setGeneratingPo(true);
    try {
      const res = await approvalsAPI.generatePO(
        activePrId,
        vendorId,
        'Authorized via Vendor Comparison & Gemini AI Audit Matrix'
      );
      setPoSuccess(res.po);
      if (onPoGenerated) onPoGenerated(res.po);

      // Refresh PR detail
      const refreshed = await prAPI.getById(activePrId);
      setPrDetail(refreshed);
    } catch (err) {
      console.error('Failed to generate PO:', err);
      setError(err.response?.data?.detail || 'Failed to authorize PO.');
    } finally {
      setGeneratingPo(false);
    }
  };

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'Enterprise Tier-1':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'Mid-Tier':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      default:
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 80) return 'text-blue-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & PR Selector & Negotiation Trigger */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Multi-Vendor RFQ Scoring &amp; Autonomous Negotiation
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Vendor Comparison &amp; AI Recommendation
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Autonomous multi-agent LangGraph negotiation with Gemini 2.5 Flash executive insights.
          </p>
        </div>

        {/* PR Selector & Negotiation Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium whitespace-nowrap">Active PR:</label>
            <div className="relative min-w-[240px]">
              <select
                value={activePrId || ''}
                onChange={(e) => setActivePrId(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {prs.map((p) => (
                  <option key={p.id} value={p.id}>
                    PR-{(p.id || 0).toString().padStart(4, '0')} : {p.title?.slice(0, 32)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Autonomous Negotiation Trigger Button */}
          <button
            type="button"
            onClick={handleRunNegotiation}
            disabled={isNegotiating || !activePrId}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-60 cursor-pointer"
          >
            <Zap className={`w-4 h-4 text-amber-300 ${isNegotiating ? 'animate-bounce' : ''}`} />
            {isNegotiating ? (
              <span className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Negotiating (3 Rounds)...
              </span>
            ) : (
              'Run Autonomous Negotiation'
            )}
          </button>
        </div>
      </div>

      {/* PR Summary Bar */}
      {prDetail && (
        <div className="glass-card rounded-2xl p-5 border-slate-750 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-blue-400">
                PR-{(prDetail.id || 0).toString().padStart(4, '0')}
              </span>
              <span className="text-sm font-bold text-white">{prDetail.title}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                prDetail.urgency === 'Critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}>
                {prDetail.urgency} Urgency
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1">{prDetail.item_description}</p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Authorized Budget</span>
              <span className="font-mono font-bold text-white">${(prDetail.estimated_budget || 0).toLocaleString()}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Department</span>
              <span className="font-bold text-slate-300">{prDetail.department}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">Quantity</span>
              <span className="font-bold text-slate-300">{prDetail.quantity} Units</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 text-[10px] block">PR Status</span>
              <span className="font-bold text-emerald-400">{prDetail.status}</span>
            </div>
          </div>
        </div>
      )}

      {/* PO Generated Success Alert */}
      {poSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="text-white text-sm">Purchase Order {poSuccess.po_number} Authorized!</strong>
              <div className="text-emerald-300/90 mt-0.5">
                ReportLab PDF generated and saved to ERP repository. Status: Sent.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('purchase_orders')}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            Open in PO Register <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* --- AUTONOMOUS MULTI-AGENT NEGOTIATION TRANSCRIPT PANEL --- */}
      {(isNegotiating || (negotiationData && Array.isArray(negotiationData.results) && negotiationData.results.length > 0)) && (
        <div className="glass-card rounded-2xl p-6 border-purple-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/30 space-y-6 shadow-xl shadow-purple-950/20 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
                <Zap className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-white">LangGraph Multi-Agent Autonomous Negotiation</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <Bot className="w-3 h-3 text-purple-400" /> 3-Round Fixed Graph
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  BuyerAgent dynamically bargained with the Top 3 scored vendor personas under hard-guarded price &amp; SLA floors.
                </p>
              </div>
            </div>

            {/* Total Savings Pill */}
            {negotiationData && (
              <div className="flex items-center gap-3 self-start sm:self-auto bg-slate-900/90 border border-purple-500/30 px-4 py-2 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Autonomous Net Savings</span>
                  <div className="text-sm font-extrabold text-emerald-400 font-mono flex items-center gap-1">
                    +${(negotiationData.total_savings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    <span className="text-xs text-emerald-300 font-normal">
                      ({(negotiationData.total_savings_pct || 0).toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {isNegotiating ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-10 h-10 border-3 border-purple-500/30 border-t-purple-400 rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">LangGraph Multi-Agent Graph in Execution</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Simultaneously orchestrating 3 rounds of price discovery, persona counters, and contractual SLA settlement...
                </p>
              </div>
            </div>
          ) : negotiationData && (
            <div className="space-y-5">
              {/* 3-Column Chat Transcript Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {negotiationData.results.map((vr) => {
                  const hasSavings = vr.savings_amount > 0;
                  const isHeld = vr.status === 'held';

                  return (
                    <div
                      key={vr.vendor_id}
                      className="rounded-2xl bg-slate-900/90 border border-slate-750 flex flex-col justify-between overflow-hidden shadow-lg"
                    >
                      {/* Column Header: Vendor Persona & Delta */}
                      <div className="p-4 bg-slate-850/80 border-b border-slate-750 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierBadge(vr.pricing_tier)}`}>
                            {vr.pricing_tier}
                          </span>
                          {isHeld ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              Standard Quote Held
                            </span>
                          ) : hasSavings ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                              -${vr.savings_amount.toLocaleString()} ({vr.savings_pct.toFixed(1)}%)
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              Held Firm
                            </span>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white truncate">{vr.vendor_name}</h4>
                          <div className="flex items-center justify-between text-xs pt-1 font-mono">
                            <span className="text-slate-400">
                              Original: <span className="line-through">${vr.original_price.toLocaleString()}</span>
                            </span>
                            <span className="text-emerald-400 font-bold">
                              Final: ${vr.negotiated_price.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                            <span>SLA: {vr.original_days}d → <strong className="text-white">{vr.negotiated_days}d</strong></span>
                            {vr.days_saved > 0 && (
                              <span className="text-blue-300">({vr.days_saved}d faster)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Message Bubbles Container */}
                      <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-[380px] text-xs">
                        {vr.transcript.map((turn, tIdx) => {
                          const isBuyer = turn.speaker_role === 'buyer';

                          return (
                            <div
                              key={tIdx}
                              className={`flex flex-col space-y-1 ${isBuyer ? 'items-start' : 'items-end'}`}
                            >
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                                {isBuyer ? (
                                  <>
                                    <Bot className="w-3 h-3 text-blue-400" />
                                    <span className="font-semibold text-blue-300">BuyerAgent (R{turn.round})</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="font-semibold text-purple-300">Vendor Sales (R{turn.round})</span>
                                    <User className="w-3 h-3 text-purple-400" />
                                  </>
                                )}
                              </div>

                              <div
                                className={`p-3 rounded-2xl max-w-[92%] space-y-1.5 leading-relaxed ${
                                  isBuyer
                                    ? 'bg-blue-950/50 border border-blue-500/30 text-blue-100 rounded-tl-sm'
                                    : 'bg-slate-800/90 border border-purple-500/30 text-slate-200 rounded-tr-sm'
                                }`}
                              >
                                <p className="text-[11px]">{turn.message}</p>
                                <div className="flex items-center gap-2 pt-1 border-t border-white/10 text-[10px] font-mono text-slate-300">
                                  <span>Offer: <strong className="text-white">${turn.offered_price.toLocaleString()}</strong></span>
                                  <span>•</span>
                                  <span>SLA: <strong className="text-white">{turn.offered_days}d</strong></span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer / Fast Action for this Column */}
                      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          Updated Score: <strong className="text-emerald-400 font-mono">{vr.updated_score?.toFixed(1) || '95.0'}/100</strong>
                        </span>
                        <button
                          type="button"
                          disabled={generatingPo}
                          onClick={() => handleAuthorizePo(vr.vendor_id)}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1 shadow transition-colors cursor-pointer"
                        >
                          <FileCheck className="w-3 h-3" /> Award Negotiated
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Executive Auditor Panel */}
      <div className="glass-card rounded-2xl p-6 border-blue-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-blue-950/20 space-y-5 shadow-glow-blue/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Gemini 2.5 Flash Strategic Procurement Audit</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  aiAudit?.is_live_gemini
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}>
                  {aiAudit?.is_live_gemini ? 'Gemini 2.5 Live' : 'Autonomous AI Auditor'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Deep structural trade-off analysis across cost, lead time, reliability, and supplier risk</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => triggerAiAudit()}
            disabled={aiLoading}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
            {aiLoading ? 'Auditing Bids...' : 'Re-Run AI Audit'}
          </button>
        </div>

        {aiLoading ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Gemini 2.5 Flash is analyzing quotation variances and historical reliability...</p>
          </div>
        ) : aiAudit ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left AI Column: Recommended Winner & Confidence */}
            <div className="lg:col-span-5 p-4 rounded-xl bg-slate-900/80 border border-slate-750 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recommended Award</span>
                <span className="text-xs font-extrabold text-emerald-400 font-mono">
                  {aiAudit.confidence_score}% Confidence
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  {aiAudit.selected_vendor_name}
                </div>
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  Est. Net Savings: ${aiAudit.net_savings_estimate.toLocaleString()}
                </div>
              </div>

              {/* Confidence Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${aiAudit.confidence_score}%` }}
                />
              </div>

              {/* Executive Summary */}
              <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 leading-relaxed italic">
                "{aiAudit.executive_summary}"
              </div>
            </div>

            {/* Right AI Column: Key Advantages & Risk Matrix */}
            <div className="lg:col-span-7 space-y-4">
              {/* Key Advantages */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" /> Key Strategic Advantages
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {aiAudit.key_advantages?.map((adv, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                      <span>{adv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Assessment */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-750 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Risk Level
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border ${
                    aiAudit.risk_assessment?.risk_level === 'High'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : aiAudit.risk_assessment?.risk_level === 'Moderate'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {aiAudit.risk_assessment?.risk_level || 'Low'} Risk
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  <strong className="text-slate-300">Mitigation:</strong> {aiAudit.risk_assessment?.mitigation_advice}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Vendor Scoring Algorithm Formula Explainer Bar */}
      <div className="space-y-2">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span>
              <strong className="text-white">ProcureIQ Scoring Model:</strong> Total (100) = Price (30 max) + Delivery (25 max) + Reliability (25 max) + History (20 max) + Nearshoring ESG Bonus (+3.0 max)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            History Score = mean(delivery, order_accuracy, quality)
          </span>
        </div>

        {/* Cold-Start & Local Sourcing Policy Note */}
        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-emerald-300">Oracle NetSuite Vendor Cold-Start &amp; ESG Policy: </span>
            Local SMB &amp; new suppliers with 0 legacy ERP orders are evaluated via a <strong className="text-white">Bayesian Neutral Baseline (80%)</strong> + <strong className="text-emerald-300">+3.0 pt Nearshoring ESG Credit</strong> (&lt;25km), preventing cold-start discrimination while maintaining ISO quality standards.
          </div>
        </div>
      </div>

      {/* Vendor Bids Matrix Table */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-400" /> Supplier Quotation Ranking Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Ranked comparison of all active vendor submissions for this purchase request
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
            {recommendations.length} Bids Evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700/80 text-slate-400 uppercase text-[10px] tracking-wider bg-slate-900/40">
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Supplier &amp; Tier</th>
                <th className="py-3 px-3 font-mono text-right">Quoted Price</th>
                <th className="py-3 px-3 text-right">Variance</th>
                <th className="py-3 px-3 text-center">Delivery SLA</th>
                <th className="py-3 px-3 text-center">Reliability</th>
                <th className="py-3 px-3 text-center">History (ERP)</th>
                <th className="py-3 px-3 text-center font-mono">Price (30)</th>
                <th className="py-3 px-3 text-center font-mono">Deliv (25)</th>
                <th className="py-3 px-3 text-center font-mono">Rel (25)</th>
                <th className="py-3 px-3 text-center font-mono">Hist (20)</th>
                <th className="py-3 px-3 text-center font-mono">ESG (+3)</th>
                <th className="py-3 px-3 font-mono text-right">Total Score</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {recommendations.map((rec) => {
                const isWinner = rec.rank === 1;
                const isSelectedByAi = aiAudit?.selected_vendor_name === rec.vendor_name;

                return (
                  <tr
                    key={rec.bid_id}
                    className={`transition-colors ${
                      isWinner
                        ? 'bg-blue-950/25 hover:bg-blue-950/40'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3 font-bold">
                      {rec.rank === 1 ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] flex items-center gap-1 w-max">
                          <Award className="w-3 h-3" /> #1 Best
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">#{rec.rank}</span>
                      )}
                    </td>

                    {/* Supplier & Tier */}
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-white flex flex-wrap items-center gap-1.5">
                        {rec.vendor_name}
                        {isSelectedByAi && (
                          <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30">
                            AI Pick
                          </span>
                        )}
                        {rec.is_incubator && (
                          <span
                            title="Evaluated via Bayesian Cold-Start Prior (80% baseline) + Nearshoring ESG Credit (+3.0 pts for local supply)"
                            className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30 flex items-center gap-0.5"
                          >
                            🌱 Local SMB ({rec.local_proximity_km || 12}km)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border font-medium ${getTierBadge(rec.pricing_tier)}`}>
                          {rec.pricing_tier}
                        </span>
                        <span className="text-[10px] text-slate-400">{rec.contact_email}</span>
                      </div>
                    </td>

                    {/* Quoted Price */}
                    <td className="py-3.5 px-3 text-right font-mono font-bold">
                      {rec.original_quoted_price && rec.original_quoted_price > rec.quoted_price ? (
                        <div className="space-y-0.5">
                          <div className="text-[10px] text-slate-500 line-through">
                            ${rec.original_quoted_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-emerald-400 font-extrabold flex items-center justify-end gap-1">
                            <Zap className="w-3 h-3 text-amber-300" />
                            ${rec.quoted_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-white">
                          ${rec.quoted_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>

                    {/* Variance vs Budget */}
                    <td className="py-3.5 px-3 text-right font-mono text-[11px]">
                      <span className={rec.scores.price_variance_pct <= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {rec.scores.price_variance_pct <= 0 ? '' : '+'}
                        {rec.scores.price_variance_pct}%
                      </span>
                    </td>

                    {/* Delivery Days */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-semibold text-slate-200">{rec.delivery_days} days</span>
                      {rec.original_delivery_days && rec.original_delivery_days > rec.delivery_days && (
                        <span className="text-[10px] text-blue-400 block font-semibold">
                          (-{rec.original_delivery_days - rec.delivery_days}d SLA)
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 block">(avg: {rec.avg_delivery_days})</span>
                    </td>

                    {/* Reliability */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-semibold text-slate-200">{rec.reliability_score}%</span>
                    </td>

                    {/* History */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-semibold text-slate-200">{rec.history_score_raw}%</span>
                      {rec.is_incubator && (
                        <span className="text-[9px] text-emerald-400 block font-semibold">
                          (Bayesian Prior)
                        </span>
                      )}
                    </td>

                    {/* Price Score (30) */}
                    <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                      {rec.scores.price_score.toFixed(1)}
                    </td>

                    {/* Delivery Score (25) */}
                    <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                      {rec.scores.delivery_score.toFixed(1)}
                    </td>

                    {/* Reliability Score (25) */}
                    <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                      {rec.scores.reliability_score.toFixed(1)}
                    </td>

                    {/* History Score (20) */}
                    <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                      {rec.scores.history_score.toFixed(1)}
                    </td>

                    {/* ESG Nearshoring Bonus (+3) */}
                    <td className="py-3.5 px-3 text-center font-mono">
                      {rec.scores.nearshoring_bonus > 0 ? (
                        <span className="text-emerald-400 font-bold">+{rec.scores.nearshoring_bonus.toFixed(1)}</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Total Composite Score (100) */}
                    <td className="py-3.5 px-3 text-right font-mono font-extrabold text-sm">
                      <span className={getScoreColor(rec.scores.total_score)}>
                        {rec.scores.total_score.toFixed(1)}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-3 text-center">
                      {prDetail?.purchase_order ? (
                        <span className="text-[10px] text-emerald-400 font-semibold px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
                          PO Issued
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={generatingPo}
                          onClick={() => handleAuthorizePo(rec.vendor_id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer mx-auto ${
                            isWinner
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>Award &amp; PO</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
