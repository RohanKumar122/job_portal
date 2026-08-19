import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCompanies, fetchMetadata } from './api/client';
import { normalizeCountry } from './utils/format';
import { useTheme } from './hooks/useTheme';

import Header from './components/Header';
import Hero from './components/Hero';
import SearchBar from './components/SearchBar';
import ActiveFilterChips from './components/ActiveFilterChips';
import FilterPanel from './components/FilterPanel';
import ViewToggle from './components/ViewToggle';
import JobsGrid from './components/JobsGrid';
import CompanyCarousel from './components/CompanyCarousel';
import { EmptyState, ErrorState, JobCardSkeleton } from './components/EmptyState';
import Footer from './components/Footer';

const VIEW_STORAGE_KEY = 'jobpulse-view';
const DATE_FILTER_LABELS = {
  today: 'Today',
  last7: 'Last 7 Days',
  last30: 'Last 30 Days',
  thisYear: 'This Year',
  custom: 'Custom Range',
};

function App() {
  const { theme, toggleTheme } = useTheme();

  // Companies (+ counts) and metadata, fetched once (companies refetch on search)
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState(null);
  const [metadata, setMetadata] = useState({ locations: [], departments: [], workLocationOptions: [] });

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Filters
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedWorkModes, setSelectedWorkModes] = useState([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  // In-panel search-within-list
  const [companySearch, setCompanySearch] = useState('');
  const [countrySearch, setCountrySearch] = useState('');
  const [departmentSearch, setDepartmentSearch] = useState('');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem(VIEW_STORAGE_KEY) || 'grid';
    } catch {
      return 'grid';
    }
  });
  const [visibleCompanyCount, setVisibleCompanyCount] = useState(10);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, viewMode);
    } catch {
      // localStorage unavailable - view choice just won't persist
    }
  }, [viewMode]);

  useEffect(() => {
    fetchMetadata()
      .then(setMetadata)
      .catch((err) => console.error('Failed to fetch metadata:', err));
  }, []);

  useEffect(() => {
    setCompaniesLoading(true);
    fetchCompanies(activeSearch)
      .then((data) => {
        setCompanies(data || []);
        setCompaniesError(null);
      })
      .catch((err) => setCompaniesError(err.message || 'Failed to load companies'))
      .finally(() => setCompaniesLoading(false));
  }, [activeSearch]);

  const toggleCompany = useCallback((value) => {
    setSelectedCompanies((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }, []);
  const toggleCountry = useCallback((value) => {
    setSelectedCountries((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }, []);
  const toggleDepartment = useCallback((value) => {
    setSelectedDepartments((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }, []);
  const toggleWorkMode = useCallback((value) => {
    setSelectedWorkModes((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }, []);

  const companiesList = useMemo(() => companies.map((c) => c.name).sort(), [companies]);
  const filteredCompaniesForUI = useMemo(
    () => companies.filter((c) => c.name.toLowerCase().includes(companySearch.toLowerCase())),
    [companies, companySearch]
  );

  const countriesList = useMemo(() => {
    const normalized = (metadata.locations || []).map(normalizeCountry).filter(Boolean);
    return [...new Set(normalized)].sort((a, b) => a.localeCompare(b));
  }, [metadata.locations]);
  const filteredCountries = useMemo(
    () => countriesList.filter((c) => c.toLowerCase().includes(countrySearch.toLowerCase())),
    [countriesList, countrySearch]
  );

  const departmentsList = useMemo(() => {
    const list = [...(metadata.departments || [])];
    list.sort((a, b) => {
      if (a === 'Not Specified') return 1;
      if (b === 'Not Specified') return -1;
      return a.localeCompare(b);
    });
    return list;
  }, [metadata.departments]);
  const filteredDepartments = useMemo(
    () => departmentsList.filter((d) => d.toLowerCase().includes(departmentSearch.toLowerCase())),
    [departmentsList, departmentSearch]
  );

  // Company-carousel view: which company rows to render
  const currentDisplayCompanies = useMemo(
    () => (selectedCompanies.length > 0 ? companies.filter((c) => selectedCompanies.includes(c.name)) : companies),
    [companies, selectedCompanies]
  );
  const sortedCompanyNames = useMemo(() => currentDisplayCompanies.map((c) => c.name).sort(), [currentDisplayCompanies]);

  const activeCount = useMemo(() => companies.reduce((sum, c) => sum + (c.count || 0), 0), [companies]);

  const gridFilters = useMemo(
    () => ({
      activeSearch, selectedCompanies, selectedCountries, selectedDepartments, selectedWorkModes,
      dateFilter, startDate, endDate, sortOrder,
    }),
    [activeSearch, selectedCompanies, selectedCountries, selectedDepartments, selectedWorkModes, dateFilter, startDate, endDate, sortOrder]
  );

  const carouselFilters = useMemo(
    () => ({
      activeSearch, selectedCountries, selectedDepartments, selectedWorkModes,
      dateFilter, startDate, endDate, sortOrder,
    }),
    [activeSearch, selectedCountries, selectedDepartments, selectedWorkModes, dateFilter, startDate, endDate, sortOrder]
  );

  const clearAllFilters = useCallback(() => {
    setSelectedCompanies([]);
    setSelectedCountries([]);
    setSelectedDepartments([]);
    setSelectedWorkModes([]);
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
    setActiveSearch('');
  }, []);

  const resetFilterPanel = useCallback(() => {
    setSelectedCompanies([]);
    setSelectedCountries([]);
    setSelectedDepartments([]);
    setSelectedWorkModes([]);
    setSortOrder('newest');
    setDateFilter('all');
    setStartDate('');
    setEndDate('');
    setCompanySearch('');
    setCountrySearch('');
    setDepartmentSearch('');
  }, []);

  const filterChips = useMemo(() => {
    const chips = [];
    selectedCompanies.forEach((name) => chips.push({
      id: `company-${name}`, label: name,
      colorClass: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20',
      onRemove: () => setSelectedCompanies((prev) => prev.filter((c) => c !== name)),
    }));
    selectedCountries.forEach((name) => chips.push({
      id: `country-${name}`, label: name,
      colorClass: 'bg-fuchsia-500/10 border-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 hover:bg-fuchsia-500/20',
      onRemove: () => setSelectedCountries((prev) => prev.filter((c) => c !== name)),
    }));
    selectedDepartments.forEach((name) => chips.push({
      id: `dept-${name}`, label: name,
      colorClass: 'bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20',
      onRemove: () => setSelectedDepartments((prev) => prev.filter((c) => c !== name)),
    }));
    selectedWorkModes.forEach((mode) => chips.push({
      id: `mode-${mode}`, label: mode,
      colorClass: 'bg-sky-500/10 border-sky-500/20 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20',
      onRemove: () => setSelectedWorkModes((prev) => prev.filter((m) => m !== mode)),
    }));
    if (dateFilter !== 'all') {
      chips.push({
        id: 'date', label: `Added: ${DATE_FILTER_LABELS[dateFilter] || dateFilter}`,
        colorClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20',
        onRemove: () => setDateFilter('all'),
      });
    }
    return chips;
  }, [selectedCompanies, selectedCountries, selectedDepartments, selectedWorkModes, dateFilter]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-700 dark:text-slate-200 font-sans selection:bg-indigo-500 selection:text-white pb-20 overflow-x-hidden transition-colors duration-300">
      {/* Animated background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] bg-indigo-300/30 dark:bg-indigo-500/10 blur-[120px] rounded-full animate-aurora"></div>
        <div className="absolute top-[15%] -right-[10%] w-[35%] h-[35%] bg-fuchsia-300/30 dark:bg-fuchsia-500/10 blur-[120px] rounded-full animate-aurora" style={{ animationDelay: '4s' }}></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-sky-300/20 dark:bg-sky-500/10 blur-[120px] rounded-full animate-aurora" style={{ animationDelay: '8s' }}></div>
      </div>

      <Header theme={theme} onToggleTheme={toggleTheme} />

      <main className="relative py-8 sm:py-12">
        <Hero activeCount={activeCount}>
          <SearchBar
            query={searchQuery}
            setQuery={setSearchQuery}
            onSearch={setActiveSearch}
            isFilterActive={filterChips.length > 0}
            onOpenFilters={() => setIsFilterOpen(true)}
          />
        </Hero>

        <ActiveFilterChips chips={filterChips} onClearAll={clearAllFilters} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between mt-8 sm:mt-10 mb-6 sm:mb-8">
          <h2 className="text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400">
            {viewMode === 'grid' ? 'Browsing all companies' : 'Browsing grouped by company'}
          </h2>
          <ViewToggle view={viewMode} onChange={setViewMode} />
        </div>

        <FilterPanel
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          companies={filteredCompaniesForUI}
          companySearch={companySearch}
          setCompanySearch={setCompanySearch}
          selectedCompanies={selectedCompanies}
          onToggleCompany={toggleCompany}
          countries={filteredCountries}
          countrySearch={countrySearch}
          setCountrySearch={setCountrySearch}
          selectedCountries={selectedCountries}
          onToggleCountry={toggleCountry}
          departments={filteredDepartments}
          departmentSearch={departmentSearch}
          setDepartmentSearch={setDepartmentSearch}
          selectedDepartments={selectedDepartments}
          onToggleDepartment={toggleDepartment}
          selectedWorkModes={selectedWorkModes}
          onToggleWorkMode={toggleWorkMode}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          onReset={resetFilterPanel}
        />

        <section className="space-y-10 sm:space-y-16">
          {viewMode === 'grid' ? (
            <JobsGrid filters={gridFilters} onClearFilters={clearAllFilters} />
          ) : companiesLoading ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => <JobCardSkeleton key={i} />)}
            </div>
          ) : companiesError ? (
            <ErrorState message={companiesError} />
          ) : sortedCompanyNames.length > 0 ? (
            <>
              {sortedCompanyNames.slice(0, visibleCompanyCount).map((companyName) => {
                const companyData = companies.find((c) => c.name === companyName);
                return (
                  <CompanyCarousel
                    key={companyName}
                    company={companyName}
                    totalCount={companyData?.count || 0}
                    filters={carouselFilters}
                  />
                );
              })}

              {visibleCompanyCount < sortedCompanyNames.length && (
                <div className="max-w-7xl mx-auto px-4 pb-4 text-center">
                  <button
                    onClick={() => setVisibleCompanyCount((prev) => prev + 10)}
                    className="px-8 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-700 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all inline-flex items-center gap-3 group"
                  >
                    <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                    Load More Companies
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState onClearFilters={clearAllFilters} />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
