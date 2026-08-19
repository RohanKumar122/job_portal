export default function ActiveFilterChips({ chips, onClearAll }) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap justify-center items-center gap-2 mt-4 max-w-4xl mx-auto px-4 animate-fade-in-up">
      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={chip.onRemove}
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-2 border transition-all ${chip.colorClass}`}
        >
          <span className="max-w-[10rem] truncate">{chip.label}</span>
          <span className="opacity-60">×</span>
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors ml-1 uppercase tracking-wide"
      >
        Clear All
      </button>
    </div>
  );
}
