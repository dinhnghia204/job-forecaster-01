import React, { useState, useEffect } from 'react';
import { BarChart, Bar, BoxPlot, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, Area, ScatterChart, Scatter, Cell, PieChart, Pie } from 'recharts';
import { DollarSign, TrendingUp, MapPin, Award, Info } from 'lucide-react';
import { useLanguage } from './LanguageContext';

// ============================================
// SALARY INSIGHTS COMPONENT
// ============================================

const API_BASE_URL = 'http://localhost:8000';

const SalaryInsights = () => {
  const { t } = useLanguage();
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [salaryDistribution, setSalaryDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);

  useEffect(() => {
    loadSkills();
  }, []);

  useEffect(() => {
    if (selectedSkill) {
      loadSalaryData(selectedSkill);
    }
  }, [selectedSkill]);

  const loadSkills = async () => {
    setLoading(true);
    try {
      // Load top skills
      const res = await fetch(`${API_BASE_URL}/api/skills/top?limit=50`);
      if (res.ok) {
        const data = await res.json();
        const skillList = data.map(item => item.skill);
        setAllSkills(skillList);
        setSkills(skillList.slice(0, 20)); // Top 20
        
        // Set first skill as default
        if (skillList.length > 0) {
          setSelectedSkill(skillList[0]);
        }
      }
    } catch (error) {
      console.error('Error loading skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSalaryData = async (skillName) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/salary-distribution?skill_name=${encodeURIComponent(skillName)}`);
      if (res.ok) {
        const data = await res.json();
        setSalaryDistribution(data);
      }
    } catch (error) {
      console.error('Error loading salary data:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-8 h-8" />
            <h1 className="text-3xl font-bold">💰 {t({ vi: 'Thông tin Lương', en: 'Salary Insights' })}</h1>
          </div>
          <p className="text-green-100">{t({ vi: 'Phân tích mức lương theo kỹ năng, kinh nghiệm và địa điểm', en: 'Analyze salaries by skill, experience, and location' })}</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-4">{t({ vi: 'Đang tải...', en: 'Loading...' })}</p>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div className="bg-slate-700 rounded-lg p-4 shadow-xl flex gap-4 flex-wrap">
              <div>
                <label className="text-sm text-slate-300 block mb-1">{t({ vi: 'Kỹ năng', en: 'Skill' })}</label>
                <select 
                  value={selectedSkill}
                  onChange={(e) => setSelectedSkill(e.target.value)}
                  className="bg-slate-600 text-white px-4 py-2 rounded-lg border border-slate-500"
                >
                  {skills.length === 0 ? (
                    <option>{t({ vi: 'Đang tải...', en: 'Loading...' })}</option>
                  ) : (
                    skills.map(skill => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Salary Statistics */}
            {salaryDistribution && salaryDistribution.statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 shadow-xl">
                  <div className="text-sm text-blue-200 mb-1">{t({ vi: 'Trung bình', en: 'Mean' })}</div>
                  <div className="text-3xl font-bold">${(salaryDistribution.statistics.mean / 1000).toFixed(1)}k</div>
                </div>
                
                <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-lg p-4 shadow-xl">
                  <div className="text-sm text-cyan-200 mb-1">{t({ vi: 'Trung vị', en: 'Median' })}</div>
                  <div className="text-3xl font-bold">${(salaryDistribution.statistics.median / 1000).toFixed(1)}k</div>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg p-4 shadow-xl">
                  <div className="text-sm text-emerald-200 mb-1">{t({ vi: 'Min - Max', en: 'Min - Max' })}</div>
                  <div className="text-xl font-bold">${(salaryDistribution.statistics.min / 1000).toFixed(0)}k - ${(salaryDistribution.statistics.max / 1000).toFixed(0)}k</div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-4 shadow-xl">
                  <div className="text-sm text-purple-200 mb-1">{t({ vi: 'Mẫu', en: 'Samples' })}</div>
                  <div className="text-3xl font-bold">{salaryDistribution.total_samples}</div>
                </div>
              </div>
            )}

            {/* Salary Distribution Chart */}
            {salaryDistribution && salaryDistribution.distribution && (
              <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  {t({ vi: 'Phân bố Mức lương', en: 'Salary Distribution' })} - {selectedSkill}
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={salaryDistribution.distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="range" stroke="#94a3b8" angle={-45} textAnchor="end" height={120} />
                    <YAxis stroke="#94a3b8" label={{ value: t({ vi: 'Số lượng', en: 'Count' }), angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      formatter={(value, name) => [value, t({ vi: 'Số lượng', en: 'Count' })]}
                    />
                    <Bar dataKey="count" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
                
                {/* Percentile Info */}
                {salaryDistribution.statistics && (
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div className="bg-slate-600 rounded p-3">
                      <div className="text-sm text-slate-300">{t({ vi: 'Tứ phân vị 25%', en: '25th Percentile' })}</div>
                      <div className="text-xl font-bold text-cyan-400">${(salaryDistribution.statistics.q25 / 1000).toFixed(1)}k</div>
                    </div>
                    <div className="bg-slate-600 rounded p-3">
                      <div className="text-sm text-slate-300">{t({ vi: 'Trung vị (50%)', en: 'Median (50%)' })}</div>
                      <div className="text-xl font-bold text-green-400">${(salaryDistribution.statistics.median / 1000).toFixed(1)}k</div>
                    </div>
                    <div className="bg-slate-600 rounded p-3">
                      <div className="text-sm text-slate-300">{t({ vi: 'Tứ phân vị 75%', en: '75th Percentile' })}</div>
                      <div className="text-xl font-bold text-purple-400">${(salaryDistribution.statistics.q75 / 1000).toFixed(1)}k</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg p-6 shadow-xl">
              <h3 className="text-xl font-bold mb-3">💡 {t({ vi: 'Thông tin', en: 'Information' })}</h3>
              <div className="text-sm space-y-2">
                <p>{t({ vi: 'Dữ liệu mức lương được thu thập từ các tin tuyển dụng thực tế', en: 'Salary data is collected from real job postings' })}</p>
                {!salaryDistribution && (
                  <p className="text-yellow-200">{t({ vi: '👆 Chọn một kỹ năng ở trên để xem phân bố mức lương chi tiết', en: '👆 Select a skill above to view detailed salary distribution' })}</p>
                )}
                {salaryDistribution && salaryDistribution.total_samples && (
                  <p className="text-yellow-100 font-semibold">
                    ✅ {t({ vi: `Đang hiển thị ${salaryDistribution.total_samples} mẫu dữ liệu cho kỹ năng "${selectedSkill}"`, en: `Showing ${salaryDistribution.total_samples} data samples for skill "${selectedSkill}"` })}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SalaryInsights;
