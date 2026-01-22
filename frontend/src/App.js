
import React, { useState, useEffect } from 'react';

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/jobs');
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

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-cyan-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-900/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                JobBoard
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Intro */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Find Your Dream <span className="text-cyan-400">Career</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Explore the latest opportunities from top companies. Your next big move starts here.
          </p>
        </div>

        {/* Content State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center max-w-lg mx-auto">
            <p className="text-red-400 font-medium">Error loading jobs</p>
            <p className="text-sm text-red-500/70 mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard key={job._id || job.id} job={job} />
            ))}
          </div>
        )}

        {!loading && !error && jobs.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">No job openings found at the moment.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function JobCard({ job }) {
  return (
    <div className="group relative bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
            {job.name}
          </h3>
          <p className="text-slate-400 font-medium text-sm mt-1 uppercase tracking-wider">
            {job.companyName}
          </p>
        </div>
        <span className="bg-cyan-500/10 text-cyan-400 text-xs font-semibold px-3 py-1 rounded-full border border-cyan-500/20">
          {job.workLocationOption || 'Onsite'}
        </span>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center text-slate-400 text-sm">
          <svg className="w-4 h-4 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {job.locations && job.locations[0]}
        </div>
        <div className="flex items-center text-slate-400 text-sm">
          <svg className="w-4 h-4 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Posted: {job.postedAt}
        </div>
      </div>

      <a
        href={job.positionUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-cyan-900/20"
      >
        Apply Now
      </a>
    </div>
  );
}

export default App;
