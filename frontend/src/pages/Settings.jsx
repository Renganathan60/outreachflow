import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  Database,
  Server,
  Key,
  Sliders,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Badge from '../components/common/Badge.jsx';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">System Configuration & Rules</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Architecture parameters, scoring weights, verification engines, and Campaign Guard settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scoring Engine Reference */}
        <Card
          title="Lead Prioritization Rule Engine (0-100)"
          subtitle="Isolated TypeScript service rules"
        >
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Deliverable Corporate Email</p>
                <p className="text-[10px] text-slate-500">Valid MX domain format & syntax</p>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">+20 pts</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Senior Decision Maker Title</p>
                <p className="text-[10px] text-slate-500">CEO, CTO, VP, Founder, Director, Head of</p>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">+25 pts</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Enterprise Company Size</p>
                <p className="text-[10px] text-slate-500">500+ employees (+20), 201-500 (+15), 51-200 (+10)</p>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">+20 pts</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Target Industry Alignment</p>
                <p className="text-[10px] text-slate-500">Technology, SaaS, Fintech, AI, Healthcare, Cloud</p>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">+10 pts</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Prospect Engaged / Replied</p>
                <p className="text-[10px] text-slate-500">Positive response signal received</p>
              </div>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">+25 pts</span>
            </div>
          </div>
        </Card>

        {/* Campaign Guard Rules Reference */}
        <Card
          title="Campaign Guard Safety Validation (7 Rules)"
          subtitle="Pre-outreach deliverability & compliance checks"
        >
          <div className="space-y-2 text-xs">
            {[
              'Email Syntax & Deliverability Validation (INVALID addresses blocked)',
              'Single Outreach Policy (No duplicate contact by the same campaign)',
              'Suppression List Enforcement (DO_NOT_CONTACT & opt-outs blocked)',
              'Unresponsive Account Filtering (Cooldown protection)',
              'Campaign Status Check (Enforcing ACTIVE state)',
              'Account Conversion Check (Converted customers shielded from cold outreach)',
              'Relational Many-to-Many Integrity (Transactional enrollment)',
            ].map((rule, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-slate-800 font-medium">{rule}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Database & Infrastructure Architecture */}
        <Card
          title="Database & Architecture Blueprint"
          subtitle="Production-ready relational design"
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                Database Engine
              </span>
              <span className="font-mono font-semibold text-slate-800">MySQL 8.0 (InnoDB)</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                Backend Framework
              </span>
              <span className="font-mono font-semibold text-slate-800">Node.js + TypeScript (Express)</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-600" />
                Auth & RBAC
              </span>
              <span className="font-mono font-semibold text-slate-800">Bcrypt + JWT (ADMIN / SALES_USER)</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Frontend Stack
              </span>
              <span className="font-mono font-semibold text-slate-800">React.js + Tailwind CSS + Lucide</span>
            </div>
          </div>
        </Card>

        {/* Email Verification Architecture */}
        <Card
          title="Email Verification Provider Interface"
          subtitle="Modular architecture for 3rd-party engines"
        >
          <p className="text-xs text-slate-600 leading-relaxed">
            The application includes a built-in deterministic verification engine (<code className="font-mono text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">DeterministicEmailVerifier</code>) checking syntax, domain structures, and disposable email blocklists.
          </p>
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
            <code>interface IEmailVerificationProvider &#123;<br/>
            &nbsp;&nbsp;verify(email: string): Promise&lt;VerificationResult&gt;;<br/>
            &#125;</code>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Third-party providers like ZeroBounce or Hunter.io can be plugged in by implementing this interface without modifying any business logic.
          </p>
        </Card>
      </div>
    </div>
  );
}
