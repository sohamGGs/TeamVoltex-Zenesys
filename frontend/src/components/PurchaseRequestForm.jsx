import React, { useState } from 'react';
import {
  PlusCircle,
  Sparkles,
  Send,
  Building,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Zap,
  Info,
  FileText
} from 'lucide-react';
import { prAPI } from '../api';

const DEPARTMENTS = [
  'Operations',
  'IT',
  'Supply Chain',
  'Manufacturing',
  'Engineering',
  'Facilities & MRO'
];

const URGENCIES = [
  { value: 'Low', label: 'Low (Standard 10-14 days SLA)', color: 'border-slate-600 text-slate-300' },
  { value: 'Medium', label: 'Medium (Standard 5-7 days SLA)', color: 'border-blue-500/50 text-blue-300' },
  { value: 'High', label: 'High (Expedited 3-4 days SLA)', color: 'border-amber-500/50 text-amber-300' },
  { value: 'Critical', label: 'Critical (Emergency 24-48h SLA)', color: 'border-rose-500/50 text-rose-300' },
];

const PRESETS = [
  {
    name: 'Rule 1: Operations CapEx > $100k',
    title: 'High-Precision Automated Conveyor Assembly & Stamping Cell',
    desc: 'Heavy industrial automated conveyor system with integrated PLC logic controllers and high-speed optical inspection for Line #2.',
    qty: 2,
    dept: 'Operations',
    urgency: 'High',
    budget: 135000,
    badge: 'Routes to Plant Head',
    policyTag: 'Compliant'
  },
  {
    name: 'Rule 2: Critical Urgency & Bulk > 500',
    title: 'Emergency Hydraulic High-Pressure Seals & Valve Packs',
    desc: 'Critical emergency overhaul kit for plant stamping presses to prevent catastrophic line downtime during peak shift.',
    qty: 600,
    dept: 'Operations',
    urgency: 'Critical',
    budget: 72000,
    badge: 'Routes to VP Operations',
    policyTag: 'Compliant'
  },
  {
    name: 'Policy Test: Spend Cap Violation ($185k)',
    title: 'Plant-Wide Smart Factory Automation & Robotic Palletizer Unit',
    desc: 'Automated high-capacity robotic palletizer cell for central warehouse distribution hub.',
    qty: 1,
    dept: 'Operations',
    urgency: 'High',
    budget: 185000,
    badge: 'Exceeds $150k Cap',
    policyTag: 'Spend Cap Alert'
  },
  {
    name: 'Policy Test: Recurring Renewal Disclosure',
    title: 'Enterprise ERP Cloud Infrastructure & Multi-Region Database Subscription',
    desc: 'Annual recurring subscription for high-availability enterprise database hosting and disaster recovery nodes.',
    qty: 1,
    dept: 'IT',
    urgency: 'Medium',
    budget: 48000,
    badge: 'Renewal Clause Needed',
    policyTag: 'Disclosure Alert'
  }
];

