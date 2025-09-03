import { motion } from "framer-motion";

export default function Steps() {
  const steps = [
    { title: "Create your facility", text: "Spin up a workspace in seconds." },
    { title: "Invite your team", text: "Assign roles and permissions that make sense." },
    { title: "Plan & execute", text: "Track tasks, deadlines, and progress effortlessly." },
    { title: "Monitor & optimize", text: "Use analytics to improve performance and deliver better results." },
  ];

  return (
    <section id="steps" className="py-20 bg-neutral-light dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">From zero to shipped in 3 steps</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">No guesswork. Just a clear path from idea to delivery.</p>
        </div>

        <div className="grid items-center gap-8 rounded-2xl bg-white p-6 shadow-md dark:bg-gray-950">
          <div className="grid gap-8 md:grid-cols-2">
            <motion.img
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              src="/images/steps.jpg" /* place a local image or remove this */
              alt="Nexora overview"
              className="rounded-xl object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
            <div className="grid gap-6">
              {steps.map((s, idx) => (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 * idx }}
                  className="border-b border-gray-200 pb-6 last:border-0 dark:border-gray-800"
                >
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{s.text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-2 text-center">
            <a href="#cta" className="inline-block rounded-lg bg-brand px-5 py-3 font-semibold text-white hover:brightness-110">
              Try it now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
