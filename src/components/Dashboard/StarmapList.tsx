'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Compass, Clock, CheckCircle2, ChevronRight, Activity, Search, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Starmap = {
  id: string;
  title: string | null;
  status: string | null;
  updatedAt: Date;
  createdAt: Date;
};

export function StarmapList({ initialStarmaps }: { initialStarmaps: Starmap[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredStarmaps = useMemo(() => {
    return initialStarmaps.filter((starmap) => {
      if (!searchQuery) return true;
      return (starmap.title?.toLowerCase() || 'untitled starmap').includes(searchQuery.toLowerCase());
    });
  }, [initialStarmaps, searchQuery]);

  const totalPages = Math.ceil(filteredStarmaps.length / itemsPerPage);
  
  // Ensure current page is valid
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  const paginatedStarmaps = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStarmaps.slice(start, start + itemsPerPage);
  }, [filteredStarmaps, currentPage]);

  const handlePageJump = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentPage(Number(e.target.value));
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 px-2 border-b border-white/5 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
            <Compass size={16} className="text-white/50" />
          </div>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Starmaps</h2>
          <span className="text-xs text-white/30 font-medium bg-white/5 px-2 py-0.5 rounded border border-white/10 ml-2">
            {filteredStarmaps.length} Total
          </span>
        </div>
        
        {/* Search & Pagination Controls */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Search starmaps..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-white placeholder-white/20 focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 outline-none w-full sm:w-[200px] transition-all"
            />
          </div>
        </div>
      </div>

      {filteredStarmaps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 rounded-[2.5rem] border border-dashed border-white/10 bg-white/[0.01]">
          <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
            <Compass size={32} className="text-white/20" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No transmissions found.</h3>
          <p className="text-white/40 font-light max-w-md text-center">
            Your constellation is empty or no starmaps match your search.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 min-h-[400px]">
            <AnimatePresence mode="popLayout">
              {paginatedStarmaps.map((starmap, index) => (
                <motion.div
                  key={starmap.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link
                    href={`/discovery/${starmap.id}`}
                    className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] overflow-hidden"
                  >
                    {/* Hover Accent Line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 opacity-0 transform -translate-x-full group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
                    
                    <div className="flex items-center gap-5 min-w-0">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                        starmap.status === 'completed' 
                          ? 'bg-secondary-500/10 text-secondary-500 group-hover:bg-secondary-500 group-hover:text-white shadow-[0_0_20px_rgba(79,70,229,0.0)] group-hover:shadow-[0_0_20px_rgba(79,70,229,0.3)]' 
                          : 'bg-primary-500/10 text-primary-500 group-hover:bg-primary-500 group-hover:text-[#020C1B] shadow-[0_0_20px_rgba(167,218,219,0.0)] group-hover:shadow-[0_0_20px_rgba(167,218,219,0.3)]'
                      }`}>
                        {starmap.status === 'completed' ? <CheckCircle2 size={20} strokeWidth={2.5} /> : <Activity size={20} strokeWidth={2.5} />}
                      </div>
                      
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white group-hover:text-primary-400 transition-colors truncate mb-1">
                          {starmap.title || 'Untitled Strategy Blueprint'}
                        </h3>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-white/40 flex items-center gap-1.5 font-light">
                            <Clock size={12} />
                            {new Date(starmap.updatedAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:pl-4 sm:border-l border-white/5">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                        starmap.status === 'completed'
                          ? 'border-secondary-500/20 text-secondary-400 bg-secondary-500/10'
                          : 'border-primary-500/20 text-primary-500 bg-primary-500/10'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${starmap.status === 'completed' ? 'bg-secondary-400' : 'bg-primary-500 animate-pulse'}`} />
                        {starmap.status === 'completed' ? 'Finished' : 'In Progress'}
                      </span>
                      
                      <div className="h-8 w-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                        <ChevronRight size={14} className="text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 px-2 border-t border-white/5 pt-4">
              <p className="text-xs text-white/30 font-light">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStarmaps.length)} of {filteredStarmaps.length}
              </p>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">Page</span>
                  <select
                    value={currentPage}
                    onChange={handlePageJump}
                    className="bg-white/5 border border-white/10 text-xs text-white rounded-lg px-2 py-1 outline-none focus:border-primary-500/50 cursor-pointer"
                  >
                    {Array.from({ length: totalPages }, (_, i) => (
                      <option key={i + 1} value={i + 1} className="bg-[#020C1B] text-white">
                        {i + 1}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-white/40">of {totalPages}</span>
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white/5 text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
