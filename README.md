<h2 align="center">
    <a href="https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin">
    🎓 Faculty of Information Technology (DaiNam University)
    </a>
</h2>

<h2 align="center">
     DỰ BÁO XU HƯỚNG NGHỀ NGHIỆP HOT
</h2>

<div align="center">
    <p align="center">
        <img alt="AIoTLab Logo" width="170" src="https://github.com/user-attachments/assets/711a2cd8-7eb4-4dae-9d90-12c0a0a208a2" />
        <img alt="AIoTLab Logo" width="180" src="https://github.com/user-attachments/assets/dc2ef2b8-9a70-4cfa-9b4b-f6c2f25f1660" />
        <img alt="DaiNam University Logo" width="200" src="https://github.com/user-attachments/assets/77fe0fd1-2e55-4032-be3c-b1a705a1b574" />
    </p>

[![AIoTLab](https://img.shields.io/badge/AIoTLab-green?style=for-the-badge)](https://www.facebook.com/DNUAIoTLab)
[![Faculty of Information Technology](https://img.shields.io/badge/Faculty%20of%20Information%20Technology-blue?style=for-the-badge)](https://dainam.edu.vn/vi/khoa-cong-nghe-thong-tin)
[![DaiNam University](https://img.shields.io/badge/DaiNam%20University-orange?style=for-the-badge)](https://dainam.edu.vn)
</div>

# 🎓 DỰ ÁN: DỰ BÁO XU HƯỚNG NGHỀ NGHIỆP HOT

**Môn học**: Chuyển đổi số  
**Nhóm 18**
**Sinh viên**: 
[Phạm Đình Nghĩa -1671020222]  
[Nguyễn Tiến Thái - 1671020288]
**Thời gian**: 12-15 ngày

---

## 📖 MỤC LỤC

1. [Tổng quan dự án](#tổng-quan)
2. [Quick Start](#quick-start)
3. [Kiến trúc hệ thống](#kiến-trúc)
4. [Chức năng chính](#chức-năng)
5. [Công nghệ sử dụng](#công-nghệ)
6. [Tiến độ thực hiện](#tiến-độ)
7. [Hướng dẫn sử dụng](#hướng-dẫn)

---

## 🎯 TỔNG QUAN

### Mục tiêu dự án:
Xây dựng hệ thống **dự báo xu hướng nghề nghiệp hot** từ dữ liệu thị trường lao động thực tế, sử dụng Machine Learning và Data Analytics.

### Giá trị mang lại:
- **Cho người tìm việc**: Xác định skills cần học, nghề hot, mức lương kỳ vọng
- **Cho doanh nghiệp**: Phân tích thị trường, cạnh tranh, xu hướng tuyển dụng
- **Cho nhà tuyển dụng**: Insights về skill demand, salary benchmarking
- **Cho giáo dục**: Định hướng chương trình đào tạo theo nhu cầu thị trường

### Data Source:
- **500,000+** job postings từ LinkedIn
- **140,000+** companies
- **37** skill categories
- **424** industries
- Salary, benefits, location data

---

## ⚡ QUICK START

### Yêu cầu hệ thống:
- Python 3.10+
- Node.js 18+
- 4GB RAM minimum
- 2GB disk space


### Chạy dự án (3 bước):

Tải data ở đây : https://drive.google.com/drive/folders/1OkHXUeHBbXsKS_Dz76amCgz6koc5EsZr?usp=drive_link 

---
```powershell
# 1. Backend
cd backend
pip install -r requirements.txt
python etl_load_data.py  # Load data (5-10 phút)
python main.py           # Start API

# 2. Frontend (terminal mới)
cd frontend
npm install
npm start

# 3. Open browser
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

Chi tiết xem: [QUICK_START.md](./QUICK_START.md)

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

### High-level Architecture:

```
┌─────────────────────────────────────────────┐
│         PRESENTATION LAYER                  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   React Frontend (Port 3000)         │  │
│  │   - Dashboard                        │  │
│  │   - Job Search                       │  │
│  │   - Skills Analytics                 │  │
│  │   - Salary Insights                  │  │
│  │   - Admin Panel                      │  │
│  └──────────────┬───────────────────────┘  │
└─────────────────┼───────────────────────────┘
                  │ REST API (JSON)
┌─────────────────▼───────────────────────────┐
│         APPLICATION LAYER                   │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   FastAPI Backend (Port 8000)        │  │
│  │   - RESTful APIs                     │  │
│  │   - Business Logic                   │  │
│  │   - ML Models                        │  │
│  │   - Analytics Engine                 │  │
│  └──────────────┬───────────────────────┘  │
└─────────────────┼───────────────────────────┘
                  │ SQLAlchemy ORM
┌─────────────────▼───────────────────────────┐
│         DATA LAYER                          │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   SQLite Database                    │  │
│  │   - Jobs, Companies, Skills          │  │
│  │   - Salaries, Benefits               │  │
│  │   - Cached Analytics                 │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   CSV Data Files (Raw)               │  │
│  │   - postings.csv (500K+ records)     │  │
│  │   - companies.csv (140K+ records)    │  │
│  │   - jobs/, mappings/                 │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Technology Stack:

**Frontend**:
- React 19.2 (UI framework)
- Recharts 3.2 (Data visualization)
- Tailwind CSS 4.1 (Styling)
- Lucide React (Icons)
- React Router (Navigation)

**Backend**:
- FastAPI 0.115 (Web framework)
- SQLAlchemy 2.0 (ORM)
- Pandas 2.2 (Data processing)
- Prophet 1.1 (Time series forecasting)
- Scikit-learn 1.5 (ML algorithms)

**Database**:
- SQLite (Development)
- PostgreSQL (Production ready - optional)

**ML/AI**:
- Prophet (Facebook's forecasting tool)
- ARIMA/SARIMA (Statistical forecasting)
- Scikit-learn (Classification, clustering)
- NLP processing (Skill extraction)

---

## 🎯 CHỨC NĂNG CHÍNH

### 1. DASHBOARD CHÍNH ✅
- Top 10 nghề nghiệp hot (Hotness Score)
- Xu hướng 18 tháng (Time series)
- So sánh skills/occupations
- Smart search với suggestions
- Interactive charts

### 2. SALARY INSIGHTS ✅
- Phân tích lương theo skills
- Career progression (Entry → Senior → Lead)
- Top cities với CoL adjustment
- Salary comparison charts
- Experience level breakdown

### 3. JOB SEARCH & FILTER ⏳
- Advanced search engine
- Multi-criteria filters:
  - Skills, location, salary range
  - Company size, benefits
  - Work type (remote/hybrid)
- Job listing với pagination
- Job detail view
- Save/bookmark jobs

### 4. SKILLS ANALYTICS ⏳
- Top trending skills
- Skill demand forecast
- Skills relationship network
- Skills vs Salary analysis
- Learning path recommendations

### 5. COMPANY DIRECTORY ⏳
- Company search & browse
- Company profiles với metrics
- Top hiring companies
- Company comparison tool
- Industry breakdown

### 6. MARKET TRENDS ⏳
- Industry overview dashboard
- Location heatmap (salary by city)
- Hiring trends timeline
- Growth predictions
- Hot vs declining sectors

### 7. BENEFITS ANALYSIS ⏳
- Benefits catalog
- Most common benefits by industry
- Companies with best benefits
- Benefits vs Salary correlation

### 8. CAREER PATH PLANNER ⏳
- Current skills assessment
- Target job selection
- Skill gap analysis
- Learning roadmap generator
- Salary growth projection

### 9. ADMIN PANEL ⏳
- System overview dashboard
- Data management (CRUD)
- ETL monitoring
- Analytics & reports
- Settings & configuration

---

## 📊 ML/AI FEATURES

### 1. Time Series Forecasting
**Algorithm**: Prophet (Facebook)
- Forecast skill demand 6-12 months
- Predict job market trends
- Seasonal pattern detection
- Holiday effects handling

### 2. Hotness Score Algorithm
```python
Hotness = α × (Job_Volume) + 
          β × (Growth_Rate) + 
          γ × (Salary_Premium) + 
          δ × (Skill_Gap)
```

Where:
- Job_Volume: Số lượng jobs yêu cầu skill/occupation
- Growth_Rate: Tốc độ tăng trưởng (%)
- Salary_Premium: Mức lương cao hơn trung bình
- Skill_Gap: Chênh lệch giữa demand và supply

### 3. Recommendation Engine
- Collaborative filtering
- Content-based filtering
- Hybrid approach
- Personalized job matching

### 4. NLP Processing
- Job description analysis
- Skill extraction from text
- Sentiment analysis
- Keyword clustering

---

## 📁 CẤU TRÚC PROJECT

```
du_bao/
├── backend/
│   ├── main.py                 # FastAPI app
│   ├── database.py             # Database config
│   ├── models.py               # SQLAlchemy models
│   ├── etl_load_data.py        # ETL pipeline
│   ├── forecasting.py          # ML models (TODO)
│   ├── analytics.py            # Analytics (TODO)
│   ├── requirements.txt        # Python packages
│   ├── README.md               # Backend guide
│   └── job_forecaster.db       # SQLite database (generated)
│
├── frontend/
│   ├── src/
│   │   ├── App.js              # Main dashboard ✅
│   │   ├── SalaryInsights.js   # Salary page ✅
│   │   ├── JobSearch.js        # Job search (TODO)
│   │   ├── SkillsAnalytics.js  # Skills page (TODO)
│   │   ├── CompanyDirectory.js # Company page (TODO)
│   │   ├── MarketTrends.js     # Trends page (TODO)
│   │   ├── BenefitsAnalysis.js # Benefits (TODO)
│   │   ├── CareerPlanner.js    # Career path (TODO)
│   │   └── admin/              # Admin panel (TODO)
│   ├── package.json
│   └── README.md
│
├── data/
│   └── raw/
│       ├── postings.csv        # 500K+ jobs
│       ├── companies/          # Company data
│       ├── jobs/               # Skills, salaries, benefits
│       └── mappings/           # Skills, industries
│
├── PROJECT_ROADMAP.md          # Full roadmap ✅
├── QUICK_START.md              # Quick start guide ✅
├── PROGRESS_CHECKLIST.md       # Progress tracker ✅
└── README.md                   # This file ✅
```

---


---

## 📚 HƯỚNG DẪN SỬ DỤNG

### Cho người dùng (End User):

1. **Tìm nghề hot**:
   - Mở Dashboard → Xem Top 10 occupations
   - Click vào occupation → Xem details

2. **So sánh skills**:
   - Dùng Search bar → Nhập "Python, JavaScript, React"
   - Xem comparison charts
   - Analyze growth trends

3. **Phân tích lương**:
   - Click "Salary Insights"
   - Chọn skill/occupation
   - Xem salary by experience level
   - Compare cities

4. **Tìm việc làm**:
   - Click "Job Search"
   - Apply filters (skills, location, salary)
   - Browse results
   - View job details


---

## 📞 CONTACT & SUPPORT

**Sinh viên**: [Tên của bạn]  
**Email**: [Email của bạn]  
**GitHub**: [GitHub link]

**Giảng viên hướng dẫn**: [Tên GV]  
**Môn học**: Chuyển đổi số  
**Học kỳ**: [HK/Năm]

---

## 📜 LICENSE

This project is created for educational purposes (Bài tập lớn môn Chuyển đổi số).

---

## 🙏 ACKNOWLEDGMENTS

- **Data Source**: LinkedIn Job Postings Dataset
- **Frameworks**: React, FastAPI, Prophet
- **Libraries**: Recharts, Tailwind CSS, SQLAlchemy
- **Inspiration**: Real-world job market analytics platforms

---

## 🚀 GET STARTED NOW!

```powershell
# Clone project (if needed)
cd f:\STUDY\N_4\K_1\Chuyen_doi_so\du_bao

# Follow quick start guide
# See: QUICK_START.md

# Track your progress
# See: PROGRESS_CHECKLIST.md

# Full roadmap
# See: PROJECT_ROADMAP.md
```

**Happy coding!** 💪🚀
