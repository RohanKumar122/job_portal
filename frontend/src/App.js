
import React, { useState, useEffect, useMemo } from 'react';

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch(process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/jobs');
        if (!response.ok) {
          throw new Error('Failed to fetch jobs');
        }
        const data = await response.json();
        setJobs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Filter and Sort Logic
  const filteredAndSortedJobs = useMemo(() => {
    let result = [...jobs];

    // Search by profile/name
    if (searchQuery) {
      result = result.filter(job =>
        job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.companyName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by company
    if (selectedCompany !== 'All') {
      result = result.filter(job => job.companyName === selectedCompany);
    }

    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.postedAt || a.createdAt);
      const dateB = new Date(b.postedAt || b.createdAt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [jobs, searchQuery, selectedCompany, sortOrder]);

  const companies = useMemo(() => {
    const uniqueCompanies = ['All', ...new Set(jobs.map(job => job.companyName))];
    return uniqueCompanies;
  }, [jobs]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-fuchsia-500/10 blur-[120px] rounded-full"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0f172a]/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent tracking-tight">
                JOBPULSE
              </h1>
            </div>

            {/* <nav className="hidden md:flex items-center gap-8">
              <a href="#" className="text-sm font-medium hover:text-indigo-400 transition-colors">Find Jobs</a>
              <a href="#" className="text-sm font-medium hover:text-indigo-400 transition-colors">Companies</a>
              <a href="#" className="text-sm font-medium hover:text-indigo-400 transition-colors">Salaries</a>
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold px-6 py-2.5 rounded-full transition-all shadow-lg shadow-indigo-600/20 active:scale-95">
                Post a Job
              </button>
            </nav> */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            {jobs.length} Active Positions
          </div>
          <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight">
            Elevate Your <span className="bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-indigo-400 bg-[length:200%_auto] animate-gradient bg-clip-text text-transparent">Professional</span> Journey
          </h2>
          <p className="text-slate-400 text-lg md:text-xl max-w-3xl mx-auto font-medium">
            Discover opportunities that match your passion. Filter by top companies and find your perfect role.
          </p>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="UI Designer, Backend Engineer..."
                  className="w-full bg-transparent border-none focus:ring-0 py-4 pl-12 pr-4 text-white placeholder-slate-500 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="h-px md:h-8 md:w-px bg-white/10 my-auto"></div>

              <div className="relative group">
                <select
                  className="appearance-none bg-transparent border-none focus:ring-0 py-4 pl-4 pr-10 text-white font-medium cursor-pointer"
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                >
                  {companies.map(company => (
                    <option key={company} value={company} className="bg-[#1e293b] text-white underline">{company}</option>
                  ))}
                </select>
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <div className="h-px md:h-8 md:w-px bg-white/10 my-auto"></div>

              <div className="relative group">
                <select
                  className="appearance-none bg-transparent border-none focus:ring-0 py-4 pl-4 pr-10 text-white font-medium cursor-pointer"
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
        </section>

        {/* Content Section */}
        <section className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-64 bg-white/5 border border-white/5 rounded-3xl animate-pulse"></div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-12 text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Something went wrong</h3>
              <p className="text-slate-400">{error}</p>
            </div>
          ) : filteredAndSortedJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredAndSortedJobs.map((job) => (
                <JobCard key={job._id || job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-white/5 border border-white/5 rounded-3xl">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No matching jobs</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Try adjusting your search criteria or filters to find exactly what you're looking for.</p>
            </div>
          )}
        </section>
      </main>

      <footer className="mt-auto py-12 border-t border-white/5 text-center">
        <p className="text-slate-500 text-sm font-medium">© 2026 JobPulse Inc. All rights reserved.</p>
      </footer>

      {/* Tailwind animation styles injected via style tag for simplicity */}
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
      `}</style>
    </div>
  );
}

function JobCard({ job }) {
  const formattedDate = new Date(job.postedAt || job.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="group relative bg-[#1e293b]/40 hover:bg-[#1e293b]/80 border border-white/5 rounded-[2rem] p-8 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] hover:-translate-y-2 backdrop-blur-sm overflow-hidden">
      {/* Accent Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

      <div className="flex flex-col h-full">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-tighter mb-3 border border-indigo-500/20">
              {job.department || 'General'}
            </span>
            <h3 className="text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-indigo-300 group-hover:bg-clip-text transition-all duration-300 leading-tight">
              {job.name}
            </h3>
            <p className="text-slate-400 font-bold text-sm mt-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
              {job.companyName.toUpperCase()}
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-center text-slate-400 text-sm font-medium">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center mr-3 group-hover:bg-indigo-500/20 transition-colors">
              <svg className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            {job.locations?.[0] || 'Remote'}
          </div>
          <div className="flex items-center text-slate-400 text-sm font-medium">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center mr-3 group-hover:bg-indigo-500/20 transition-colors">
              <svg className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            Posted {formattedDate}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-l-2 border-indigo-500/50 pl-2">Job Type</span>
            <span className="text-sm font-bold text-slate-300 ml-2 mt-1">{job.workLocationOption || 'Full-time'}</span>
          </div>
          <a
            href={job.positionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 px-8 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 text-sm"
          >
            Apply
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
