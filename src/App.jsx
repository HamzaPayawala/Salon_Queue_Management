// Step 2 smoke test: verifies React + Vite + Tailwind theme are wired correctly.
// Step 3 replaces this with the router, language provider and shared layout.
export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-charcoal-800 px-6">
      <div className="rounded-2xl border border-charcoal-700 bg-charcoal-950 p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold text-xl font-extrabold text-charcoal-950">
          S
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Salon Queue Management</h1>
        <p className="mt-2 text-sm text-slate-400">Project scaffolding is ready.</p>
      </div>
    </main>
  )
}
