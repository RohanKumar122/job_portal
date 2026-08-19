export default function Hero({ activeCount, children }) {
  return (
    <section className="text-center mb-8 sm:mb-12 space-y-4 sm:space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-fade-in-up">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none text-[10px] sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 sm:mb-4">
        <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-indigo-500"></span>
        </span>
        {activeCount.toLocaleString()} Active Positions
      </div>
      <h2 className="font-display text-3xl sm:text-5xl md:text-7xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight px-2">
        Elevate Your <span className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-indigo-500 dark:from-indigo-400 dark:via-fuchsia-400 dark:to-indigo-400 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">Professional</span> Journey
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto font-medium px-4">
        Search live openings across every company in one place, and filter down to exactly what fits.
      </p>

      <div className="max-w-4xl mx-auto mt-8 sm:mt-12">
        {children}
      </div>
    </section>
  );
}
