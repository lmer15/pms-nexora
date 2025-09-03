import { Link } from "react-router-dom";

 export default function CTA() {
  return (
    <section id="cta" className="relative overflow-hidden bg-brand py-20 text-white">
      <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl" />
      <div className="absolute -right-16 bottom-10 h-56 w-56 rounded-full bg-black/20 blur-2xl" />

      <div className="relative mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold md:text-4xl">Ready to ship faster?</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/90">
          Start with Nexora free. No credit card. Invite your team and get real work moving today.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href="/login"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold shadow-md transition duration-300"
          >
            Create Free Account
          </a>
          <a href="#features"
             className="rounded-lg border border-white/60 px-6 py-3 font-semibold backdrop-blur hover:bg-white/10">
            See how it works
          </a>
        </div>
      </div>
    </section>
  );
}
