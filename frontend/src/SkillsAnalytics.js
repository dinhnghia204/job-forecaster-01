import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import { TrendingUp, Zap, Target, Award, Search, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const API_BASE_URL = 'http://localhost:8000';

const SkillsAnalytics = () => {
  const { t } = useLanguage();
  const [topSkills, setTopSkills] = useState([]);
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [skillForecast, setSkillForecast] = useState(null);
  const [skillNetwork, setSkillNetwork] = useState(null);
  const [salaryDistribution, setSalaryDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('hotness'); // hotness, growth, volume

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load top skills with hotness scores
      const topRes = await fetch(`${API_BASE_URL}/api/hotness/skills-advanced?limit=20`);
      if (topRes.ok) {
        const data = await topRes.json();
        setTopSkills(data);
        if (data.length > 0) {
          selectSkill(data[0].skill);
        }
      }

      // Load trending skills
      const trendRes = await fetch(`${API_BASE_URL}/api/forecast/trending?limit=20`);
      if (trendRes.ok) {
        const data = await trendRes.json();
        setTrendingSkills(data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const selectSkill = async (skillName) => {
    setSelectedSkill(skillName);
    
    try {
      // Load forecast for this skill
      const forecastRes = await fetch(`${API_BASE_URL}/api/forecast/skill/${encodeURIComponent(skillName)}?periods=12`);
      if (forecastRes.ok) {
        const data = await forecastRes.json();
        setSkillForecast(data);
      }

      // Load salary distribution
      const salaryRes = await fetch(`${API_BASE_URL}/api/analytics/salary-distribution?skill=${encodeURIComponent(skillName)}`);
      if (salaryRes.ok) {
        const data = await salaryRes.json();
        setSalaryDistribution(data);
      }
    } catch (error) {
      console.error('Error loading skill details:', error);
    }
  };

  const sortedSkills = [...topSkills].sort((a, b) => {
    if (filterBy === 'hotness') return b.hotness - a.hotness;
    if (filterBy === 'growth') return b.growth_rate - a.growth_rate;
    if (filterBy === 'volume') return b.count - a.count;
    return 0;
  });

  const filteredSkills = sortedSkills.filter(skill =>
    skill.skill.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Prepare chart data
  const topSkillsChart = topSkills.slice(0, 15).map(s => ({
    skill: s.skill,
    hotness: s.hotness,
    growth: s.growth_rate,
    volume: s.count
  }));

  const forecastChartData = skillForecast?.forecast?.map(f => ({
    month: f.month,
    predicted: f.predicted_count,
    lower: f.lower_bound,
    upper: f.upper_bound
  })) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-xl">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-8 h-8" />
            <h1 className="text-4xl font-bold">{t({ vi: 'Phân tích Kỹ năng', en: 'Skills Analytics' })}</h1>
          </div>
          <p className="text-purple-100">{t({ vi: 'Phân tích chuyên sâu về kỹ năng & xu hướng thị trường', en: 'In-depth analysis of skills & market trends' })}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Search & Filter Bar */}
        <div className="bg-slate-700 rounded-lg p-4 shadow-xl">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t({ vi: 'Tìm kiếm kỹ năng...', en: 'Search skills...' })}
                  className="w-full bg-slate-600 text-white pl-10 pr-4 py-2 rounded-lg border border-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <Filter className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-400">{t({ vi: 'Sắp xếp:', en: 'Sort by:' })}</span>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="bg-slate-600 text-white px-4 py-2 rounded-lg border border-slate-500"
              >
                <option value="hotness">{t({ vi: 'Hotness Score', en: 'Hotness Score' })}</option>
                <option value="growth">{t({ vi: 'Tăng trưởng', en: 'Growth' })}</option>
                <option value="volume">{t({ vi: 'Số lượng jobs', en: 'Job Count' })}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Top Skills Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-lg p-6 shadow-xl">
            <div className="text-sm text-cyan-100 mb-1">Tổng số Skills</div>
            <div className="text-4xl font-bold">{topSkills.length}</div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-lg p-6 shadow-xl">
            <div className="text-sm text-green-100 mb-1">Skills hot nhất</div>
            <div className="text-4xl font-bold">{topSkills.filter(s => s.hotness > 70).length}</div>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-red-700 rounded-lg p-6 shadow-xl">
            <div className="text-sm text-orange-100 mb-1">Trending (&gt;20%)</div>
            <div className="text-4xl font-bold">{trendingSkills.length}</div>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-lg p-6 shadow-xl">
            <div className="text-sm text-purple-100 mb-1">Avg Hotness</div>
            <div className="text-4xl font-bold">
              {Math.round(topSkills.reduce((sum, s) => sum + s.hotness, 0) / topSkills.length)}
            </div>
          </div>
        </div>

        {/* Top Skills Chart */}
        <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            Top 15 Skills - Hotness Score
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topSkillsChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis 
                dataKey="skill" 
                stroke="#94a3b8" 
                angle={-45} 
                textAnchor="end" 
                height={150}
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#94a3b8" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Legend />
              <Bar dataKey="hotness" fill="#06b6d4" name="Hotness Score" />
              <Bar dataKey="growth" fill="#10b981" name="Growth %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Skills Grid */}
        <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
          <h3 className="text-2xl font-bold mb-4">Danh sách Skills Chi tiết</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
            {filteredSkills.map((skill, idx) => (
              <div
                key={idx}
                onClick={() => selectSkill(skill.skill)}
                className={`bg-slate-600 p-4 rounded-lg hover:bg-slate-500 transition cursor-pointer border-2 ${
                  selectedSkill === skill.skill ? 'border-cyan-500' : 'border-transparent'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-lg">{skill.skill}</h4>
                    <p className="text-sm text-slate-300">{skill.count} jobs</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-cyan-400">{skill.hotness}</div>
                    <div className="text-xs text-slate-400">hotness</div>
                  </div>
                </div>

                <div className="flex gap-3 text-sm">
                  <span className={`flex items-center gap-1 ${
                    skill.growth_rate > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {skill.growth_rate > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {skill.growth_rate > 0 ? '+' : ''}{skill.growth_rate}%
                  </span>
                  <span className="text-slate-400">|</span>
                  <span>{skill.rating}</span>
                </div>

                {/* Progress bar */}
                <div className="mt-3 bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${skill.hotness}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Skill Details */}
        {selectedSkill && skillForecast && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg p-6 shadow-xl">
              <h2 className="text-3xl font-bold mb-2">📊 Chi tiết: {selectedSkill}</h2>
              <p className="text-blue-100">Phân tích sâu và dự báo 12 tháng tới</p>
            </div>

            {/* Forecast Chart */}
            <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Dự báo Demand - 12 tháng tới
                {skillForecast.confidence && (
                  <span className="text-sm text-slate-400 ml-auto">
                    Confidence: {skillForecast.confidence}%
                  </span>
                )}
              </h3>
              
              {forecastChartData.length > 0 && (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={forecastChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#06b6d4" 
                      strokeWidth={3}
                      name="Dự báo"
                      dot={{ r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="lower" 
                      stroke="#64748b" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      name="Lower bound"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="upper" 
                      stroke="#64748b" 
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      name="Upper bound"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}

              {skillForecast.method && (
                <div className="mt-4 text-sm text-slate-400">
                  📈 Phương pháp: {skillForecast.method} | 
                  📅 Periods: {skillForecast.periods} months
                </div>
              )}
            </div>

            {/* Salary Distribution */}
            {salaryDistribution && !salaryDistribution.error && (
              <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
                <h3 className="text-xl font-bold mb-4">💰 Phân bố Lương - {selectedSkill}</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-600 p-4 rounded-lg">
                    <div className="text-sm text-slate-400">Trung bình</div>
                    <div className="text-2xl font-bold text-green-400">
                      ${salaryDistribution.statistics?.mean?.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-600 p-4 rounded-lg">
                    <div className="text-sm text-slate-400">Trung vị</div>
                    <div className="text-2xl font-bold text-cyan-400">
                      ${salaryDistribution.statistics?.median?.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-600 p-4 rounded-lg">
                    <div className="text-sm text-slate-400">Min</div>
                    <div className="text-xl font-bold">
                      ${salaryDistribution.statistics?.min?.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-600 p-4 rounded-lg">
                    <div className="text-sm text-slate-400">Max</div>
                    <div className="text-xl font-bold">
                      ${salaryDistribution.statistics?.max?.toLocaleString()}
                    </div>
                  </div>
                </div>

                {salaryDistribution.distribution && (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salaryDistribution.distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis 
                        dataKey="range" 
                        stroke="#94a3b8" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        style={{ fontSize: '10px' }}
                      />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      />
                      <Bar dataKey="count" fill="#10b981" name="Số lượng" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </div>
        )}

        {/* Trending Skills Section */}
        {trendingSkills.length > 0 && (
          <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-orange-400" />
              🔥 Trending Skills (Growth &gt; 10%)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trendingSkills.slice(0, 10).map((skill, idx) => (
                <div key={idx} className="bg-slate-600 p-4 rounded-lg hover:bg-slate-500 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg">{skill.skill}</h4>
                      <p className="text-sm text-slate-300">{skill.count} jobs</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-400">
                        {skill.trend} +{skill.growth_rate}%
                      </div>
                      <div className="text-xs text-slate-400">growth</div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-cyan-400">Hotness: {skill.hotness}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsAnalytics;
