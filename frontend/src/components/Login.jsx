import React, { useState } from 'react';
import { Shield, Sparkles, Building2, UserCheck, ArrowRight, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authAPI } from '../api';

const DEMO_PERSONAS = [
  {
    role: 'Lead Procurement Officer',
    name: 'Elena Vance',
    email: 'admin@procureiq.internal',
    password: 'admin123',
    department: 'Supply Chain',
    desc: 'Full Procurement authority, RFQ panel management & PO release',
    color: 'from-blue-600 to-indigo-700',
    border: 'hover:border-blue-500',
    badge: 'Super Admin / Lead'
  },
  {
    role: 'Plant Head',
    name: 'Marcus Sterling',
    email: 'planthead@procureiq.internal',
    password: 'plant123',
    department: 'Operations',
    desc: 'Approver for Rule 1: Operations CapEx > $100,000',
    color: 'from-emerald-600 to-teal-700',
    border: 'hover:border-emerald-500',
    badge: 'Rule 1 Approver'
  },
  {
    role: 'VP Operations',
    name: 'Victoria Zhao',
    email: 'vpops@procureiq.internal',
    password: 'vp123',
    department: 'Operations',
    desc: 'Approver for Rule 2: Critical Urgency & Bulk Quantity > 500',
    color: 'from-amber-600 to-orange-700',
    border: 'hover:border-amber-500',
    badge: 'Rule 2 Approver'
  },
  {
    role: 'Finance Director',
    name: 'Arthur Pendelton',
    email: 'finance@procureiq.internal',
    password: 'finance123',
    department: 'Finance',
    desc: 'Approver for Rule 3: High Value Purchase > $50,000',
    color: 'from-purple-600 to-violet-700',
    border: 'hover:border-purple-500',
    badge: 'Rule 3 Approver'
  },
  {
    role: 'Department Manager',
    name: 'David Kross',
    email: 'deptmgr@procureiq.internal',
    password: 'dept123',
    department: 'Engineering',
    desc: 'Approver for Rule 4: Standard Departmental PRs',
    color: 'from-cyan-600 to-blue-700',
    border: 'hover:border-cyan-500',
    badge: 'Rule 4 Approver'
  }
];

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin@procureiq.internal');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e, customEmail, customPassword) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPassword = customPassword || password;

    setError('');
    setLoading(true);

    try {
      const data = await authAPI.login(loginEmail, loginPassword);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLoginSuccess(data.user, data.access_token);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = (persona) => {
    setEmail(persona.email);
    setPassword(persona.password);
    handleLogin(null, persona.email, persona.password);
  };

  return (
    <div className="min-h-screen w-full bg-[#070b14] flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[350px] h-[350px] bg-cyan-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-6xl z-10 space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> NetSuite-Aligned Intelligent ERP
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white flex items-center justify-center gap-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300">
              ProcureIQ
            </span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
            Autonomous Procurement Optimization Engine: Streamlining PR-to-PO lifecycle, 
            Tiered Vendor Scoring, Multi-Rule Dynamic Approvals & 3-Way Match Verification.
          </p>
        </div>

        {/* 2-Column Section: Left is Form, Right is Quick Personas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct Login */}
          <div className="lg:col-span-5 glass-card rounded-2xl p-6 md:p-8 space-y-6">
            <div className="border-b border-slate-700/60 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-400" /> Secure ERP Sign In
              </h2>
              <p className="text-slate-400 text-xs mt-1">Authenticate with your corporate credentials</p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Corporate Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@procureiq.internal"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-900/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Access ERP Workspace
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> NetSuite Sandbox Connected
              </span>
              <span>v1.0.0 (Hackathon)</span>
            </div>
          </div>

          {/* Right Column: Quick Demo Persona Switcher */}
          <div className="lg:col-span-7 glass-card rounded-2xl p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-400" /> Quick Demo Personas
                </h2>
                <p className="text-slate-400 text-xs mt-1">
                  1-Click instant sign in to test role-specific approval rules & workflows
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
                5 Roles
              </span>
            </div>

            <div className="space-y-2.5">
              {DEMO_PERSONAS.map((persona) => (
                <button
                  key={persona.email}
                  type="button"
                  onClick={() => handleQuickPersona(persona)}
                  disabled={loading}
                  className={`w-full text-left p-3.5 rounded-xl bg-slate-900/60 border border-slate-750 ${persona.border} transition-all duration-200 hover:bg-slate-800/80 group flex items-center justify-between cursor-pointer disabled:opacity-50`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${persona.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                      {persona.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-semibold group-hover:text-blue-300 transition-colors">
                          {persona.name}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                          {persona.role}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{persona.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline-block text-[11px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                      Select & Login
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:border-blue-500/50 group-hover:bg-blue-600/20 transition-all">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Multi-tier approval hierarchy pre-configured in SQLite database
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
