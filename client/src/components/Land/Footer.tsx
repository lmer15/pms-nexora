export default function Footer() {
  return (
    <footer className="bg-white py-10 dark:bg-gray-950">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 md:grid-cols-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand shadow-md ring-1 ring-black/5 dark:ring-white/10">
              <img src="/images/nexora.png" alt="Nexora" className="h-5 w-5 object-contain" />
            </div>
            <div className="text-lg font-bold">Nexora</div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Simple, fast, and reliable project management.
          </p>
        </div>

        <div>
          <h4 className="mb-3 font-semibold">Product</h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li><a href="#features" className="hover:text-brand">Features</a></li>
            <li><a href="#steps" className="hover:text-brand">How it works</a></li>
            <li><a href="#testimonials" className="hover:text-brand">Reviews</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-semibold">Company</h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li><a href="#intro" className="hover:text-brand">About</a></li>
            <li><a href="#cta" className="hover:text-brand">Contact</a></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-semibold">Legal</h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li><a href="#" className="hover:text-brand">Privacy</a></li>
            <li><a href="#" className="hover:text-brand">Terms</a></li>
          </ul>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-200 py-6 text-center text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
        © {new Date().getFullYear()} Nexora. All rights reserved.
      </div>
    </footer>
  );
}
