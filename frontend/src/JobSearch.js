import React, { useState, useEffect } from 'react';
import { Search, MapPin, DollarSign, Briefcase, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const API_BASE_URL = 'http://localhost:8000';

const JobSearch = () => {
  const { t } = useLanguage();
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  
  // Advanced filters
  const [workTypeFilter, setWorkTypeFilter] = useState('');
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState(null);
  
  const limit = 20;

  // Load skills for suggestions
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/skills/top?limit=50`);
        if (res.ok) {
          const data = await res.json();
          setAllSkills(data.map(s => s.name));
        }
      } catch (error) {
        console.error('Error loading skills:', error);
      }
    };
    loadSkills();
  }, []);

  useEffect(() => {
    searchJobs();
  }, [page]);

  // Debounced search when filters change
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    const timeout = setTimeout(() => {
      if (page === 0) {
        searchJobs();
      } else {
        setPage(0); // Reset to first page, which will trigger searchJobs
      }
    }, 500);

    setSearchDebounce(timeout);

    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchQuery, locationFilter, workTypeFilter, minSalary, maxSalary]);

  const searchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString()
      });

      if (searchQuery) params.append('query', searchQuery);
      if (locationFilter) params.append('location', locationFilter);
      if (workTypeFilter) params.append('work_type', workTypeFilter);
      if (minSalary) params.append('min_salary', minSalary);
      if (maxSalary) params.append('max_salary', maxSalary);

      const res = await fetch(`${API_BASE_URL}/api/jobs/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.results);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    searchJobs();
    setShowSuggestions(false);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      // Filter suggestions based on input
      const query = value.toLowerCase();
      const filtered = allSkills
        .filter(skill => 
          skill && 
          typeof skill === 'string' && 
          skill.toLowerCase().includes(query)
        )
        .slice(0, 10);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setPage(0);
    // Trigger search with the selected suggestion
    setTimeout(() => {
      searchJobs();
    }, 0);
  };

  const viewJobDetail = async (jobId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedJob(data);
      }
    } catch (error) {
      console.error('Error loading job detail:', error);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-8 h-8" />
            <h1 className="text-4xl font-bold">
              {t({ vi: 'Tìm kiếm việc làm', en: 'Job Search' })}
            </h1>
          </div>
          <p className="text-blue-100">
            {t({ vi: 'Tìm kiếm công việc phù hợp với bạn', en: 'Find the perfect job for you' })}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="bg-slate-700 rounded-lg p-6 shadow-xl mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-300 block mb-2">
                {t({ vi: 'Tìm kiếm công việc', en: 'Search jobs' })}
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={() => {
                    if (searchQuery.trim() && suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    // Delay to allow click on suggestions
                    setTimeout(() => setShowSuggestions(false), 200);
                  }}
                  placeholder={t({ 
                    vi: 'Nhập job title, skills... (vd: Python Engineer)', 
                    en: 'Enter job title, skills... (e.g., Python Engineer)' 
                  })}
                  className="w-full bg-slate-600 text-white pl-10 pr-4 py-3 rounded-lg border border-slate-500 focus:outline-none focus:border-cyan-500"
                />
                
                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-2xl max-h-64 overflow-y-auto z-50">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-3 hover:bg-slate-600 cursor-pointer transition border-b border-slate-600 last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-cyan-400" />
                          <span className="text-white">{suggestion}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-300 block mb-2">
                {t({ vi: 'Địa điểm', en: 'Location' })}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  placeholder={t({ vi: 'Thành phố, Bang...', en: 'City, State...' })}
                  className="w-full bg-slate-600 text-white pl-10 pr-4 py-3 rounded-lg border border-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters 
                ? t({ vi: 'Ẩn bộ lọc nâng cao', en: 'Hide advanced filters' })
                : t({ vi: 'Hiện bộ lọc nâng cao', en: 'Show advanced filters' })
              }
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-600 rounded-lg">
              <div>
                <label className="text-sm text-slate-300 block mb-2">Loại hình làm việc</label>
                <select
                  value={workTypeFilter}
                  onChange={(e) => setWorkTypeFilter(e.target.value)}
                  className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-500 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">Tất cả</option>
                  <option value="Remote">Từ xa (Remote)</option>
                  <option value="Hybrid">Kết hợp (Hybrid)</option>
                  <option value="Onsite">Tại văn phòng (Onsite)</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-300 block mb-2">Lương tối thiểu ($)</label>
                <input
                  type="number"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  placeholder="VD: 50000"
                  className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300 block mb-2">Lương tối đa ($)</label>
                <input
                  type="number"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(e.target.value)}
                  placeholder="VD: 150000"
                  className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-4">
            <button
              type="submit"
              className="bg-cyan-600 hover:bg-cyan-700 px-8 py-3 rounded-lg font-semibold transition"
            >
              Tìm kiếm
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setLocationFilter('');
                setWorkTypeFilter('');
                setMinSalary('');
                setMaxSalary('');
                setPage(0);
              }}
              className="bg-slate-600 hover:bg-slate-500 px-6 py-3 rounded-lg transition"
            >
              Xóa bộ lọc
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-slate-600 hover:bg-slate-500 px-6 py-3 rounded-lg transition flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              Bộ lọc {showFilters && `(${[workTypeFilter, minSalary, maxSalary].filter(Boolean).length})`}
            </button>
          </div>
        </form>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-xl">
            Tìm thấy <span className="font-bold text-cyan-400">{total.toLocaleString()}</span> công việc
            {searchQuery && <span> cho "{searchQuery}"</span>}
            {locationFilter && <span> tại {locationFilter}</span>}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto"></div>
                <p className="mt-4">Đang tải...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-slate-700 rounded-lg p-12 text-center">
                <p className="text-xl text-slate-400">Không tìm thấy công việc phù hợp</p>
                <p className="text-slate-500 mt-2">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            ) : (
              jobs.map((job, idx) => (
                <div
                  key={idx}
                  onClick={() => viewJobDetail(job.job_id)}
                  className="bg-slate-700 rounded-lg p-6 hover:bg-slate-600 transition cursor-pointer shadow-lg"
                >
                  <h3 className="text-xl font-bold mb-2 text-cyan-400">{job.title}</h3>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-slate-300 mb-3">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                    )}
                    {job.work_type && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {job.work_type}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Job ID: {job.job_id}</span>
                    <button className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold">
                      Xem chi tiết →
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </button>

                <span className="bg-slate-700 px-4 py-2 rounded-lg">
                  Trang {page + 1} / {totalPages}
                </span>

                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  Sau
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Job Detail Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-700 rounded-lg p-6 shadow-xl sticky top-4">
              {selectedJob ? (
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold">{selectedJob.title}</h3>
                    <button
                      onClick={() => setSelectedJob(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Location */}
                    {selectedJob.location && (
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Địa điểm</div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {selectedJob.location}
                        </div>
                      </div>
                    )}

                    {/* Work Type */}
                    {selectedJob.work_type && (
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Hình thức</div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          {selectedJob.work_type}
                        </div>
                      </div>
                    )}

                    {/* Salary */}
                    {selectedJob.salary && (
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Mức lương</div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          {selectedJob.salary.min && selectedJob.salary.max ? (
                            <span>
                              ${selectedJob.salary.min.toLocaleString()} - ${selectedJob.salary.max.toLocaleString()}
                              {selectedJob.salary.period && ` / ${selectedJob.salary.period}`}
                            </span>
                          ) : selectedJob.salary.median ? (
                            <span>
                              ${selectedJob.salary.median.toLocaleString()}
                              {selectedJob.salary.period && ` / ${selectedJob.salary.period}`}
                            </span>
                          ) : (
                            <span className="text-slate-400">Thỏa thuận</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {selectedJob.skills && selectedJob.skills.length > 0 && (
                      <div>
                        <div className="text-sm text-slate-400 mb-2">Kỹ năng yêu cầu</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedJob.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="bg-cyan-600 px-3 py-1 rounded-full text-sm"
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Benefits */}
                    {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                      <div>
                        <div className="text-sm text-slate-400 mb-2">Phúc lợi</div>
                        <div className="space-y-1">
                          {selectedJob.benefits.slice(0, 5).map((benefit, idx) => (
                            <div key={idx} className="text-sm flex items-center gap-2">
                              <span className="text-green-400">✓</span>
                              {benefit.type}
                            </div>
                          ))}
                          {selectedJob.benefits.length > 5 && (
                            <div className="text-sm text-slate-400">
                              +{selectedJob.benefits.length - 5} more...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {selectedJob.description && (
                      <div>
                        <div className="text-sm text-slate-400 mb-2">Mô tả công việc</div>
                        <div className="text-sm text-slate-300 max-h-64 overflow-y-auto">
                          {selectedJob.description.substring(0, 500)}...
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Chọn một công việc để xem chi tiết</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSearch;
