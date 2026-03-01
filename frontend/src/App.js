import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';

const normalizeCountry = (loc) => {
  if (!loc) return null;
  const l = loc.toLowerCase();

  // If explicitly remote or containing remote, categorize as Remote
  if (l.includes('remote')) return 'Remote';

  const text = loc.toUpperCase().trim();

  // Comprehensive Mapping Table
  const mapping = {
    'INDIA': 'India', 'IND': 'India', 'IN': 'India',
    'USA': 'USA', 'US': 'USA', 'UNITED STATES': 'USA', 'AMERICA': 'USA', 'U.S.A.': 'USA',
    'UK': 'UK', 'UNITED KINGDOM': 'UK', 'GB': 'UK', 'GREAT BRITAIN': 'UK', 'U.K.': 'UK',
    'CANADA': 'Canada', 'CA': 'Canada', 'CAN': 'Canada',
    'SINGAPORE': 'Singapore', 'SG': 'Singapore', 'SGP': 'Singapore',
    'GERMANY': 'Germany', 'DE': 'Germany', 'GER': 'Germany',
    'AUSTRALIA': 'Australia', 'AU': 'Australia', 'AUS': 'Australia',
    'FRANCE': 'France', 'FR': 'France',
    'SPAIN': 'Spain', 'ES': 'Spain',
    'ITALY': 'Italy', 'IT': 'Italy',
    'JAPAN': 'Japan', 'JP': 'Japan',
    'CHINA': 'China', 'CN': 'China',
    'BRAZIL': 'Brazil', 'BR': 'Brazil',
    'SWEDEN': 'Sweden', 'SE': 'Sweden',
    'NETHERLANDS': 'Netherlands', 'NL': 'Netherlands',
    'POLAND': 'Poland', 'PL': 'Poland',
    'IRELAND': 'Ireland', 'IE': 'Ireland',
    'SWITZERLAND': 'Switzerland', 'CH': 'Switzerland',
    'MEXICO': 'Mexico', 'MX': 'Mexico',
    'ROMANIA': 'Romania', 'RO': 'Romania',
    'HUNGARY': 'Hungary', 'HU': 'Hungary',
    'EGYPT': 'Egypt', 'EG': 'Egypt',
    'MALAYSIA': 'Malaysia', 'MY': 'Malaysia',
    'THAILAND': 'Thailand', 'TH': 'Thailand',
    'VIETNAM': 'Vietnam', 'VN': 'Vietnam'
  };

  // Check for whole word matches in the entire string first
  for (const [key, value] of Object.entries(mapping)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedKey}\\b`, 'i');
    if (regex.test(text)) return value;
  }

  // Fallback: extract the last part (often the country)
  const parts = loc.split(',');
  const possibleCountry = parts[parts.length - 1].trim();

  // Basic validation for the extracted string
  if (possibleCountry.length > 2 && possibleCountry.length < 30) {
    // Capitalize first letter of each word
    return possibleCountry.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }

  return null;
};

function App() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [sortOrder, setSortOrder] = useState('newest');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [metadata, setMetadata] = useState({ locations: [] });

  // Applied search query for triggering fetches
  const [activeSearch, setActiveSearch] = useState('');
  const [visibleCompanyCount, setVisibleCompanyCount] = useState(10);

  // Fetch Metadata (locations)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL?.replace('/jobs', '/metadata') || 'http://127.0.0.1:8000/api/metadata'}`);
        if (response.ok) {
          const data = await response.json();
          setMetadata(data);
        }
      } catch (err) {
        console.error('Failed to fetch metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (activeSearch) params.append('q', activeSearch);

        const apiUrl = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/jobs';
        const companiesUrl = apiUrl.replace('/jobs', '/companies');

        const response = await fetch(`${companiesUrl}?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }
        const data = await response.json();
        setCompanies(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [activeSearch]);

  // Filter Logic - Now handled per Row, but we still need some lists for the UI
  const companiesList = useMemo(() => {
    return companies.map(c => c.name).sort();
  }, [companies]);

  const countriesList = useMemo(() => {
    // We normalize countries from the metadata locations
    const normalized = metadata.locations.map(normalizeCountry).filter(Boolean);
    return [...new Set(normalized)].sort((a, b) => a.localeCompare(b));
  }, [metadata.locations]);

  const filteredCompaniesForUI = useMemo(() => {
    return companiesList.filter(name =>
      name.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [companiesList, companySearch]);

  const currentDisplayCompanies = useMemo(() => {
    if (selectedCompanies.length > 0) {
      return companies.filter(c => selectedCompanies.includes(c.name));
    }
    return companies;
  }, [companies, selectedCompanies]);

  const sortedCompanyNames = useMemo(() => {
    return currentDisplayCompanies.map(c => c.name).sort();
  }, [currentDisplayCompanies]);

  const countryCounts = useMemo(() => {
    // Simplified: we don't have all job counts per country easily without a separate metadata call
    // or just show nothing for now to keep it fast.
    return {};
  }, []);

  const filteredCountries = useMemo(() => {
    return countriesList.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()));
  }, [countriesList, countrySearch]);

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
            {companies.reduce((sum, c) => sum + (c.count || 0), 0)} Active Positions
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
              isFilterActive={selectedCompanies.length > 0 || selectedCountries.length > 0 || dateFilter !== 'all'}
              onOpenFilters={() => setIsFilterOpen(true)}
            />
          </div>

          {/* Active Filter Chips */}
          {(selectedCompanies.length > 0 || selectedCountries.length > 0 || dateFilter !== 'all') && (
            <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-4xl mx-auto">
              {selectedCompanies.map(company => (
                <button
                  key={company}
                  onClick={() => setSelectedCompanies(prev => prev.filter(c => c !== company))}
                  className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 flex items-center gap-2 hover:bg-indigo-500/20 transition-all"
                >
                  {company} <span className="opacity-50">×</span>
                </button>
              ))}
              {selectedCountries.map(country => (
                <button
                  key={country}
                  onClick={() => setSelectedCountries(prev => prev.filter(c => c !== country))}
                  className="px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-[10px] font-bold text-fuchsia-400 flex items-center gap-2 hover:bg-fuchsia-500/20 transition-all"
                >
                  {country} <span className="opacity-50">×</span>
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
                  setSelectedCompanies([]);
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
                  <div className="space-y-3 sm:col-span-2">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Company</label>
                      <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-tight">{selectedCompanies.length} selected</span>
                    </div>
                    <div className="relative mb-2">
                      <input
                        type="text"
                        placeholder="Search companies..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                      />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-h-48 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2">
                      {filteredCompaniesForUI.map(company => (
                        <label key={company} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all group">
                          <div className="relative flex items-center">
                            <input
                              type="checkbox"
                              className="peer h-5 w-5 appearance-none rounded-md border-2 border-white/10 bg-transparent checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer"
                              checked={selectedCompanies.includes(company)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedCompanies(prev => [...prev, company]);
                                else setSelectedCompanies(prev => prev.filter(c => c !== company));
                              }}
                            />
                            <svg className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className={`text-sm font-medium transition-colors flex-1 truncate ${selectedCompanies.includes(company) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                            {company}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Country Filter (Multi-select) */}
                  <div className="space-y-3 sm:col-span-2">
                    <div className="flex items-center justify-between pl-1">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Countries</label>
                      <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-tight">{selectedCountries.length} selected</span>
                    </div>
                    <div className="relative mb-2">
                      <input
                        type="text"
                        placeholder="Search countries..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                      />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-h-48 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-2">
                      {filteredCountries.map(country => (
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
                          <span className={`text-sm font-medium transition-colors flex-1 truncate ${selectedCountries.includes(country) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                            {country}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-400/50 transition-colors">
                            {countryCounts[country] || 0}
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
                      setSelectedCompanies([]);
                      setSelectedCountries([]);
                      setSortOrder('newest');
                      setDateFilter('all');
                      setStartDate('');
                      setEndDate('');
                      setCountrySearch('');
                      setCompanySearch('');
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
            <>
              {sortedCompanyNames.slice(0, visibleCompanyCount).map(companyName => {
                const companyData = companies.find(c => c.name === companyName);
                return (
                  <JobRow
                    key={companyName}
                    company={companyName}
                    totalCount={companyData?.count || 0}
                    filters={{
                      activeSearch,
                      selectedCountries,
                      dateFilter,
                      sortOrder,
                      startDate,
                      endDate
                    }}
                  />
                );
              })}

              {visibleCompanyCount < sortedCompanyNames.length && (
                <div className="max-w-7xl mx-auto px-4 pb-20 text-center">
                  <button
                    onClick={() => setVisibleCompanyCount(prev => prev + 10)}
                    className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold hover:bg-white/10 hover:border-indigo-500/50 transition-all flex items-center gap-3 mx-auto group"
                  >
                    <svg className="w-5 h-5 text-indigo-400 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                    Load More Companies
                  </button>
                </div>
              )}
            </>
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

const JobRow = memo(({ company, totalCount, filters }) => {
  const scrollRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const skipRef = useRef(0);
  const [hasMore, setHasMore] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const fetchJobs = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const currentSkip = reset ? 0 : skipRef.current;
      const params = new URLSearchParams();
      params.append('company', company);
      params.append('limit', '10');
      params.append('skip', currentSkip.toString());
      if (filters.activeSearch) params.append('q', filters.activeSearch);
      if (filters.sortOrder) params.append('sort', filters.sortOrder);
      if (filters.dateFilter) params.append('dateFilter', filters.dateFilter);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      filters.selectedCountries.forEach(c => params.append('locations', c));

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/jobs'}?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');

      const data = await response.json();
      const processed = (data || []).map(job => ({
        ...job,
        normalizedCountries: (job?.locations || []).map(normalizeCountry).filter(Boolean)
      }));

      if (reset) {
        setJobs(processed);
        skipRef.current = processed.length;
      } else {
        setJobs(prev => [...prev, ...processed]);
        skipRef.current += processed.length;
      }

      setHasMore(processed.length === 10);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [company, filters.activeSearch, filters.selectedCountries, filters.sortOrder, filters.dateFilter, filters.startDate, filters.endDate]);

  // Re-fetch when filters change (reset skip to 0)
  useEffect(() => {
    fetchJobs(true);
  }, [fetchJobs]);

  const updateArrows = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [updateArrows, jobs]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (jobs.length === 0 && !loading) return null;

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6 flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
          <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
          {company}
          <span className="text-[10px] font-black text-slate-400 bg-white/5 px-2 py-1 rounded-md border border-white/5 uppercase tracking-widest">
            {totalCount || jobs.length} Total
          </span>
        </h3>

        <div className="flex items-center gap-4">
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

          {/* Load More Button at the end of the row */}
          {hasMore && (
            <div className="flex-shrink-0 w-80 flex items-center justify-center pr-8">
              <button
                onClick={() => fetchJobs()}
                disabled={loading}
                className="group/btn relative w-full h-[340px] rounded-[2rem] border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center gap-4 group"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                </div>
                <div className="text-center">
                  <span className="block text-white font-bold text-lg">Load More</span>
                  <span className="text-slate-500 text-sm font-medium">Keep exploring {company}</span>
                </div>
              </button>
            </div>
          )}

          {!hasMore && jobs.length > 0 && (
            <div className="flex-shrink-0 w-24 flex items-center justify-center pr-8 sm:pr-0 text-slate-600">
              <div className="flex flex-col items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                <span className="text-[10px] font-bold uppercase tracking-widest">End</span>
              </div>
            </div>
          )}
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
