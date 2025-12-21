import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import logoFull from '../../assets/leasewell-logo.png';

const MarketingLayout = ({ children }) => {
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const rafRef = useRef(null);

  useEffect(() => {
    const handleMove = (event) => {
      if (rafRef.current) return;
      const { clientX, clientY } = event;
      rafRef.current = requestAnimationFrame(() => {
        setCursorPos({ x: clientX, y: clientY });
        rafRef.current = null;
      });
    };

    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0b1513] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.18),_transparent_55%)]" />
      <div className="absolute -top-24 -right-20 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 -left-24 w-96 h-96 bg-amber-400/15 blur-[120px] rounded-full" />
      <div
        className="pointer-events-none fixed top-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-60 mix-blend-screen"
        style={{
          transform: `translate(${cursorPos.x - 128}px, ${cursorPos.y - 128}px)`,
          background: 'radial-gradient(circle at center, rgba(45,212,191,0.35), rgba(34,197,94,0.0) 70%)'
        }}
      />

      <header className="relative z-10 px-6 md:px-12 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoFull} alt="LeaseWell" className="h-11 sm:h-12 w-auto drop-shadow-lg" />
          <p className="text-xs text-emerald-200/80 hidden sm:block">Modern tools for modern rentals.</p>
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm text-emerald-100/80">
          <Link to="/" className="hover:text-white">Home</Link>
          <Link to="/features" className="hover:text-white">Features</Link>
          <Link to="/workflow" className="hover:text-white">Workflow</Link>
          <Link to="/pricing" className="hover:text-white">Pricing</Link>
          <Link to="/contact" className="hover:text-white">Contact</Link>
          <Link to="/login" className="px-4 py-2 rounded-full bg-white text-slate-900 font-semibold hover:bg-emerald-100">Sign In</Link>
        </nav>
      </header>

      <main className="relative z-10 px-6 md:px-12 pb-20">{children}</main>

      <footer className="relative z-10 px-6 md:px-12 py-10 border-t border-white/10 text-emerald-100/60 text-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <p>
          © 2025 LeaseWell. A product of{' '}
          <a
            href="https://northridge.tech"
            target="_blank"
            rel="noreferrer"
            className="text-emerald-200 hover:text-emerald-100 underline-offset-4 hover:underline"
          >
            Northridge Technologies LLC
          </a>
          .
        </p>
        <div className="flex gap-6">
          <Link to="/login" className="hover:text-white">Sign in</Link>
          <Link to="/" className="hover:text-white">Home</Link>
          <Link to="/features" className="hover:text-white">Features</Link>
          <Link to="/pricing" className="hover:text-white">Pricing</Link>
          <Link to="/contact" className="hover:text-white">Contact</Link>
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

export default MarketingLayout;
