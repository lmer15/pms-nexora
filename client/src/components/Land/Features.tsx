import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TABS = [
  {
    key: "productivity",
    title: "Productivity",
    desc: "Kanban boards, priorities, due dates, dependencies — the works.",
    bullets: ["Drag & drop tasks", "Labels & priorities", "Recurring tasks", "Time tracking", "Gantt charts", "Resource allocation"],
    image: "/images/feature-productivity.png",
  },
  {
    key: "security",
    title: "Security",
    desc: "Role-based access and secure data practices built-in.",
    bullets: ["RBAC by facility", "SSO-ready design", "Audit-friendly logs", "Data encryption", "Two-factor authentication", "Compliance standards"],
    image: "/images/feature-security.jpg",
  },
  {
    key: "collab",
    title: "Collaboration",
    desc: "Comments, mentions, notes, and notifications that matter.",
    bullets: ["Mentions & comments", "Email & in-app alerts", "Shared notes", "Video calls", "File sharing", "Team calendars"],
    image: "/images/feature-collab.png",
  },
];

export default function FeatureTabs() {
  const [active, setActive] = useState(TABS[0]);

  return (
    <section id="features" className="bg-white py-20 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Features that move teams <span className="text-brand">forward</span>
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Everything you need to plan, execute, and deliver.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3">
          {TABS.map((t) => {
            const isActive = active.key === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActive(t)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-brand text-white shadow"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
                }`}
              >
                {t.title}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="mt-10 grid items-center gap-8 md:grid-cols-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.key + "-copy"}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.3 }}
              className="order-2 md:order-1"
            >
              <h3 className="text-2xl font-bold">{active.title}</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{active.desc}</p>
              <ul className="mt-4 space-y-2">
                {active.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">✓</span>
                    <span className="text-gray-700 dark:text-gray-200">{b}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              key={active.key + "-image"}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.3 }}
              className="order-1 md:order-2"
            >
              <div className="rounded-2xl border border-gray-200 bg-neutral-light p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                {active.image ? (
                  <img src={active.image} onError={(e) => ((e.currentTarget.style.display = "none"))} alt={active.title} className="rounded-xl" />
                ) : null}
                {!active.image && (
                  <div className="aspect-[16/9] w-full rounded-xl bg-gradient-to-br from-brand/10 to-brand/30" />
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
