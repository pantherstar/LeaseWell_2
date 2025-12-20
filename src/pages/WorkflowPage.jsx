import { ArrowRight, ClipboardCheck, Mail, Rocket, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import MarketingLayout from '../components/marketing/MarketingLayout';

const workflowSteps = [
  {
    title: 'Set up properties',
    copy: 'Create your property profile with unit data, amenities, and lease readiness in minutes.',
    icon: ClipboardCheck
  },
  {
    title: 'Invite tenants',
    copy: 'Send secure invites, collect tenant details, and store every lease document in one vault.',
    icon: Mail
  },
  {
    title: 'Activate payments',
    copy: 'Connect Stripe, turn on ACH + card payments, and track offline payments with verification.',
    icon: ShieldCheck
  },
  {
    title: 'Run operations',
    copy: 'Monitor maintenance, send reminders, and keep your portfolio visible with live dashboards.',
    icon: Rocket
  }
];

const WorkflowPage = () => {
  return (
    <MarketingLayout>
      <section className="pt-8 md:pt-16">
        <div className="max-w-3xl">
          <p className="text-emerald-300 text-sm uppercase tracking-[0.2em]">Workflow</p>
          <h1 className="text-4xl md:text-6xl font-semibold mt-4" style={{ fontFamily: 'var(--font-display)' }}>
            A workflow built for clarity and momentum.
          </h1>
          <p className="text-emerald-100/70 mt-4 text-lg">
            LeaseWell turns what used to be a dozen tools into a single timeline. Every step is clear, accountable, and automated.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {workflowSteps.map((step, index) => (
            <div key={step.title} className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-300">
                  <step.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-emerald-200/70 uppercase tracking-[0.2em]">Step {index + 1}</p>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                </div>
              </div>
              <p className="text-emerald-100/70 mt-4">{step.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#101f1b] border border-emerald-500/10 rounded-3xl p-8">
          <div className="flex items-center gap-3 text-emerald-300">
            <Users className="w-6 h-6" />
            <p className="uppercase tracking-[0.2em] text-xs">Collaboration</p>
          </div>
          <h3 className="text-2xl font-semibold mt-4">Every stakeholder sees the same source of truth.</h3>
          <p className="text-emerald-100/70 mt-3">
            Owners, property managers, and tenants all work from one shared system. No more emailing PDFs or chasing receipts.
          </p>
        </div>
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h4 className="text-xl font-semibold">Automated follow‑ups</h4>
            <p className="text-emerald-100/70 mt-3">
              Track lease expirations and overdue payments with smart nudges and actionable reminders.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <h4 className="text-xl font-semibold">Maintenance visibility</h4>
            <p className="text-emerald-100/70 mt-3">
              Keep maintenance requests, photos, and resolution notes in one place for faster decision‑making.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-20 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          Want a guided walkthrough?
        </h2>
        <p className="text-emerald-100/70 mt-3 max-w-2xl mx-auto">
          Start your workspace and follow the built‑in checklist to onboard your first property in minutes.
        </p>
        <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 mt-6 rounded-full bg-emerald-400 text-slate-900 font-semibold hover:bg-emerald-300">
          Start now
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </MarketingLayout>
  );
};

export default WorkflowPage;
