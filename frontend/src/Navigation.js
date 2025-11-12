import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Search, Building2, TrendingUp, BarChart3, DollarSign, Globe } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const Navigation = () => {
  const { language, toggleLanguage, t } = useLanguage();
  
  const navItems = [
    { 
      path: '/', 
      icon: Home, 
      label: t({ vi: 'Trang chủ', en: 'Dashboard' })
    },
    { 
      path: '/job-search', 
      icon: Search, 
      label: t({ vi: 'Tìm việc', en: 'Job Search' })
    },
    { 
      path: '/companies', 
      icon: Building2, 
      label: t({ vi: 'Công ty', en: 'Companies' })
    },
    { 
      path: '/market-trends', 
      icon: TrendingUp, 
      label: t({ vi: 'Xu hướng', en: 'Market Trends' })
    },
    { 
      path: '/skills-analytics', 
      icon: BarChart3, 
      label: t({ vi: 'Kỹ năng', en: 'Skills Analytics' })
    },
    { 
      path: '/salary-insights', 
      icon: DollarSign, 
      label: t({ vi: 'Lương', en: 'Salary Insights' })
    },
  ];

  return (
    <nav className="bg-slate-800 border-b border-slate-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold text-white">
              {t({ vi: 'Dự báo Nghề nghiệp', en: 'Job Forecaster' })}
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    isActive
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
            
            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-4 py-2 ml-2 rounded-lg transition bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white"
              title={t({ vi: 'Chuyển sang tiếng Anh', en: 'Switch to Vietnamese' })}
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium">{language === 'vi' ? 'EN' : 'VI'}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
