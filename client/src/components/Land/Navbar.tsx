import { useState, useEffect } from "react";

type Props = {
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
};

export default function Navbar({ darkMode, setDarkMode }: Props) {
  const [open, setOpen] = useState(false);
  const link = "text-gray-800 dark:text-gray-300 hover:text-brand dark:hover:text-brand-light transition";
  const activeLink = "bg-[#0e8407] text-white rounded-lg px-3 py-2";
  const btn = "px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm";
  const ghost = "border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800";
  const solid = "bg-brand text-white hover:brightness-110 dark:bg-brand-light";

  const [activeHash, setActiveHash] = useState<string>(window.location.hash || "#intro");

  useEffect(() => {
    const onHashChange = () => {
      setActiveHash(window.location.hash || "#intro");
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <nav className="fixed left-0 top-0 z-50 w-full bg-neutral-light/90 backdrop-blur-md shadow-sm dark:bg-neutral-dark/70 dark:shadow">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <a href="#intro" className="group flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-brand blur-sm opacity-40 group-hover:opacity-60 transition" />
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-black/5">
              <img src="/images/nexora.png" alt="Nexora" className="h-6 w-6 object-contain" />
            </div>
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-brand">Nexora</span>
          </span>
        </a>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-8 md:flex">
          <li>
            <a href="#intro" className={activeHash === "#intro" ? activeLink : link}>Home</a>
          </li>
          <li>
            <a href="#features" className={activeHash === "#features" ? activeLink : link}>Features</a>
          </li>
          <li>
            <a href="#steps" className={activeHash === "#steps" ? activeLink : link}>How it works</a>
          </li>
          <li>
            <a href="#testimonials" className={activeHash === "#testimonials" ? activeLink : link}>Reviews</a>
          </li>
          <li>
            <a href="#cta" className={activeHash === "#cta" ? activeLink : link}>Contact</a>
          </li>
        </ul>

        {/* Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <button onClick={() => setDarkMode(!darkMode)} className={`${btn} ${ghost}`} aria-label="Toggle dark mode">
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>

          <a
            href="/login"
            target="_blank"
            rel="noopener noreferrer"
            className={`${btn} ${ghost}`}>
            Log In
          </a>
          <a className={`${btn} ${solid}`} href="#cta">Get started</a>
        </div>

        {/* Mobile */}
        <button onClick={() => setOpen(!open)} className="rounded-lg border border-gray-300 px-3 py-2 md:hidden dark:border-gray-700">
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-neutral-light/95 dark:bg-neutral-dark/95 border-t border-gray-200 dark:border-gray-800 backdrop-blur">
          <ul className="grid gap-3 p-4">
            {[
              ["Home", "#intro"],
              ["Features", "#features"],
              ["How it works", "#steps"],
              ["Reviews", "#testimonials"],
              ["Contact", "#cta"],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)} className={`rounded-lg px-3 py-2 ${activeHash === href ? 'bg-[#0e8407] text-white' : 'text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900'}`}>
                {label}
              </a>
            ))}
          </ul>
          <div className="px-4 pb-4 flex gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-800 dark:text-gray-300 dark:border-gray-700">
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
            <a className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-800 dark:text-gray-300 dark:border-gray-700" href="#login">Login</a>
            <a className="flex-1 rounded-lg bg-brand px-4 py-2 text-white" href="#cta">Get started</a>
          </div>
        </div>
      )}
    </nav>
  );
}
