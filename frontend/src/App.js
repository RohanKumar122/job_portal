
import React, { useState, useEffect, useMemo, useRef, memo } from 'react';

const normalizeCountry = (loc) => {
  if (!loc) return null;
  const l = loc.toLowerCase();
  if (l.includes('remote')) return null;

  const text = loc.toUpperCase().trim();

  // Comprehensive Mapping
  if (/\b(INDIA|IN|IND)\b/i.test(text) || text.includes('INDIA-') || text.startsWith('IND-') || text.startsWith('IN-')) return 'India';
  if (/\b(USA|US|UNITED STATES|AMERICA|U\.S\.A\.)\b/i.test(text)) return 'USA';
  if (/\b(UK|UNITED KINGDOM|GB|GREAT BRITAIN|U\.K\.)\b/i.test(text)) return 'UK';
  if (/\b(CANADA|CA|CAN)\b/i.test(text)) return 'Canada';
  if (/\b(SINGAPORE|SG|SGP)\b/i.test(text)) return 'Singapore';
  if (/\b(GERMANY|DE|GER)\b/i.test(text)) return 'Germany';
  if (/\b(AUSTRALIA|AU|AUS)\b/i.test(text)) return 'Australia';

  const parts = loc.split(',');
  const possibleCountry = parts[parts.length - 1].trim();
  return possibleCountry || null;
};

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [selectedCountries, setSelectedCountries] = useState([]); // Multiple selection
  const [sortOrder, setSortOrder] = useState('newest');
  const [dateFilter, setDateFilter] = useState('all'); // all, last10, lastMonth, thisYear, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Applied search query for triggering fetches
  const [activeSearch, setActiveSearch] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (activeSearch) params.append('q', activeSearch);
        if (selectedCompany !== 'All') params.append('company', selectedCompany);

        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/jobs'}?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }
        const data = await response.json();
        const processedJobs = (data && Array.isArray(data) ? data : []).map(job => ({
          ...job,
          normalizedCountries: (job?.locations || []).map(normalizeCountry).filter(Boolean)
        }));
        setJobs(processedJobs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [activeSearch, selectedCompany]); // Re-fetch only on search or company change

  // Filter and Group Logic
  const groupedJobs = useMemo(() => {
    let filtered = [...jobs];

    // Client-side refinement (optional, but good for fast feedback)
    // We already filter q and company on server, but we still handle 
    // countries and dates on client for immediate response if needed.

    // Company filter
    if (selectedCompany !== 'All') {
      filtered = filtered.filter(job => job.companyName === selectedCompany);
    }

    // Country filter (Multi-select)
    if (selectedCountries.length > 0) {
      filtered = filtered.filter(job =>
        job.normalizedCountries.some(norm => selectedCountries.includes(norm))
      );
    }

    // Date filtering
    const now = new Date();
    if (dateFilter !== 'all') {
      filtered = filtered.filter(job => {
        const jobDate = new Date(job.postedAt || job.createdAt);
        if (dateFilter === 'last10') {
          const tenDaysAgo = new Date();
          tenDaysAgo.setDate(now.getDate() - 10);
          return jobDate >= tenDaysAgo;
        }
        if (dateFilter === 'lastMonth') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(now.getMonth() - 1);
          return jobDate >= oneMonthAgo;
        }
        if (dateFilter === 'thisYear') {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          return jobDate >= startOfYear;
        }
        if (dateFilter === 'custom' && startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Inclusion of the full end day
          return jobDate >= start && jobDate <= end;
        }
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      const dateA = (a._dateMs = a._dateMs || new Date(a.postedAt || a.createdAt || 0).getTime() || 0);
      const dateB = (b._dateMs = b._dateMs || new Date(b.postedAt || b.createdAt || 0).getTime() || 0);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    const groups = filtered.reduce((acc, job) => {
      const company = job.companyName || 'Unknown Company';
      if (!acc[company]) acc[company] = [];
      acc[company].push(job);
      return acc;
    }, {});

    return groups;
  }, [jobs, selectedCompany, selectedCountries, sortOrder, dateFilter, startDate, endDate]);

  const sortedCompanyNames = useMemo(() => {
    return Object.keys(groupedJobs).sort();
  }, [groupedJobs]);

  const companiesList = useMemo(() => {
    const unique = ['All', ...new Set(jobs.map(job => job.companyName))];
    return unique;
  }, [jobs]);

  const countriesList = useMemo(() => {
    const countries = jobs.flatMap(job => job.normalizedCountries);
    const unique = [...new Set(countries)];
    return unique.sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500 selection:text-white pb-20 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-fuchsia-500/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0f172a]/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
                JOBPULSE
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative py-8 sm:py-12">
        {/* Hero Section */}
        <section className="text-center mb-10 sm:mb-16 space-y-4 sm:space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 sm:mb-4">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-indigo-500"></span>
            </span>
            {jobs.length} Active Positions
          </div>
          <h2 className="text-3xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight px-2">
            Elevate Your <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-indigo-400 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">Professional</span> Journey
          </h2>
          <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto font-medium px-4">
            Discover opportunities grouped by company. Explore each row to find your dream role.
          </p>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mt-8 sm:mt-12">
            <SearchBar
              query={searchQuery}
              setQuery={setSearchQuery}
              onSearch={(query) => setActiveSearch(query)}
              isFilterActive={selectedCompany !== 'All' || selectedCountries.length > 0 || dateFilter !== 'all'}
              onOpenFilters={() => setIsFilterOpen(true)}
            />
          </div>

          {/* Active Filter Chips */}
          {(selectedCompany !== 'All' || selectedCountries.length > 0 || dateFilter !== 'all') && (
            <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-4xl mx-auto">
              {selectedCompany !== 'All' && (
                <button
                  onClick={() => setSelectedCompany('All')}
                  className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 flex items-center gap-2 hover:bg-indigo-500/20 transition-all"
                >
                  Company: {selectedCompany} <span className="opacity-50">×</span>
                </button>
              )}
              {selectedCountries.map(country => (
                <button
                  key={country}
                  onClick={() => setSelectedCountries(prev => prev.filter(c => c !== country))}
                  className="px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-[10px] font-bold text-fuchsia-400 flex items-center gap-2 hover:bg-fuchsia-500/20 transition-all"
                >
                  Country: {country} <span className="opacity-50">×</span>
                </button>
              ))}
              {dateFilter !== 'all' && (
                <button
                  onClick={() => setDateFilter('all')}
                  className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 flex items-center gap-2 hover:bg-emerald-500/20 transition-all"
                >
                  Date: {dateFilter === 'last10' ? 'Last 10 Days' : dateFilter === 'lastMonth' ? 'Last Month' : dateFilter === 'thisYear' ? 'This Year' : 'Custom'} <span className="opacity-50">×</span>
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedCompany('All');
                  setSelectedCountries([]);
                  setDateFilter('all');
                  setSearchQuery('');
                  setActiveSearch('');
                }}
                className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors ml-2"
              >
                Clear All
              </button>
            </div>
          )}
        </section>

        {/* Filter Modal */}
        {isFilterOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm"
              onClick={() => setIsFilterOpen(false)}
            ></div>
            <div className="relative w-full max-w-xl bg-[#0f172a] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-6 sm:p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black text-white px-1">Filter Openings</h3>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="p-2 rounded-full hover:bg-white/5 transition-colors text-slate-400"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Company Filter */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Company</label>
                    <div className="relative group">
                      <select
                        className="w-full appearance-none bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-4 pr-10 text-white font-medium cursor-pointer focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none"
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                      >
                        {companiesList.map(company => (
                          <option key={company} value={company} className="bg-[#1e293b] text-white">{company}</option>
                        ))}
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Country Filter (Multi-select) */}
                  <div className="space-y-3 sm:col-span-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 flex justify-between">
                      Countries
                      <span className="text-indigo-400 normal-case font-bold">{selectedCountries.length} selected</span>
                    </label>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-h-48 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2">
                      {countriesList.map(country => (
                        <label key={country} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all group">
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              className="peer h-5 w-5 appearance-none rounded-md border-2 border-white/10 bg-transparent checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer"
                              checked={selectedCountries.includes(country)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedCountries(prev => [...prev, country]);
                                else setSelectedCountries(prev => prev.filter(c => c !== country));
                              }}
                            />
                            <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className={`text-sm font-medium transition-colors ${selectedCountries.includes(country) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                            {country}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Date Filter */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Posted Period</label>
                    <div className="relative group">
                      <select
                        className="w-full appearance-none bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-4 pr-10 text-white font-medium cursor-pointer focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                      >
                        <option value="all" className="bg-[#1e293b]">All Time</option>
                        <option value="last10" className="bg-[#1e293b]">Last 10 Days</option>
                        <option value="lastMonth" className="bg-[#1e293b]">Last 1 Month</option>
                        <option value="thisYear" className="bg-[#1e293b]">This Year</option>
                        <option value="custom" className="bg-[#1e293b]">Custom Range</option>
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Sort Order */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Sort By</label>
                    <div className="relative group">
                      <select
                        className="w-full appearance-none bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-4 pr-10 text-white font-medium cursor-pointer focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                      >
                        <option value="newest" className="bg-[#1e293b]">Newest First</option>
                        <option value="oldest" className="bg-[#1e293b]">Oldest First</option>
                      </select>
                      <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                    </div>
                  </div>
                </div>

                {dateFilter === 'custom' && (
                  <div className="pt-2 animate-in slide-in-from-top-4 fade-in duration-300">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1 mb-3 block">Custom Range</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <input
                          type="date"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all [color-scheme:dark]"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="date"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all [color-scheme:dark]"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-8 flex gap-4">
                  <button
                    onClick={() => {
                      setSelectedCompany('All');
                      setSelectedCountries([]);
                      setSortOrder('newest');
                      setDateFilter('all');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="flex-1 py-4 px-6 rounded-2xl border border-white/10 text-slate-400 font-bold hover:bg-white/5 hover:text-white transition-all text-sm uppercase tracking-widest"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="flex-[2] py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white font-bold hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20"
                  >
                    Show Results
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Content Section */}
        <section className="mt-4 sm:mt-8 space-y-10 sm:space-y-20">
          {loading ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 sm:h-64 bg-white/5 border border-white/5 rounded-2xl sm:rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-red-500/10 border border-red-500/20 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Error loading jobs</h3>
              <p className="text-sm sm:text-base text-slate-400">{error}</p>
            </div>
          ) : sortedCompanyNames.length > 0 ? (
            sortedCompanyNames.map(company => (
              <JobRow key={company} company={company} jobs={groupedJobs[company]} />
            ))
          ) : (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12 sm:py-24 bg-white/5 border border-white/5 rounded-2xl sm:rounded-3xl">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">No matching jobs</h3>
              <p className="text-sm sm:text-base text-slate-500 max-w-sm mx-auto px-4">Try adjusting your filters to find exactly what you're looking for.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="mt-auto py-8 sm:py-12 border-t border-white/5 text-center">
        <p className="text-slate-500 text-xs sm:text-sm font-medium">© 2026 JobPulse Inc. All rights reserved.</p>
      </footer>

      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.8);
        }
      `}</style>
    </div>
  );
}

const JobRow = memo(({ company, jobs }) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [remainingCount, setRemainingCount] = useState(jobs.length);

  const updateArrows = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);

      // Calculate approximately how many cards are hidden to the right
      // Card width is roughly 320px-416px. Let's use 380px as avg.
      const hiddenWidth = scrollWidth - (scrollLeft + clientWidth);
      const hiddenCount = Math.max(0, Math.ceil(hiddenWidth / 380));
      setRemainingCount(hiddenCount);
    }
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [jobs]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6 flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
          <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
          {company}
          <span className="text-[10px] font-black text-slate-400 bg-white/5 px-2 py-1 rounded-md border border-white/5 uppercase tracking-widest">
            {jobs.length} Results
          </span>
        </h3>

        <div className="flex items-center gap-4">
          {remainingCount > 0 && (
            <span className="hidden sm:block text-[10px] font-black text-indigo-400/80 bg-indigo-500/5 px-3 py-1.5 rounded-full border border-indigo-500/10 uppercase tracking-widest animate-pulse">
              +{remainingCount} More Ahead
            </span>
          )}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll('left')}
              className={`w-10 h-10 rounded-full border border-white/10 flex items-center justify-center transition-all ${showLeftArrow ? 'bg-white/5 opacity-100 hover:scale-110' : 'opacity-20 cursor-not-allowed'}`}
              disabled={!showLeftArrow}
            >
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
            </button>
            <button
              onClick={() => scroll('right')}
              className={`w-10 h-10 rounded-full border border-white/10 flex items-center justify-center transition-all ${showRightArrow ? 'bg-white/5 opacity-100 hover:scale-110' : 'opacity-20 cursor-not-allowed'}`}
              disabled={!showRightArrow}
            >
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="relative group/row">
        {/* Shadow Indicators for Desktop */}
        <div className={`hidden md:block absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0f172a] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`hidden md:block absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0f172a] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0'}`}></div>

        <div
          ref={scrollRef}
          onScroll={updateArrows}
          className="flex items-stretch overflow-x-auto gap-4 sm:gap-6 px-4 sm:px-8 lg:px-[calc((100vw-1280px)/2+2rem)] no-scrollbar pb-12 scroll-smooth snap-x"
        >
          {jobs.map((job) => (
            <div key={job._id || job.id} className="flex-shrink-0 w-72 sm:w-80 md:w-[26rem] snap-start">
              <JobCard job={job} />
            </div>
          ))}

          {/* End of row indicator */}
          <div className="flex-shrink-0 w-24 flex items-center justify-center pr-8 sm:pr-0">
            <div className="w-12 h-12 rounded-full border border-white/5 bg-white/5 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const JobCard = memo(({ job }) => {
  const formattedDate = new Date(job.postedAt || job.createdAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="group relative bg-[#1e293b]/40 hover:bg-[#1e293b]/80 border border-white/5 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 h-full min-h-[340px] transition-all duration-500 hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] hover:-translate-y-2 backdrop-blur-sm overflow-hidden flex flex-col justify-between">
      {/* Accent Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div className="flex-1 min-w-0">
            <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[8px] sm:text-[10px] font-black uppercase tracking-tighter mb-2 sm:mb-3 border border-indigo-500/20">
              {job.department || 'General'}
            </span>
            <h3 className="text-lg sm:text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-indigo-300 group-hover:bg-clip-text transition-all duration-300 leading-tight">
              {job.name || 'Untitled Position'}
            </h3>
            <p className="text-slate-400 font-bold text-xs sm:text-sm mt-1 flex items-center gap-1.5 sm:gap-2">
              <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-slate-600"></span>
              <span className="truncate">{(job.companyName || 'Unknown').toUpperCase()}</span>
            </p>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4 mb-6">
          <div className="flex items-center text-slate-400 text-xs sm:text-sm font-medium">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-800 flex items-center justify-center mr-2 sm:mr-3 group-hover:bg-indigo-500/20 transition-colors">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <span className="truncate">{job.locations?.[0] || 'Remote'}</span>
          </div>
          <div className="flex items-center text-slate-400 text-xs sm:text-sm font-medium">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-800 flex items-center justify-center mr-2 sm:mr-3 group-hover:bg-indigo-500/20 transition-colors">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            Posted {formattedDate}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 pt-4 border-t border-white/5">
        <div className="flex flex-col min-w-0">
          <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Job Type</span>
          <span className="text-xs sm:text-sm font-bold text-slate-300 mt-0.5 sm:mt-1 truncate">{job.workLocationOption || 'Onsite'}</span>
        </div>
        <a
          href={job.positionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 sm:py-3.5 px-6 sm:px-8 rounded-xl sm:rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 text-xs sm:text-sm uppercase tracking-wider"
        >
          Apply
        </a>
      </div>
    </div>
  );
});

const SearchBar = memo(({ query, setQuery, onSearch, isFilterActive, onOpenFilters }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch(query);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl shadow-2xl flex items-center gap-2">
      <div className="flex-1 relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="UI Designer, Backend Engineer..."
          className="w-full bg-transparent border-none focus:ring-0 py-3 sm:py-4 pl-10 sm:pl-12 pr-4 text-sm sm:text-base text-white placeholder-slate-500 font-medium"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <button
        onClick={() => onSearch(query)}
        className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 text-indigo-400 hover:text-indigo-300 transition-all active:scale-90"
        title="Search"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      <div className="h-8 w-px bg-white/10 mx-1"></div>

      <button
        onClick={onOpenFilters}
        className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm sm:text-base font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span className="hidden sm:inline">Filters</span>
        {isFilterActive && (
          <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
        )}
      </button>
    </div>
  );
});

export default App;
