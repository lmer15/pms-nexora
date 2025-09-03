import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DATA = [
  {
    name: "Alex Rivera",
    role: "PM @ SprintWave",
    text: "We cut project turnaround by 30%. The Kanban and notifications just click.",
  },
  {
    name: "Jamie Lee",
    role: "Team Lead @ Orbital",
    text: "Onboarding took minutes. Role-based access is clean and prevents mess.",
  },
  {
    name: "Chris Morgan",
    role: "CEO @ NovaDesk",
    text: "Visibility went up, chaos went down. It’s the tool my teams actually use.",
  },
  {
    name: "Sarah Kim",
    role: "Product Manager @ TechFlow",
    text: "Nexora's analytics have given us insights we never had before. Highly recommend!",
  },
  {
    name: "Mike Johnson",
    role: "CTO @ InnovateLabs",
    text: "The collaboration features are top-notch. Our remote team feels connected.",
  },
  {
    name: "Emily Davis",
    role: "Operations Lead @ GlobalTech",
    text: "Security and compliance were our top priorities, and Nexora delivers on both.",
  },
];

export default function Testimonials() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % DATA.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const prev = () => setIdx((i) => (i - 1 + DATA.length) % DATA.length);
  const next = () => setIdx((i) => (i + 1) % DATA.length);

  return (
    <section id="testimonials" className="bg-neutral-light py-20 dark:bg-gray-900">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="text-3xl font-bold md:text-4xl">Loved by teams</h2>
        <div className="relative mt-10 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-800 dark:bg-gray-950">
          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-lg italic text-gray-800 dark:text-gray-200">“{DATA[idx].text}”</p>
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold">{DATA[idx].name}</span> — {DATA[idx].role}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <button onClick={prev} className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-900">
              ← Prev
            </button>
            <button onClick={next} className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-900">
              Next →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
