import { ArrowRight, ShieldCheck, Sparkles, Users, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import MarketingLayout from '../components/marketing/MarketingLayout';

const featureBlocks = [
  {
    title: 'Property Intelligence',
    copy: 'Track every unit with rich metadata, photos, amenities, and lease status at a glance.',
    points: ['Property profiles with history', 'Vacancy + occupancy tracking', 'Automated reminders']
  },
  {
    title: 'Tenant Experience',
    copy: 'Give tenants a clean portal for documents, payments, and maintenance requests.',
    points: ['Branded tenant experience', 'Payment visibility', 'Secure document access']
  },
  {
    title: 'Payments + Compliance',
    copy: 'Send funds directly to landlords via Stripe Connect while logging every transaction.',
    points: ['ACH + card options', 'Offline payment recording', 'Payment status audit trail']
  }
];

const FeaturesPage = () => {
  return (
    <MarketingLayout>
      <section className="pt-8 md:pt-16">
        <div className="max-w-3xl">
          <p className="text-emerald-300 text-sm uppercase tracking-[0.2em]">Features</p>
          <h1 className="text-4xl md:text-6xl font-semibold mt-4" style={{ fontFamily: 'var(--font-display)' }}>
            Designed to move leases forward, not slow them down.
          </h1>
          <p className="text-emerald-100/70 mt-4 text-lg">
            LeaseWell gives landlords and operators a single hub for property data, tenant communication, and payment proof.
            Every flow is built to reduce back‑and‑forth while keeping your portfolio compliant.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {featureBlocks.map((block) => (
            <div key={block.title} className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h2 className="text-xl font-semibold">{block.title}</h2>
              <p className="text-emerald-100/70 mt-2">{block.copy}</p>
              <ul className="mt-4 space-y-2 text-sm text-emerald-100/70">
                {block.points.map((point) => (
                  <li key={point} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-300 rounded-full" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#101f1b] border border-emerald-500/10 rounded-3xl p-8">
          <div className="flex items-center gap-3 text-emerald-300">
            <Sparkles className="w-6 h-6" />
            <p className="uppercase tracking-[0.2em] text-xs">Automation</p>
          </div>
          <h3 className="text-2xl font-semibold mt-4">Automated workflows that keep your team on track.</h3>
          <p className="text-emerald-100/70 mt-3">
            Trigger reminders, monitor lease expirations, and keep maintenance in a single pipeline without manual spreadsheets.
          </p>
        </div>
        <div className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-300" />
              <h4 className="text-xl font-semibold">Secure document vault</h4>
            </div>
            <p className="text-emerald-100/70 mt-3">
              Store leases, inspections, receipts, and notices with audit trails and controlled sharing.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-emerald-300" />
              <h4 className="text-xl font-semibold">Collaborative dashboards</h4>
            </div>
            <p className="text-emerald-100/70 mt-3">
              Give landlords and property managers shared visibility, with role‑based access baked in.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <Wallet className="w-6 h-6 text-emerald-300" />
              <h4 className="text-xl font-semibold">Payments with proof</h4>
            </div>
            <p className="text-emerald-100/70 mt-3">
              Collect ACH, accept cards, or record Zelle/check payments while keeping your ledger clean.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-20 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          Ready to see LeaseWell in action?
        </h2>
        <p className="text-emerald-100/70 mt-3 max-w-2xl mx-auto">
          Bring your properties, tenants, and payments into one calm system.
        </p>
        <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 mt-6 rounded-full bg-emerald-400 text-slate-900 font-semibold hover:bg-emerald-300">
          Get started
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </MarketingLayout>
  );
};

export default FeaturesPage;
