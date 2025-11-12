import React, { useState, useEffect } from 'react';
import { Building2, Search, MapPin, Users, TrendingUp, Award, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLanguage } from './LanguageContext';

const API_BASE_URL = 'http://localhost:8000';

const CompanyDirectory = () => {
  const { t } = useLanguage();
  const [companies, setCompanies] = useState([]);
  const [topCompanies, setTopCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Advanced filters
  const [locationFilter, setLocationFilter] = useState('');
  const [companySizeFilter, setCompanySizeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    const timeout = setTimeout(() => {
      if (searchQuery || locationFilter || companySizeFilter) {
        searchCompanies();
      } else {
        loadData();
      }
    }, 500);

    setSearchDebounce(timeout);

    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchQuery, locationFilter, companySizeFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load top hiring companies
      const topRes = await fetch(`${API_BASE_URL}/api/companies/top-hiring?limit=20`);
      if (topRes.ok) {
        const data = await topRes.json();
        setTopCompanies(data.slice(0, 10));
      }

      // Load all companies (sample)
      const allRes = await fetch(`${API_BASE_URL}/api/companies?limit=50`);
      if (allRes.ok) {
        const data = await allRes.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error loading companies:', error);
    }
    setLoading(false);
  };

  const searchCompanies = async () => {
    if (!searchQuery) {
      loadData();
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/companies/search?query=${searchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error searching companies:', error);
    }
  };

  const viewCompanyDetail = async (companyId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/companies/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCompany(data);
      }
    } catch (error) {
      console.error('Error loading company detail:', error);
    }
  };

  const filteredCompanies = searchQuery
    ? companies.filter(c => 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : companies;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8" />
            <h1 className="text-4xl font-bold">{t({ vi: 'Danh mục Công ty', en: 'Company Directory' })}</h1>
          </div>
          <p className="text-purple-100">{t({ vi: 'Khám phá các công ty hàng đầu', en: 'Explore Top Companies' })}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="bg-slate-700 rounded-lg p-6 shadow-xl mb-8">
          <label className="text-sm text-slate-300 block mb-2">{t({ vi: 'Tìm kiếm công ty', en: 'Search Companies' })}</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t({ vi: 'Nhập tên công ty...', en: 'Enter company name...' })}
                className="w-full bg-slate-600 text-white pl-10 pr-4 py-3 rounded-lg border border-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder={t({ vi: 'Địa điểm...', en: 'Location...' })}
                className="w-full bg-slate-600 text-white pl-10 pr-4 py-3 rounded-lg border border-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="text-purple-400 hover:text-purple-300 flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              {showFilters ? t({ vi: 'Ẩn bộ lọc', en: 'Hide Filters' }) : t({ vi: 'Hiện bộ lọc nâng cao', en: 'Show Advanced Filters' })}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-600 rounded-lg">
              <div>
                <label className="text-sm text-slate-300 block mb-2">{t({ vi: 'Quy mô công ty', en: 'Company Size' })}</label>
                <select
                  value={companySizeFilter}
                  onChange={(e) => setCompanySizeFilter(e.target.value)}
                  className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-500 focus:outline-none focus:border-purple-500"
                >
                  <option value="">{t({ vi: 'Tất cả', en: 'All' })}</option>
                  <option value="1-10">{t({ vi: '1-10 nhân viên', en: '1-10 employees' })}</option>
                  <option value="11-50">{t({ vi: '11-50 nhân viên', en: '11-50 employees' })}</option>
                  <option value="51-200">{t({ vi: '51-200 nhân viên', en: '51-200 employees' })}</option>
                  <option value="201-500">{t({ vi: '201-500 nhân viên', en: '201-500 employees' })}</option>
                  <option value="501-1000">{t({ vi: '501-1000 nhân viên', en: '501-1000 employees' })}</option>
                  <option value="1000+">{t({ vi: '1000+ nhân viên', en: '1000+ employees' })}</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setLocationFilter('');
                    setCompanySizeFilter('');
                  }}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition w-full"
                >
                  {t({ vi: 'Xóa bộ lọc', en: 'Clear Filters' })}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Top Hiring Companies Chart */}
        {topCompanies.length > 0 && (
          <div className="bg-slate-700 rounded-lg p-6 shadow-xl mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">{t({ vi: 'Top 10 Công ty tuyển dụng nhiều nhất', en: 'Top 10 Hiring Companies' })}</h2>
            </div>

            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topCompanies}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="job_count" fill="#8b5cf6" name={t({ vi: 'Vị trí tuyển dụng', en: 'Open Positions' })} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company List */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4">
              {t({ vi: 'Tất cả công ty', en: 'All Companies' })} ({filteredCompanies.length})
            </h2>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
                <p className="mt-4">{t({ vi: 'Đang tải...', en: 'Loading...' })}</p>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="bg-slate-700 rounded-lg p-12 text-center">
                <p className="text-xl text-slate-400">{t({ vi: 'Không tìm thấy công ty', en: 'No companies found' })}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCompanies.map((company, idx) => (
                  <div
                    key={idx}
                    onClick={() => viewCompanyDetail(company.company_id)}
                    className="bg-slate-700 rounded-lg p-5 hover:bg-slate-600 transition cursor-pointer shadow-lg"
                  >
                    <h3 className="text-lg font-bold mb-2 text-purple-400">
                      {company.name}
                    </h3>

                    {company.description && (
                      <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                        {company.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      {company.follower_count && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Users className="w-4 h-4" />
                          {company.follower_count.toLocaleString()} {t({ vi: 'người theo dõi', en: 'followers' })}
                        </span>
                      )}
                      <button className="text-purple-400 hover:text-purple-300 font-semibold">
                        {t({ vi: 'Chi tiết →', en: 'Details →' })}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Company Detail Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-slate-700 rounded-lg p-6 shadow-xl sticky top-4">
              {selectedCompany ? (
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold">{selectedCompany.name}</h3>
                    <button
                      onClick={() => setSelectedCompany(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Description */}
                    {selectedCompany.description && (
                      <div>
                        <div className="text-sm text-slate-400 mb-1">{t({ vi: 'Giới thiệu', en: 'About' })}</div>
                        <p className="text-sm text-slate-300">
                          {selectedCompany.description}
                        </p>
                      </div>
                    )}

                    {/* URL */}
                    {selectedCompany.url && (
                      <div>
                        <div className="text-sm text-slate-400 mb-1">{t({ vi: 'Website', en: 'Website' })}</div>
                        <a
                          href={selectedCompany.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 text-sm break-all"
                        >
                          {selectedCompany.url}
                        </a>
                      </div>
                    )}

                    {/* Followers */}
                    {selectedCompany.follower_count && (
                      <div>
                        <div className="text-sm text-slate-400 mb-1">{t({ vi: 'Người theo dõi', en: 'Followers' })}</div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span className="font-semibold">
                            {selectedCompany.follower_count.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Industries */}
                    {selectedCompany.industries && selectedCompany.industries.length > 0 && (
                      <div>
                        <div className="text-sm text-slate-400 mb-2">{t({ vi: 'Ngành nghề', en: 'Industries' })}</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedCompany.industries.map((industry, idx) => (
                            <span
                              key={idx}
                              className="bg-purple-600 px-2 py-1 rounded text-sm"
                            >
                              {industry.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Specialities */}
                    {selectedCompany.specialities && selectedCompany.specialities.length > 0 && (
                      <div>
                        <div className="text-sm text-slate-400 mb-2">{t({ vi: 'Chuyên môn', en: 'Specialties' })}</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedCompany.specialities.slice(0, 10).map((spec, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-600 px-2 py-1 rounded text-xs"
                            >
                              {spec.name}
                            </span>
                          ))}
                          {selectedCompany.specialities.length > 10 && (
                            <span className="text-xs text-slate-400">
                              +{selectedCompany.specialities.length - 10} {t({ vi: 'thêm', en: 'more' })}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Employee Counts */}
                    {selectedCompany.employee_counts && selectedCompany.employee_counts.length > 0 && (
                      <div>
                        <div className="text-sm text-slate-400 mb-2">{t({ vi: 'Nhân sự', en: 'Employees' })}</div>
                        {selectedCompany.employee_counts.map((count, idx) => (
                          <div key={idx} className="text-sm mb-1">
                            <span className="text-slate-300">
                              {new Date(count.time_recorded).toLocaleDateString()}:
                            </span>{' '}
                            <span className="font-semibold">
                              {count.employee_count.toLocaleString()} {t({ vi: 'nhân viên', en: 'employees' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Job Openings */}
                    {selectedCompany.jobs && selectedCompany.jobs.length > 0 && (
                      <div>
                        <div className="text-sm text-slate-400 mb-2">{t({ vi: 'Vị trí tuyển dụng', en: 'Job Openings' })}</div>
                        <div className="space-y-2">
                          {selectedCompany.jobs.slice(0, 5).map((job, idx) => (
                            <div key={idx} className="bg-slate-600 rounded p-3">
                              <div className="font-semibold text-sm mb-1">{job.title}</div>
                              {job.location && (
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                  <MapPin className="w-3 h-3" />
                                  {job.location}
                                </div>
                              )}
                            </div>
                          ))}
                          {selectedCompany.jobs.length > 5 && (
                            <div className="text-sm text-slate-400">
                              +{selectedCompany.jobs.length - 5} {t({ vi: 'vị trí khác', en: 'more positions' })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>{t({ vi: 'Chọn một công ty để xem chi tiết', en: 'Select a company to view details' })}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDirectory;
