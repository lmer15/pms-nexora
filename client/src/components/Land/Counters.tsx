import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

function useCounter(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    let raf: number;
    const tick = (t: number) => {
      if (!startRef.current) startRef.current = t;
      const p = Math.min((t - startRef.current) / duration, 1);
      setValue(Math.floor(p * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export default function Counters() {
  const tasks = useCounter(12750);
  const teams = useCounter(5300, 1400);
  const uptime = useCounter(99, 900);

  const counters = [
    { value: tasks, label: "Tasks managed" },
    { value: teams, label: "Teams onboarded" },
    { value: uptime, label: "Service uptime", suffix: "%" },
    { value: useCounter(2500), label: "Projects completed" },
    { value: useCounter(50000), label: "Hours saved" },
    { value: useCounter(1000), label: "Active users" },
  ];

  return (
    <section className="relative z-10 bg-white py-20 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {counters.map((counter, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="rounded-2xl bg-white/10 backdrop-blur-lg border border-gray-200 dark:border-gray-800 p-8 shadow-xl dark:bg-gray-900/30"
            >
              <div className="text-5xl font-extrabold text-green-600 dark:text-green-400">
                {counter.value.toLocaleString()}
                {counter.suffix || "+"}
              </div>
              <div className="mt-2 text-base text-gray-600 dark:text-gray-300">
                {counter.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
