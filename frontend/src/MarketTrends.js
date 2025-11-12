import React, { useState, useEffect } from 'react';
import { TrendingUp, MapPin, Briefcase, DollarSign, BarChart3 } from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { useLanguage } from './LanguageContext';

const API_BASE_URL = 'http://localhost:8000';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

const MarketTrends = () => {
  const { t } = useLanguage();
  const [marketOverview, setMarketOverview] = useState(null);
  const [industries, setIndustries] = useState([]);
  const [cities, setCities] = useState([]);
  const [salaryDist, setSalaryDist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Market Overview
      const overviewRes = await fetch(`${API_BASE_URL}/api/analytics/market-overview`);
      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setMarketOverview(data);
      }

      // Industry Breakdown
      const industryRes = await fetch(`${API_BASE_URL}/api/analytics/industries?limit=10`);
      if (industryRes.ok) {
        const data = await industryRes.json();
        if (data && data.length > 0) {
          setIndustries(data.map(item => ({
            name: item.industry_name && item.industry_name.length > 20 
              ? item.industry_name.substring(0, 20) + '...' 
              : item.industry_name || 'Unknown',
            fullName: item.industry_name || 'Unknown',
            value: item.job_count
          })));
        }
      }

      // Top Cities
      const citiesRes = await fetch(`${API_BASE_URL}/api/analytics/cities?limit=15`);
      if (citiesRes.ok) {
        const data = await citiesRes.json();
        if (data && data.length > 0) {
          setCities(data.map(item => ({
            name: item.city || item.location || 'Unknown',
            jobs: item.job_count,
            avgSalary: item.avg_salary
          })));
        }
      }

      // Salary Distribution
      const salaryRes = await fetch(`${API_BASE_URL}/api/analytics/salary-distribution`);
      if (salaryRes.ok) {
        const data = await salaryRes.json();
        if (data.histogram) {
          setSalaryDist(data.histogram.map(item => ({
            range: `$${(item.min / 1000).toFixed(0)}k-$${(item.max / 1000).toFixed(0)}k`,
            count: item.count
          })));
        }
      }
    } catch (error) {
      console.error('Error loading market trends:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-xl">{t({ vi: 'Đang tải dữ liệu...', en: 'Loading data...' })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8" />
            <h1 className="text-4xl font-bold">
              {t({ vi: 'Xu hướng Thị trường', en: 'Market Trends' })}
            </h1>
          </div>
          <p className="text-cyan-100">
            {t({ vi: 'Phân tích xu hướng thị trường lao động', en: 'Analyze labor market trends' })}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics */}
        {marketOverview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-6 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <Briefcase className="w-8 h-8" />
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold mb-1">
                {marketOverview.jobs?.total?.toLocaleString() || 0}
              </div>
              <div className="text-purple-200 text-sm">
                {t({ vi: 'Tổng tin tuyển dụng', en: 'Total Job Postings' })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-lg p-6 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <BarChart3 className="w-8 h-8" />
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold mb-1">
                {marketOverview.skills?.total?.toLocaleString() || 0}
              </div>
              <div className="text-cyan-200 text-sm">
                {t({ vi: 'Kỹ năng độc nhất', en: 'Unique Skills' })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-6 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8" />
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold mb-1">
                ${Math.round(marketOverview.salaries?.average || 0).toLocaleString()}
              </div>
              <div className="text-green-200 text-sm">
                {t({ vi: 'Lương trung bình', en: 'Average Salary' })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-6 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-8 h-8" />
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold mb-1">
                {marketOverview.industries?.total?.toLocaleString() || 0}
              </div>
              <div className="text-orange-200 text-sm">
                {t({ vi: 'Ngành nghề', en: 'Industries' })}
              </div>
            </div>
          </div>
        )}

        {/* Industry Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-500" />
              {t({ vi: 'Ngành nghề hàng đầu - Biểu đồ cột', en: 'Top Industries - Bar Chart' })}
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={industries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={120}
                  interval={0}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  formatter={(value, name, props) => [value, props.payload.fullName]}
                />
                <Bar dataKey="value" fill="#8b5cf6" name="Job Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-cyan-500" />
              {t({ vi: 'Phân bố Ngành nghề - Biểu đồ tròn', en: 'Industry Distribution - Pie Chart' })}
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={industries}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {industries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  formatter={(value, name, props) => [value, props.payload.fullName]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Cities */}
        <div className="bg-slate-700 rounded-lg p-6 shadow-xl mb-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-green-500" />
            {t({ vi: 'Top 15 Thành phố theo Số lượng Công việc', en: 'Top 15 Cities by Job Count' })}
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={cities}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis yAxisId="left" tick={{ fill: '#94a3b8' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="jobs" fill="#10b981" name={t({ vi: 'Số lượng Công việc', en: 'Job Count' })} />
              <Bar yAxisId="right" dataKey="avgSalary" fill="#f59e0b" name={t({ vi: 'Lương TB ($)', en: 'Avg Salary ($)' })} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Salary Distribution */}
        {salaryDist.length > 0 && (
          <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-yellow-500" />
              {t({ vi: 'Phân bố Mức lương', en: 'Salary Distribution' })}
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={salaryDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="range" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="count" fill="#eab308" name={t({ vi: 'Số lượng Công việc', en: 'Job Count' })} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Market Insights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-slate-700 to-slate-600 rounded-lg p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-3 text-purple-400">📈 {t({ vi: 'Xu hướng Tăng trưởng', en: 'Growth Trend' })}</h3>
            <p className="text-slate-300 text-sm">
              {t({ 
                vi: 'Thị trường IT tiếp tục tăng trưởng mạnh mẽ với nhu cầu tuyển dụng cao ở các vị trí AI/ML, Cloud, và Cybersecurity.',
                en: 'The IT market continues strong growth with high recruitment demand in AI/ML, Cloud, and Cybersecurity positions.'
              })}
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-700 to-slate-600 rounded-lg p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-3 text-cyan-400">💼 {t({ vi: 'Kỹ năng Hot', en: 'Hot Skills' })}</h3>
            <p className="text-slate-300 text-sm">
              {t({
                vi: 'Python, JavaScript, và AWS dẫn đầu danh sách kỹ năng được yêu cầu nhiều nhất. Remote work skills cũng tăng cao.',
                en: 'Python, JavaScript, and AWS lead the list of most requested skills. Remote work skills are also rising.'
              })}
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-700 to-slate-600 rounded-lg p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-3 text-green-400">💰 {t({ vi: 'Triển vọng Lương', en: 'Salary Outlook' })}</h3>
            <p className="text-slate-300 text-sm">
              {t({
                vi: 'Mức lương trung bình tiếp tục tăng, đặc biệt ở các vị trí senior và leadership. Tech hubs vẫn dẫn đầu về compensation.',
                en: 'Average salaries continue to rise, especially in senior and leadership positions. Tech hubs still lead in compensation.'
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketTrends;
