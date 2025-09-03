import { motion } from "framer-motion"

export default function Hero() {
  return (
    <section
      id="intro"
      className="relative overflow-hidden"
      style={{
        backgroundImage: "url('/images/hero.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-white/90 dark:to-gray-900/90" />

      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-6 py-28 text-center text-white">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl font-extrabold leading-tight md:text-6xl"
        >
          Run Your Projects Faster with <span className="text-brand">Nexora</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 max-w-2xl text-lg text-white/90"
        >
          Plan, assign, and track work in one place. Easy to, real-time collaboration, zero fluff.
        </motion.p>

        <motion.ul
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 max-w-2xl text-base text-white/80 space-y-2"
        >
          <li className="flex items-center gap-2">
            <span className="text-brand">✓</span> Secure role-based access control for teams
          </li>
          <li className="flex items-center gap-2">
            <span className="text-brand">✓</span> Real-time notifications and collaborative tools
          </li>
          <li className="flex items-center gap-2">
            <span className="text-brand">✓</span> Comprehensive analytics and reporting features
          </li>
        </motion.ul>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
        >
          <a href="#cta" className="rounded-lg bg-brand px-6 py-3 font-semibold text-white shadow-lg hover:brightness-110">
            Get Started Free
          </a>
          <a href="#features" className="rounded-lg border border-white/60 px-6 py-3 font-semibold backdrop-blur hover:bg-white/10">
            Explore Features
          </a>
        </motion.div>

        {/* Floating deco dots */}
        <div className="pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full bg-brand/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-10 h-56 w-56 rounded-full bg-brand/30 blur-3xl" />
      </div>
    </section>
  );
}