export default function PurchaseRequestForm({ onPrCreated }) {
  const [title, setTitle] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [department, setDepartment] = useState('Operations');
  const [urgency, setUrgency] = useState('Medium');
  const [estimatedBudget, setEstimatedBudget] = useState(35000);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);

  // Compute live routing rule preview
  const getRulePreview = () => {
    const budgetNum = Number(estimatedBudget) || 0;
    const qtyNum = Number(quantity) || 1;

    if (budgetNum > 100000 && department === 'Operations') {
      return {
        rule: 'Rule 1: Operations CapEx > $100k',
        approver: 'Plant Head (Marcus Sterling)',
        color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
        desc: 'High-value operational CapEx requires direct sign-off from the Plant Head.'
      };
    } else if (urgency === 'Critical' && qtyNum > 500) {
      return {
        rule: 'Rule 2: Critical Bulk Urgency (>500 units)',
        approver: 'VP Operations (Victoria Zhao)',
        color: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        desc: 'Critical urgency combined with high-volume quantity triggers executive VP Operations approval.'
      };
    } else if (budgetNum > 50000) {
      return {
        rule: 'Rule 3: High Value Purchase (> $50,000)',
        approver: 'Finance Director (Arthur Pendelton)',
        color: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
        desc: 'Any expenditure exceeding $50,000 requires corporate financial controller audit.'
      };
    } else {
      return {
        rule: 'Rule 4: Standard Departmental Request',
        approver: 'Department Manager (David Kross)',
        color: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
        desc: 'Standard operational expenditure within departmental authority limits.'
      };
    }
  };

  const currentRule = getRulePreview();

  const handleApplyPreset = (preset) => {
    setTitle(preset.title);
    setItemDescription(preset.desc);
    setQuantity(preset.qty);
    setDepartment(preset.dept);
    setUrgency(preset.urgency);
    setEstimatedBudget(preset.budget);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        item_description: itemDescription.trim(),
        quantity: parseInt(quantity, 10),
        urgency,
        department,
        estimated_budget: parseFloat(estimatedBudget)
      };

      const created = await prAPI.create(payload);
      setSuccessData(created);
    } catch (err) {
      console.error('Failed to create PR:', err);
      setError(err.response?.data?.detail || 'Failed to submit Purchase Request. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
          <PlusCircle className="w-3.5 h-3.5" /> Intelligent Purchase Initiation
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Create Purchase Request (PR)
        </h1>
        <p className="text-slate-400 text-xs md:text-sm mt-1">
          Initiate demand specification. ProcureIQ will auto-generate RFQ bids, evaluate autonomous RAG policy compliance against company bylaws, and dynamically route for multi-tier approval.
        </p>
      </div>

      {/* Quick Demo Presets */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Quick-Fill Demo Scenarios (1-Click)
          </span>
          <span className="text-[11px] text-slate-400">Click a scenario to test specific routing &amp; compliance rules</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-750 hover:border-blue-500/40 transition-all text-xs space-y-1.5 group cursor-pointer"
            >
              <div className="font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                {preset.name}
              </div>
              <div className="text-slate-400 text-[11px] line-clamp-2">{preset.title}</div>
              <div className="pt-1 flex items-center justify-between text-[10px]">
                <span className="text-emerald-400 font-mono font-semibold">${preset.budget.toLocaleString()}</span>
                <span className={`px-1.5 py-0.5 rounded font-medium border ${
                  preset.policyTag === 'Compliant'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                }`}>
                  {preset.policyTag}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Success Modal / Compliance Banner */}
      {successData && (
        <div className="glass-card rounded-2xl p-6 border-blue-500/40 bg-slate-900/90 space-y-5 animate-fade-in shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white">Purchase Request Initiated Successfully!</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs font-bold">
                  PR-{successData.id.toString().padStart(4, '0')}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                RFQ bids have been broadcast to 8 qualified suppliers and the approval workflow is active.
              </p>
              <div className="pt-2 flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                  Assigned Rule: <strong className="text-white">{successData.assigned_approval_rule}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300">
                  Target Approver: <strong className="text-white">{successData.assigned_approver_role}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                  Bids Received: <strong className="text-white">{successData.bids_count} Suppliers</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Autonomous RAG Compliance Result Panel */}
          {successData.compliance && (
            <div className={`p-4 rounded-xl border ${
              successData.compliance.compliant
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            } space-y-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {successData.compliance.compliant ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                  )}
                  <span className="text-sm font-bold text-white">
                    {successData.compliance.compliant
                      ? 'Autonomous Policy Compliance Guard: Verified Compliant'
                      : `Autonomous Policy Compliance Alert: Non-Compliant (${successData.compliance.violations?.length || 1} Violations)`}
                  </span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  successData.compliance.compliant
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {successData.compliance.compliant ? 'All 5 Policies Met' : 'Flagged for Review'}
                </span>
              </div>

              {successData.compliance.compliant ? (
                <p className="text-xs text-slate-300">
                  This request was automatically evaluated against company procurement bylaws via ChromaDB semantic vector search and verified compliant. No policy deviations or spend cap anomalies detected.
                </p>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="space-y-1.5">
                    {successData.compliance.violations?.map((v, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-900/80 border border-amber-500/30 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            {v.rule_name}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.2 rounded ${
                            v.severity === 'High'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {v.severity} Severity
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{v.explanation}</p>
                      </div>
                    ))}
                  </div>

                  {successData.compliance.required_action && (
                    <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200">
                      <strong className="text-white">Required Remediation Action: </strong>
                      {successData.compliance.required_action}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setSuccessData(null);
                setTitle('');
                setItemDescription('');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Create Another PR
            </button>
            <button
              type="button"
              onClick={() => onPrCreated(successData.id)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 cursor-pointer"
            >
              View Vendor Bids &amp; AI Audit <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Form & Live Routing Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Input Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 glass-card rounded-2xl p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-white border-b border-slate-700/60 pb-3 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" /> Request Specifications
          </h2>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* PR Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Purchase Request Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="e.g. Automated High-Speed Optical Inspection Scanner"
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Item Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Item Description & Engineering Specifications <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                required
                placeholder="Provide detailed technical specifications, model requirements, tolerance limits, and operational context..."
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Quantity & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Quantity (Units) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Requesting Department <span className="text-rose-400">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Estimated Budget & Urgency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Authorized Budget (USD $) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={estimatedBudget}
                    onChange={(e) => setEstimatedBudget(e.target.value)}
                    required
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Operational Urgency <span className="text-rose-400">*</span>
                </label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {URGENCIES.map((u) => (
                    <option key={u.value} value={u.value}>{u.value} SLA</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit PR & Broadcast RFQ
              </>
            )}
          </button>
        </form>

        {/* Right: Live Dynamic Routing Rule Card & Workflow Explanation */}
        <div className="lg:col-span-5 space-y-5">
          {/* Live Routing Engine Preview */}
          <div className="glass-card rounded-2xl p-6 space-y-4 border-blue-500/30">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" /> Dynamic Routing Engine
              </h3>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Live Preview
              </span>
            </div>

            <div className={`p-4 rounded-xl border ${currentRule.color} space-y-2`}>
              <div className="text-[11px] font-bold uppercase tracking-wider">Triggered Policy Rule</div>
              <div className="text-sm font-extrabold text-white">{currentRule.rule}</div>
              <p className="text-xs text-slate-300 leading-relaxed">{currentRule.desc}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
              <div className="text-slate-400 text-[11px] font-medium">Designated Approver Persona:</div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                  {currentRule.approver[0]}
                </div>
                <div className="font-semibold text-white">{currentRule.approver}</div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-2 text-[11px] text-slate-400">
              <div className="font-semibold text-slate-300">Approval Hierarchy Rules:</div>
              <ul className="space-y-1 pl-4 list-disc text-slate-400">
                <li><strong className="text-slate-300">Rule 1:</strong> Budget &gt; $100k &amp; Operations $\to$ <strong>Plant Head</strong></li>
                <li><strong className="text-slate-300">Rule 2:</strong> Critical &amp; Qty &gt; 500 $\to$ <strong>VP Operations</strong></li>
                <li><strong className="text-slate-300">Rule 3:</strong> Budget &gt; $50k $\to$ <strong>Finance Director</strong></li>
                <li><strong className="text-slate-300">Rule 4:</strong> Standard $\to$ <strong>Department Manager</strong></li>
              </ul>
            </div>
          </div>

          {/* Automated RFQ Process Box */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Automated RFQ &amp; AI Audit Pipeline
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upon PR creation, quotations are requested from 8 active suppliers across Enterprise Tier-1, Mid-Tier, and Economy Tier. 
              The system calculates composite weighted scores (Price 30, Delivery 25, Reliability 25, History 20) and sends data to <strong>Gemini 2.5 Flash</strong> for AI strategic evaluation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
