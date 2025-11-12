import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './LanguageContext';
import Navigation from './Navigation';
import Dashboard from './Dashboard';
import JobSearch from './JobSearch';
import CompanyDirectory from './CompanyDirectory';
import MarketTrends from './MarketTrends';
import SkillsAnalytics from './SkillsAnalytics';
import SalaryInsights from './SalaryInsights';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/job-search" element={<JobSearch />} />
          <Route path="/companies" element={<CompanyDirectory />} />
          <Route path="/market-trends" element={<MarketTrends />} />
          <Route path="/skills-analytics" element={<SkillsAnalytics />} />
          <Route path="/salary-insights" element={<SalaryInsights />} />
        </Routes>
      </div>
    </LanguageProvider>
  );
}

export default App;
