import { Mail, Send } from 'lucide-react';
import MarketingLayout from '../components/marketing/MarketingLayout';

const ContactPage = () => {
  return (
    <MarketingLayout>
      <section className="pt-8 md:pt-16">
        <div className="max-w-2xl">
          <p className="text-emerald-300 text-sm uppercase tracking-[0.2em]">Contact</p>
          <h1 className="text-4xl md:text-6xl font-semibold mt-4" style={{ fontFamily: 'var(--font-display)' }}>
            Let’s talk about your portfolio.
          </h1>
          <p className="text-emerald-100/70 mt-4 text-lg">
            Reach out for onboarding, feature questions, or help designing your workflow. We reply within one business day.
          </p>
        </div>

        <form
          className="mt-12 max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 space-y-5"
          action="mailto:leasewell@protonmail.com"
          method="POST"
          encType="text/plain"
        >
          <div>
            <label className="block text-sm font-medium text-emerald-100/70 mb-2">Name</label>
            <input
              name="name"
              type="text"
              className="w-full px-4 py-3 rounded-xl bg-[#101f1b] border border-emerald-500/20 text-white placeholder-emerald-100/40 focus:ring-2 focus:ring-emerald-500"
              placeholder="Your name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-emerald-100/70 mb-2">Email</label>
            <input
              name="email"
              type="email"
              className="w-full px-4 py-3 rounded-xl bg-[#101f1b] border border-emerald-500/20 text-white placeholder-emerald-100/40 focus:ring-2 focus:ring-emerald-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-emerald-100/70 mb-2">Message</label>
            <textarea
              name="message"
              rows={5}
              className="w-full px-4 py-3 rounded-xl bg-[#101f1b] border border-emerald-500/20 text-white placeholder-emerald-100/40 focus:ring-2 focus:ring-emerald-500 resize-none"
              placeholder="Tell us about your portfolio and what you need."
              required
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-400 text-slate-900 font-semibold hover:bg-emerald-300"
          >
            Send message
            <Send className="w-4 h-4" />
          </button>
          <p className="text-xs text-emerald-100/50 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Messages open in your email client and send to leasewell@protonmail.com.
          </p>
        </form>
      </section>
    </MarketingLayout>
  );
};

export default ContactPage;
