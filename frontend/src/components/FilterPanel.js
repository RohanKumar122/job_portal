import { useEffect } from 'react';
import { WORK_MODES } from '../utils/format';

const DATE_OPTIONS = [
  { value: 'all', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'thisYear', label: 'This year' },
  { value: 'custom', label: 'Custom' },
];

function SectionLabel({ children, count }) {
  return (
    <div className="flex items-center justify-between pl-1">
      <label className="text-xs font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">{children}</label>
      {count > 0 && (
        <span className="text-indigo-500 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-tight">{count} selected</span>
      )}
    </div>
  );
}

function SearchableChecklist({ items, selected, onToggle, searchValue, onSearchChange, placeholder, getCount }) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder-slate-400 dark:placeholder-slate-500"
      />
      <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-3 max-h-44 overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-1">
        {items.length === 0 && (
          <p className="col-span-2 text-center text-xs text-slate-400 dark:text-slate-600 py-4">No matches</p>
        )}
        {items.map((item) => {
          const checked = selected.includes(item);
          return (
            <label key={item} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white dark:hover:bg-white/5 cursor-pointer transition-all group">
              <div className="relative flex items-center flex-shrink-0">
                <input
                  type="checkbox"
                  className="peer h-5 w-5 appearance-none rounded-md border-2 border-slate-300 dark:border-white/10 bg-transparent checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer"
                  checked={checked}
                  onChange={() => onToggle(item)}
                />
                <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className={`text-sm font-medium flex-1 truncate ${checked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'}`}>
                {item}
              </span>
              {getCount && (
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 flex-shrink-0">{getCount(item)}</span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function PillGroup({ options, selected, onToggle, multi = true }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const value = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const active = multi ? selected.includes(value) : selected === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
              active
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-500/40'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function FilterPanel({
  isOpen, onClose,
  companies, companySearch, setCompanySearch, selectedCompanies, onToggleCompany,
  countries, countrySearch, setCountrySearch, selectedCountries, onToggleCountry,
  departments, departmentSearch, setDepartmentSearch, selectedDepartments, onToggleDepartment,
  selectedWorkModes, onToggleWorkMode,
  dateBasis, setDateBasis,
  dateFilter, setDateFilter, startDate, setStartDate, endDate, setEndDate,
  sortOrder, setSortOrder,
  onReset,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/30 dark:bg-[#020617]/80 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in flex flex-col">
        <div className="sm:hidden w-10 h-1.5 bg-slate-200 dark:bg-white/20 rounded-full mx-auto mt-3 flex-shrink-0"></div>

        <div className="flex items-center justify-between px-6 sm:px-8 pt-4 sm:pt-8 pb-4 flex-shrink-0 border-b border-slate-100 dark:border-white/5">
          <h3 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white">Filter Openings</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-400 dark:text-slate-400"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1 px-6 sm:px-8 py-6 space-y-7">
          <div className="space-y-3">
            <SectionLabel count={selectedCompanies.length}>Company</SectionLabel>
            <SearchableChecklist
              items={companies.map((c) => c.name)}
              selected={selectedCompanies}
              onToggle={onToggleCompany}
              searchValue={companySearch}
              onSearchChange={setCompanySearch}
              placeholder="Search companies..."
              getCount={(name) => companies.find((c) => c.name === name)?.count ?? 0}
            />
          </div>

          <div className="space-y-3">
            <SectionLabel count={selectedCountries.length}>Countries</SectionLabel>
            <SearchableChecklist
              items={countries}
              selected={selectedCountries}
              onToggle={onToggleCountry}
              searchValue={countrySearch}
              onSearchChange={setCountrySearch}
              placeholder="Search countries..."
            />
          </div>

          <div className="space-y-3">
            <SectionLabel count={selectedDepartments.length}>Department</SectionLabel>
            <SearchableChecklist
              items={departments}
              selected={selectedDepartments}
              onToggle={onToggleDepartment}
              searchValue={departmentSearch}
              onSearchChange={setDepartmentSearch}
              placeholder="Search departments..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <SectionLabel count={selectedWorkModes.length}>Work Mode</SectionLabel>
              <PillGroup options={WORK_MODES} selected={selectedWorkModes} onToggle={onToggleWorkMode} />
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 block">Sort By</label>
              <PillGroup
                options={[{ value: 'newest', label: 'Newest Added' }, { value: 'oldest', label: 'Oldest Added' }]}
                selected={sortOrder}
                onToggle={setSortOrder}
                multi={false}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pl-1">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Date Filter</label>
              <PillGroup
                options={[{ value: 'created_at', label: 'Date Added' }, { value: 'updated_at', label: 'Last Updated' }]}
                selected={dateBasis}
                onToggle={setDateBasis}
                multi={false}
              />
            </div>
            <PillGroup options={DATE_OPTIONS} selected={dateFilter} onToggle={setDateFilter} multi={false} />

            {dateFilter === 'custom' && (
              <div className="pt-2 animate-fade-in-up grid grid-cols-2 gap-4">
                <input
                  type="date"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <input
                  type="date"
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 px-4 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 px-6 sm:px-8 py-5 sm:py-6 border-t border-slate-100 dark:border-white/5 flex gap-4">
          <button
            onClick={onReset}
            className="flex-1 py-3.5 sm:py-4 px-6 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all text-xs sm:text-sm uppercase tracking-widest"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-[2] py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold hover:scale-[1.02] active:scale-95 transition-all text-xs sm:text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
}
