import { ArrowRight, Building2, CheckCircle2, ShieldCheck, Sparkles, Users, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Lease Flow That Feels Instant',
    copy: 'Create properties, onboard tenants, and lock leases in minutes with guided workflows and smart defaults.',
    icon: Sparkles
  },
  {
    title: 'Payments That Go Where They Should',
    copy: 'Stripe Connect routes rent directly to each landlord. Add ACH and offline tracking without spreadsheets.',
    icon: Wallet
  },
  {
    title: 'Docs, Inspections, and Proof',
    copy: 'Store leases, inspections, and receipts in one place. Share files with tenants in a click.',
    icon: ShieldCheck
  }
];

const proofPoints = [
  'Dedicated landlord + tenant portals',
  'Automated reminders and status tracking',
  'Secure document vault with sharing',
  'Real-time maintenance visibility',
  'Stripe Connect payouts'
];

const MarketingPage = () => {
  return (
    <div className="min-h-screen bg-[#0b1513] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.18),_transparent_55%)]" />
      <div className="absolute -top-24 -right-20 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 -left-24 w-96 h-96 bg-amber-400/15 blur-[120px] rounded-full" />

      <header className="relative z-10 px-6 md:px-12 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>LeaseWell</p>
            <p className="text-xs text-emerald-200/80">Property ops, done clean.</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-4 text-sm text-emerald-100/80">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#workflow" className="hover:text-white">Workflow</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <Link to="/login" className="px-4 py-2 rounded-full bg-white text-slate-900 font-semibold hover:bg-emerald-100">Sign In</Link>
        </div>
      </header>

      <main className="relative z-10 px-6 md:px-12 pb-20">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-8 md:pt-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-400/30 rounded-full text-emerald-100 text-sm">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              Built for modern property managers
            </div>
            <h1 className="text-4xl md:text-6xl font-semibold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Lease operations that feel <span className="text-emerald-300">effortless</span>.
            </h1>
            <p className="text-lg text-emerald-100/80 max-w-xl">
              LeaseWell centralizes properties, tenants, payments, and documents in one platform.
              Automate what you can, track the rest, and keep everyone in the loop.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/login" className="px-6 py-3 rounded-full bg-emerald-400 text-slate-900 font-semibold flex items-center gap-2 hover:bg-emerald-300">
                Start managing
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#workflow" className="px-6 py-3 rounded-full border border-emerald-300/40 text-emerald-100 font-semibold hover:border-emerald-200">
                See how it works
              </a>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-emerald-100/70">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300" />No spreadsheets</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300" />Direct landlord payouts</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-300" />Tenant portal ready</div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-8 -left-6 w-32 h-32 rounded-full bg-emerald-400/20 blur-2xl" />
            <div className="absolute -bottom-8 right-10 w-40 h-40 rounded-full bg-amber-400/20 blur-3xl" />
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between text-emerald-100/70 text-sm">
                <span>Live Portfolio</span>
                <span className="text-emerald-300">Updated just now</span>
              </div>
              <div className="mt-6 space-y-4">
                {['Riverside Lofts', 'Maple Heights', 'Cedar Court'].map((property, index) => (
                  <div
                    key={property}
                    className="bg-[#101f1b] border border-emerald-500/10 rounded-2xl p-4 flex items-center justify-between"
                    style={{ animation: `rise 0.6s ease ${index * 0.1}s both` }}
                  >
                    <div>
                      <p className="font-semibold text-white">{property}</p>
                      <p className="text-xs text-emerald-100/60">Occupied · Auto-payments on</p>
                    </div>
                    <span className="text-emerald-300 text-sm">+$12,480</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <div className="bg-[#101f1b] rounded-2xl py-3">
                  <p className="text-lg font-semibold">18</p>
                  <p className="text-xs text-emerald-100/60">Active leases</p>
                </div>
                <div className="bg-[#101f1b] rounded-2xl py-3">
                  <p className="text-lg font-semibold">92%</p>
                  <p className="text-xs text-emerald-100/60">On-time pay</p>
                </div>
                <div className="bg-[#101f1b] rounded-2xl py-3">
                  <p className="text-lg font-semibold">6h</p>
                  <p className="text-xs text-emerald-100/60">Avg response</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-20">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <h2 className="text-3xl md:text-4xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              Everything your portfolio needs.
            </h2>
            <p className="text-emerald-100/70 max-w-xl">
              LeaseWell blends automation with human‑friendly controls to keep landlords and tenants aligned.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map(({ title, copy, icon: Icon }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:border-emerald-400/40 transition">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-emerald-300" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-emerald-100/70">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="bg-[#101f1b] border border-emerald-500/10 rounded-3xl p-8">
            <p className="text-emerald-300 text-sm uppercase tracking-[0.2em]">Workflow</p>
            <h2 className="text-3xl md:text-4xl font-semibold mt-3" style={{ fontFamily: 'var(--font-display)' }}>
              From listing to payout in four moves.
            </h2>
            <div className="mt-8 space-y-5">
              {proofPoints.map((point) => (
                <div key={point} className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-300">✓</span>
                  <p className="text-emerald-100/80">{point}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-5">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-emerald-300" />
                <h3 className="text-xl font-semibold">Invite and verify tenants</h3>
              </div>
              <p className="text-emerald-100/70 mt-3">
                Invite tenants by email, track onboarding, and attach leases with everything saved in one timeline.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 text-emerald-300" />
                <h3 className="text-xl font-semibold">Collect rent your way</h3>
              </div>
              <p className="text-emerald-100/70 mt-3">
                Offer card, ACH, or offline payment recording with landlord‑verified confirmations.
              </p>
            </div>
          </div>
        </section>

        <section id="pricing" className="mt-20">
          <div className="bg-gradient-to-r from-emerald-400/10 via-emerald-500/5 to-amber-400/10 border border-emerald-500/20 rounded-3xl p-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div>
                <p className="text-emerald-300 text-sm uppercase tracking-[0.2em]">Pricing</p>
                <h2 className="text-3xl md:text-4xl font-semibold mt-3" style={{ fontFamily: 'var(--font-display)' }}>
                  Start with clarity. Scale with confidence.
                </h2>
                <p className="text-emerald-100/70 mt-3 max-w-xl">
                  Simple plans that grow with your portfolio. Start free, then upgrade when you need automation.
                </p>
              </div>
              <div className="bg-[#0f1d1a] border border-emerald-500/20 rounded-3xl p-6 w-full lg:w-auto">
                <p className="text-emerald-200 text-sm">Starter</p>
                <p className="text-4xl font-semibold">$0</p>
                <p className="text-emerald-100/70 text-sm mt-2">Up to 5 units</p>
                <Link to="/login" className="mt-5 inline-flex items-center gap-2 px-5 py-3 bg-emerald-400 text-slate-900 font-semibold rounded-full hover:bg-emerald-300">
                  Try it now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
            Ready for a calmer lease cycle?
          </h2>
          <p className="text-emerald-100/70 mt-3 max-w-2xl mx-auto">
            Join landlords and property teams who want cleaner workflows, faster payments, and happier tenants.
          </p>
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 mt-6 rounded-full bg-emerald-400 text-slate-900 font-semibold hover:bg-emerald-300">
            Launch LeaseWell
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      <footer className="relative z-10 px-6 md:px-12 py-10 border-t border-white/10 text-emerald-100/60 text-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <p>© 2025 LeaseWell. Built for modern property teams.</p>
        <div className="flex gap-6">
          <Link to="/login" className="hover:text-white">Sign in</Link>
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
        </div>
      </footer>

      <style>{`
        @keyframes rise {
          0% { transform: translateY(12px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default MarketingPage;
