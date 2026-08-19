import { memo, useEffect } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

const SearchBar = memo(({ query, setQuery, onSearch, isFilterActive, onOpenFilters }) => {
  const debouncedQuery = useDebouncedValue(query, 450);

  useEffect(() => {
    onSearch(debouncedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSearch(query);
  };

  return (
    <div className="bg-white/90 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-none p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl flex items-center gap-2">
      <div className="flex-1 relative min-w-0">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="UI Designer, Backend Engineer..."
          className="w-full bg-transparent border-none focus:ring-0 py-3 sm:py-4 pl-10 sm:pl-12 pr-8 text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            title="Clear search"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      <button
        onClick={() => onSearch(query)}
        className="hidden sm:flex p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-indigo-500 dark:text-indigo-400 transition-all active:scale-90"
        title="Search"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      <div className="h-8 w-px bg-slate-200 dark:bg-white/10 mx-1"></div>

      <button
        onClick={onOpenFilters}
        className="relative flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm sm:text-base font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span className="hidden sm:inline">Filters</span>
        {isFilterActive && (
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-fuchsia-400 border-2 border-white dark:border-[#0f172a] animate-pulse"></span>
        )}
      </button>
    </div>
  );
});

export default SearchBar;
