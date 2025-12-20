import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import MarketingLayout from '../components/marketing/MarketingLayout';

const plans = [
  {
    name: 'Starter',
    price: '$0',
    blurb: 'Up to 3 units',
    accent: 'border-emerald-500/20',
    button: 'Try it now',
    features: [
      'Property + tenant dashboards',
      'Lease document vault',
      'Maintenance tracking',
      'ACH + card payments',
      'Basic payment tracking'
    ]
  },
  {
    name: 'Growth',
    price: '$29',
    blurb: 'Per month · 4+ units',
    accent: 'border-emerald-500/40',
    button: 'Upgrade',
    features: [
      'Everything in Starter',
      'Stripe Connect payouts',
      'ACH + card payments',
      'Offline payment recording',
      'Tenant onboarding flow',
      'Priority support'
    ]
  }
];

const PricingPage = () => {
  return (
    <MarketingLayout>
      <section className="pt-8 md:pt-16">
        <div className="max-w-3xl">
          <p className="text-emerald-300 text-sm uppercase tracking-[0.2em]">Pricing</p>
          <h1 className="text-4xl md:text-6xl font-semibold mt-4" style={{ fontFamily: 'var(--font-display)' }}>
            Pricing that scales with your portfolio.
          </h1>
          <p className="text-emerald-100/70 mt-4 text-lg">
            Start free with a small portfolio, then upgrade once you need Stripe payouts, ACH, and automation.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`bg-[#0f1d1a] ${plan.accent} border rounded-3xl p-8`}>
              <p className="text-emerald-200 text-sm">{plan.name}</p>
              <p className="text-4xl font-semibold mt-2">{plan.price}</p>
              <p className="text-emerald-100/70 text-sm mt-2">{plan.blurb}</p>
              <ul className="mt-6 space-y-2 text-sm text-emerald-100/70">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-emerald-400 text-slate-900 font-semibold rounded-full hover:bg-emerald-300">
                {plan.button}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
          <h2 className="text-2xl font-semibold">Need enterprise onboarding?</h2>
          <p className="text-emerald-100/70 mt-3">
            Multi‑property teams can request onboarding support, data migration, and custom workflows.
          </p>
          <Link to="/login" className="mt-5 inline-flex items-center gap-2 text-emerald-200 hover:text-white">
            Contact sales
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  );
};

export default PricingPage;
