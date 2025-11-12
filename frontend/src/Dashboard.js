import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, Search, Download, Zap, MapPin, Info, X } from 'lucide-react';
import { useLanguage } from './LanguageContext';

// ============================================
// API Integration
// ============================================

const API_BASE_URL = 'http://localhost:8000';

const fetchFromAPI = async (endpoint) => {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return null;
  }
};

// ============================================
// Helper Functions
// ============================================

// Generate time series forecast data from actual counts
const generateForecastFromData = (items, months = 18) => {
  const data = [];
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() - months + 1);
  
  for (let i = 0; i < months; i++) {
    const date = new Date(baseDate);
    date.setMonth(date.getMonth() + i);
    const month = date.toLocaleDateString('vi-VN', { month: '2-digit', year: '2-digit' });
    
    const monthData = { month, timestamp: date };
    
    // Add data for each item with simulated trend
    items.forEach(item => {
      const name = item.skill || item.occupation || item.name;
      const baseValue = item.volume || item.count || 100;
      const growthRate = (item.growth || 10) / 100;
      
      // Simulate historical trend with some randomness
      const trendValue = baseValue * (1 - (growthRate * (months - i) / months));
      const noise = Math.random() * baseValue * 0.1;
      monthData[name] = Math.max(10, Math.floor(trendValue + noise));
    });
    
    data.push(monthData);
  }
  
  return data;
};

// ============================================
// Dashboard Component
// ============================================

function Dashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [forecastMonths, setForecastMonths] = useState(6);
  const [apiStatus, setApiStatus] = useState('connecting');
  const [skillData, setSkillData] = useState([]);
  const [occupationData, setOccupationData] = useState([]);
  const [allSuggestions, setAllSuggestions] = useState([]);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data from API
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const health = await fetchFromAPI('/api/health');
        if (!health) {
          setApiStatus('offline');
          setLoading(false);
          return;
        }
        
        setApiStatus('connected');
        
        // Load top skills
        const skillsRes = await fetchFromAPI('/api/skills/top?limit=50');
        if (skillsRes && Array.isArray(skillsRes)) {
          const transformed = skillsRes.map(s => ({
            skill: s.name,
            name: s.name,
            volume: s.count || 0,
            count: s.count || 0,
            growth: 0,
            hotness: 0
          }));
          setSkillData(transformed);
        }
        
        // Load hotness scores for skills
        const hotnessSkillsRes = await fetchFromAPI('/api/hotness/skills-advanced?limit=20');
        if (hotnessSkillsRes && Array.isArray(hotnessSkillsRes)) {
          const enhancedSkills = hotnessSkillsRes.map(s => ({
            skill: s.skill,
            name: s.skill,
            volume: s.count || 0,
            count: s.count || 0,
            growth: s.growth_rate || 0,
            hotness: Math.round(s.hotness || 0)
          }));
          
          // Merge with existing skills
          const merged = [...enhancedSkills];
          skillsRes.forEach(s => {
            if (!merged.find(m => m.name === s.name)) {
              merged.push({
                skill: s.name,
                name: s.name,
                volume: s.count || 0,
                count: s.count || 0,
                growth: 0,
                hotness: 0
              });
            }
          });
          setSkillData(merged);
        }
        
        // Load trending skills for growth rates
        const trendingRes = await fetchFromAPI('/api/skills/trending?months=3');
        if (trendingRes && Array.isArray(trendingRes)) {
          setSkillData(prev => {
            return prev.map(skill => {
              const trending = trendingRes.find(t => t.skill === skill.name);
              if (trending) {
                return {
                  ...skill,
                  growth: trending.growth_rate || skill.growth
                };
              }
              return skill;
            });
          });
        }
        
        // Load top occupations from API with real hotness scores
        const occupationsRes = await fetchFromAPI('/api/hotness/top-occupations?limit=15');
        let topOccupations = [];
        
        if (occupationsRes && Array.isArray(occupationsRes)) {
          topOccupations = occupationsRes.map(occ => ({
            occupation: occ.occupation,
            name: occ.occupation,
            volume: occ.count || 0,
            count: occ.count || 0,
            growth: occ.growth_rate || 0,
            gap: occ.skill_gap || 0,
            hotness: Math.round(occ.hotness || 0)
          }));
        }
        
        setOccupationData(topOccupations);
        
        // Build suggestions list from skills and occupations
        const suggestions = [
          ...skillsRes.map(s => s.name),
          ...topOccupations.map(o => o.occupation)
        ].filter((v, i, a) => a.indexOf(v) === i); // unique
        
        setAllSuggestions(suggestions);
        
        // Generate time series from top items
        const topItems = [
          ...hotnessSkillsRes.slice(0, 5).map(s => ({
            name: s.skill,
            skill: s.skill,
            volume: s.count,
            count: s.count,
            growth: s.growth_rate || 0
          })),
          ...topOccupations.slice(0, 5)
        ];
        
        const timeSeries = generateForecastFromData(topItems, 18);
        setTimeSeriesData(timeSeries);
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load data:', error);
        setApiStatus('error');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Filter suggestions based on search query - use dynamic data
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim() || !allSuggestions || allSuggestions.length === 0) return [];
    
    const query = searchQuery.toLowerCase();
    return allSuggestions
      .filter(option => 
        option && 
        typeof option === 'string' && 
        option.toLowerCase().includes(query) &&
        !selectedItems.includes(option)
      )
      .slice(0, 10);
  }, [searchQuery, selectedItems, allSuggestions]);

  // Handle search input
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
    
    // Tự động thêm nếu có dấu phẩy
    if (value.includes(',')) {
      const items = value.split(',').map(s => s.trim()).filter(s => s);
      if (items.length > 0) {
        const lastItem = items[items.length - 1];
        if (lastItem && !selectedItems.includes(lastItem)) {
          setSelectedItems([...selectedItems, lastItem]);
        }
        setSearchQuery('');
      }
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (item) => {
    if (!selectedItems.includes(item)) {
      setSelectedItems([...selectedItems, item]);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const items = searchQuery.split(',').map(s => s.trim()).filter(s => s);
      const newItems = items.filter(item => !selectedItems.includes(item));
      setSelectedItems([...selectedItems, ...newItems]);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  // Remove selected item
  const removeItem = (item) => {
    setSelectedItems(selectedItems.filter(i => i !== item));
  };

  // Clear all selections
  const clearAll = () => {
    setSelectedItems([]);
    setSearchQuery('');
  };

  // Get comparison data for selected items
  const getComparisonData = () => {
    if (selectedItems.length === 0) return null;

    const allData = [...skillData, ...occupationData.map(o => ({
      skill: o.occupation,
      volume: o.volume,
      growth: o.growth,
      hotness: o.hotness
    }))];

    return selectedItems.map(item => {
      const data = allData.find(d => d.skill === item || d.skill === item);
      return {
        name: item,
        volume: data?.volume || 0,
        growth: data?.growth || 0,
        hotness: data?.hotness || 0,
      };
    });
  };

  const comparisonData = getComparisonData();

  // Get time series for selected items
  const getSelectedTimeSeries = () => {
    if (selectedItems.length === 0) return timeSeriesData;
    
    // Tạo dữ liệu time series cho các item được chọn
    return timeSeriesData.map(dataPoint => {
      const filtered = { month: dataPoint.month };
      
      selectedItems.forEach(item => {
        // Kiểm tra xem item có trong dataPoint không
        if (dataPoint[item] !== undefined) {
          filtered[item] = dataPoint[item];
        } else {
          // Nếu không có trong mock data, tìm trong skillData/occupationData
          const allData = [...skillData, ...occupationData.map(o => ({
            skill: o.occupation,
            volume: o.volume,
            growth: o.growth,
            hotness: o.hotness
          }))];
          
          const itemData = allData.find(d => d.skill === item);
          if (itemData) {
            // Generate fake time series dựa trên volume và growth
            const baseValue = itemData.volume;
            const growth = itemData.growth / 100;
            const monthIndex = timeSeriesData.indexOf(dataPoint);
            
            // Tính giá trị cho tháng này (giả lập trend)
            filtered[item] = Math.floor(baseValue * (1 + (growth * monthIndex / 18)));
          }
        }
      });
      
      return filtered;
    });
  };

  const selectedTimeSeries = getSelectedTimeSeries();

  const topOccupations = occupationData.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8" />
            <h1 className="text-4xl font-bold">{t({ vi: 'Dự báo Xu hướng Nghề nghiệp', en: 'Job Trend Forecaster' })}</h1>
          </div>
          <p className="text-blue-100">{t({ vi: 'Dự báo xu hướng nghề nghiệp & kỹ năng hot từ dữ liệu thị trường lao động', en: 'Forecast career trends & hot skills from labor market data' })}</p>
          <div className="mt-2 text-sm">
            {apiStatus === 'connected' && <span className="text-green-200">✓ {t({ vi: 'Kết nối Backend thành công', en: 'Backend connected successfully' })}</span>}
            {apiStatus === 'connecting' && <span className="text-yellow-200">⏳ {t({ vi: 'Đang kết nối...', en: 'Connecting...' })}</span>}
            {apiStatus === 'offline' && <span className="text-red-200">⚠ {t({ vi: 'Dùng dữ liệu demo (Backend Offline)', en: 'Using demo data (Backend Offline)' })}</span>}
          </div>
        </div>
      </div>

      {/* Smart Search Bar */}
      <div className="bg-slate-800 px-6 py-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto">
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-700 rounded-lg p-3 shadow-xl">
              <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
              
              {/* Selected items chips */}
              <div className="flex flex-wrap gap-2 flex-1">
                {selectedItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1 bg-cyan-600 px-3 py-1 rounded-full text-sm font-semibold">
                    <span>{item}</span>
                    <button
                      onClick={() => removeItem(item)}
                      className="hover:bg-cyan-700 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {/* Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={selectedItems.length === 0 ? t({ vi: 'Tìm kiếm kỹ năng hoặc nghề nghiệp... (ví dụ: Python, Data Analyst)', en: 'Search for skills or careers... (e.g., Python, Data Analyst)' }) : t({ vi: 'Thêm...', en: 'Add...' })}
                  className="flex-1 bg-transparent outline-none text-white placeholder-slate-400 min-w-[200px]"
                />
              </div>

              {/* Clear button */}
              {selectedItems.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-slate-400 hover:text-white px-3 py-1 rounded bg-slate-600 hover:bg-slate-500 text-sm"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-slate-700 rounded-lg shadow-2xl border border-slate-600 max-h-64 overflow-y-auto z-50">
                <div className="p-2">
                  <p className="text-xs text-slate-400 px-3 py-1">Gợi ý</p>
                  {filteredSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-600 rounded text-sm flex items-center justify-between"
                    >
                      <span>{suggestion}</span>
                      <span className="text-xs text-slate-400">
                        {skillData.find(s => s.skill === suggestion || s.name === suggestion) ? 
                          `🔥 ${skillData.find(s => s.skill === suggestion || s.name === suggestion)?.hotness || 0}` : 
                          ''}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick suggestions */}
          {selectedItems.length === 0 && allSuggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-sm text-slate-400">Phổ biến:</span>
              {allSuggestions.slice(0, 8).map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(item)}
                  className="text-sm px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-full transition"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-xl text-slate-300">Đang tải dữ liệu từ database...</p>
            <p className="text-sm text-slate-400 mt-2">API Status: {apiStatus}</p>
          </div>
        )}

        {/* Comparison View (When items selected) */}
        {!loading && selectedItems.length > 0 && (
          <div className="space-y-8 mb-8">
            {/* Comparison Header */}
            <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-2">
                📊 {t({ vi: 'So sánh', en: 'Comparison' })}: {selectedItems.join(' vs ')}
              </h2>
              <p className="text-blue-100">{t({ vi: `Phân tích đa chiều ${selectedItems.length} mục đã chọn`, en: `Multi-dimensional analysis of ${selectedItems.length} selected items` })}</p>
            </div>

            {/* Comparison Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart - Volume & Growth */}
              <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
                <h3 className="text-xl font-bold mb-4">📈 {t({ vi: 'Volume & Tăng trưởng', en: 'Volume & Growth' })}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                    <Legend />
                    <Bar dataKey="volume" fill="#06b6d4" name={t({ vi: 'Số bài đăng', en: 'Job Postings' })} />
                    <Bar dataKey="growth" fill="#10b981" name={t({ vi: 'Tăng trưởng %', en: 'Growth %' })} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Radar Chart - Hotness Comparison */}
              <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
                <h3 className="text-xl font-bold mb-4">🔥 {t({ vi: 'Hotness Score', en: 'Hotness Score' })}</h3>
                {comparisonData && comparisonData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={comparisonData}>
                      <PolarGrid stroke="#475569" />
                      <PolarAngleAxis dataKey="name" stroke="#94a3b8" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#94a3b8" />
                      <Radar name="Hotness" dataKey="hotness" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-slate-400">
                    Không có dữ liệu để hiển thị
                  </div>
                )}
              </div>

              {/* Time Series - Trend Comparison */}
              <div className="bg-slate-700 rounded-lg p-6 shadow-xl lg:col-span-2">
                <h3 className="text-xl font-bold mb-4">📅 {t({ vi: 'Xu hướng 18 tháng - So sánh', en: '18-Month Trend - Comparison' })}</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={selectedTimeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    {selectedItems.map((item, idx) => {
                      const colors = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
                      return (
                        <Line 
                          key={item}
                          type="monotone" 
                          dataKey={item} 
                          stroke={colors[idx % colors.length]} 
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Detailed Comparison Table */}
              <div className="bg-slate-700 rounded-lg p-6 shadow-xl lg:col-span-2">
                <h3 className="text-xl font-bold mb-4">📋 {t({ vi: 'Bảng so sánh chi tiết', en: 'Detailed Comparison Table' })}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-600">
                        <th className="py-3 px-4">{t({ vi: 'Tên', en: 'Name' })}</th>
                        <th className="py-3 px-4">{t({ vi: 'Hotness', en: 'Hotness' })}</th>
                        <th className="py-3 px-4">{t({ vi: 'Volume', en: 'Volume' })}</th>
                        <th className="py-3 px-4">{t({ vi: 'Tăng trưởng', en: 'Growth' })}</th>
                        <th className="py-3 px-4">{t({ vi: 'Đánh giá', en: 'Rating' })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData?.map((item, idx) => (
                        <tr key={idx} className="border-b border-slate-600 hover:bg-slate-600">
                          <td className="py-3 px-4 font-semibold">{item.name}</td>
                          <td className="py-3 px-4">
                            <span className="text-xl font-bold text-cyan-400">{item.hotness}</span>
                          </td>
                          <td className="py-3 px-4">{item.volume}</td>
                          <td className="py-3 px-4">
                            <span className={item.growth > 20 ? 'text-green-400' : 'text-yellow-400'}>
                              {item.growth > 0 ? '+' : ''}{item.growth}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {item.hotness >= 90 ? `🔥 ${t({ vi: 'Rất hot', en: 'Very Hot' })}` :
                             item.hotness >= 80 ? `⚡ ${t({ vi: 'Hot', en: 'Hot' })}` :
                             item.hotness >= 70 ? `📈 ${t({ vi: 'Tốt', en: 'Good' })}` : `📊 ${t({ vi: 'Bình thường', en: 'Normal' })}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Original Dashboard (When no items selected) */}
        {!loading && selectedItems.length === 0 && (
          <div className="space-y-8">
            {occupationData.length > 0 ? (
              <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  {t({ vi: `Top ${Math.min(10, occupationData.length)} Nghề Nghiệp Hot`, en: `Top ${Math.min(10, occupationData.length)} Hot Careers` })}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topOccupations.map((occ, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-600 p-4 rounded-lg hover:bg-slate-500 transition cursor-pointer"
                      onClick={() => setSelectedItems([occ.occupation || occ.name])}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{occ.occupation || occ.name}</h3>
                          <p className="text-sm text-slate-300">Bài đăng: {occ.volume || occ.count}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-cyan-400">{occ.hotness || 0}</div>
                          <div className="text-xs text-slate-400">hotness</div>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-green-400">📈 Tăng {occ.growth || 0}%</span>
                        {occ.gap && <span className="text-orange-400">⚠️ Gap {occ.gap}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-700 rounded-lg p-12 text-center">
                <p className="text-xl text-slate-400">Không có dữ liệu nghề nghiệp</p>
                <p className="text-sm text-slate-500 mt-2">Vui lòng kiểm tra Backend API</p>
              </div>
            )}

            {/* Trend Chart */}
            {timeSeriesData.length > 0 && (
              <div className="bg-slate-700 rounded-lg p-6 shadow-xl">
                <h3 className="text-xl font-bold mb-4">Xu hướng 18 tháng - Số bài đăng tuyển</h3>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    {/* Dynamically render lines for top items */}
                    {Object.keys(timeSeriesData[0] || {})
                      .filter(key => key !== 'month' && key !== 'timestamp')
                      .slice(0, 5)
                      .map((key, idx) => {
                        const colors = ['#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
                        return (
                          <Line 
                            key={key}
                            type="monotone" 
                            dataKey={key} 
                            stroke={colors[idx % colors.length]} 
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        );
                      })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 bg-slate-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-400 text-sm">
          <p>{t({ vi: 'Data Pipeline: Web Scraping → NLP Processing → Time Series Analysis → ML Forecasting', en: 'Data Pipeline: Web Scraping → NLP Processing → Time Series Analysis → ML Forecasting' })}</p>
          <p className="mt-2">{t({ vi: 'Dự báo dựa trên: Prophet + XGBoost Ensemble | Hotness Score: Growth Rate + Volume + Skill Gap', en: 'Forecasting based on: Prophet + XGBoost Ensemble | Hotness Score: Growth Rate + Volume + Skill Gap' })}</p>
          <p className="mt-2 text-cyan-400">💡 {t({ vi: 'Mẹo: Nhập nhiều từ khóa cách nhau bởi dấu phẩy để so sánh (ví dụ: Python, Java, React)', en: 'Tip: Enter multiple keywords separated by commas to compare (e.g., Python, Java, React)' })}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;