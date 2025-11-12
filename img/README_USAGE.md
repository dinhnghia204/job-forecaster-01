# 🚀 Hướng Dẫn Chạy Ứng Dụng Job Forecaster

## 📋 Mục Lục
1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Cài Đặt & Chạy Backend](#cài-đặt--chạy-backend)
3. [Cài Đặt & Chạy Frontend](#cài-đặt--chạy-frontend)
4. [Các Trang Web Có Sẵn](#các-trang-web-có-sẵn)
5. [API Endpoints](#api-endpoints)
6. [Troubleshooting](#troubleshooting)

---

## 🖥️ Yêu Cầu Hệ Thống

### Backend
- **Python**: 3.10+
- **SQLite**: Included in Python
- **RAM**: 4GB minimum (8GB recommended)

### Frontend
- **Node.js**: 16.x or 18.x
- **npm**: 8.x+
- **Browser**: Chrome, Firefox, Edge (latest versions)

---

## 🔧 Cài Đặt & Chạy Backend

### Bước 1: Điều hướng vào thư mục backend
```bash
cd f:\STUDY\N_4\K_1\Chuyen_doi_so\du_bao\backend
```

### Bước 2: Tạo Virtual Environment (khuyến nghị)
```bash
python -m venv venv
.\venv\Scripts\activate  # Windows PowerShell
```

### Bước 3: Cài đặt dependencies
```bash
pip install -r requirements.txt
```

**Dependencies chính:**
- FastAPI 0.115.0
- SQLAlchemy 2.0.36
- pandas 2.2.3
- prophet 1.1.6
- numpy 1.26.4
- uvicorn 0.32.1

### Bước 4: Load dữ liệu vào Database (chỉ lần đầu)
```bash
python etl_load_data.py
```

**Lưu ý:** 
- Quá trình này mất khoảng 5-10 phút
- Sẽ tạo file `job_forecaster.db` (~100MB)
- Load ~50,000 jobs, 10,000 companies, 40,000 salaries

### Bước 5: Chạy API Server
```bash
python main.py
```

hoặc dùng uvicorn trực tiếp:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Backend sẽ chạy tại:** `http://localhost:8000`

---

## 🎨 Cài Đặt & Chạy Frontend

### Bước 1: Điều hướng vào thư mục frontend
```bash
cd f:\STUDY\N_4\K_1\Chuyen_doi_so\du_bao\frontend
```

### Bước 2: Cài đặt dependencies
```bash
npm install
```

**Dependencies chính:**
- React 19.2.0
- React Router DOM 7.9.5
- Recharts 3.2.1
- Tailwind CSS 4.1.14
- Lucide React 0.545.0

### Bước 3: Chạy Development Server
```bash
npm start
```

**Frontend sẽ tự động mở tại:** `http://localhost:3000`

---

## 📱 Các Trang Web Có Sẵn

### 1. **Dashboard** (`/`)
- **Mô tả:** Trang chính với tổng quan Top 10 nghề nghiệp/kỹ năng hot
- **Features:**
  - Search & comparison (tối đa 4 items)
  - 18-month trend charts
  - Multi-dimensional comparison (Radar, Bar, Line charts)
  - Detailed comparison table

### 2. **Job Search** (`/job-search`)
- **Mô tả:** Tìm kiếm công việc với bộ lọc
- **Features:**
  - Search by job title, skills
  - Filter by location
  - Pagination (20 jobs/page)
  - Job detail sidebar với skills, salary, benefits

### 3. **Companies** (`/companies`)
- **Mô tả:** Danh bạ công ty và thống kê tuyển dụng
- **Features:**
  - Top 10 Hiring Companies chart
  - Company search
  - Company detail view (industries, specialities, employee count, job openings)

### 4. **Market Trends** (`/market-trends`)
- **Mô tả:** Phân tích xu hướng thị trường
- **Features:**
  - Key metrics cards (Total Jobs, Skills, Avg Salary, Cities)
  - Industry breakdown (Bar & Pie charts)
  - Top 15 cities by job count
  - Salary distribution histogram

### 5. **Skills Analytics** (`/skills-analytics`)
- **Mô tả:** Phân tích kỹ năng với ML forecasting
- **Features:**
  - Search & filter by hotness/growth/volume
  - Top 15 skills hotness chart
  - Skills grid with click selection
  - 12-month Prophet forecast
  - Salary distribution
  - Trending skills section (growth > 10%)

### 6. **Salary Insights** (`/salary-insights`)
- **Mô tả:** Phân tích mức lương theo nhiều chiều
- **Features:**
  - Salary by skill (with experience levels)
  - Career progression path (Entry → Senior → Lead)
  - Top cities with cost-of-living adjustment
  - Nominal vs Adjusted salary comparison
  - Key insights cards

---

## 🔌 API Endpoints

### Health Check
```
GET /api/health
```

### Jobs
```
GET /api/jobs/search?query=Python&location=California&limit=20&offset=0
GET /api/jobs/{job_id}
GET /api/jobs/random?limit=10
```

### Skills
```
GET /api/skills/top?limit=20
GET /api/skills/trending?months=3
GET /api/skills/{skill_name}
```

### Companies
```
GET /api/companies?limit=50
GET /api/companies/search?query=Google
GET /api/companies/{company_id}
GET /api/companies/top-hiring?limit=20
```

### Forecasting (Prophet ML Model)
```
GET /api/forecast/skill/{skill_name}?months=12
GET /api/forecast/top-skills?limit=15
GET /api/forecast/trending?growth_threshold=10
```

### Analytics
```
GET /api/analytics/market-overview
GET /api/analytics/industries?limit=10
GET /api/analytics/cities?limit=15
GET /api/analytics/salary-distribution
GET /api/analytics/skills/co-occurrence?skill=Python
GET /api/analytics/skills/network?min_connections=5
```

### Hotness Score
```
GET /api/hotness/skills-advanced?limit=20
GET /api/hotness/skill/{skill_name}
GET /api/hotness/top-occupations?limit=10
```

---

## ⚠️ Troubleshooting

### Backend không chạy được

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`
```bash
# Solution: Install dependencies
pip install -r requirements.txt
```

**Problem:** `sqlalchemy.exc.OperationalError: no such table: jobs`
```bash
# Solution: Run ETL to create database
python etl_load_data.py
```

**Problem:** Prophet installation error
```bash
# Solution: Install Prophet dependencies on Windows
pip install pystan==2.19.1.1
pip install prophet
```

### Frontend không chạy được

**Problem:** `Cannot find module 'react-router-dom'`
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Problem:** Tailwind CSS không hiển thị styles
```bash
# Solution: Rebuild Tailwind
npm run build:css
npm start
```

**Problem:** CORS error khi gọi API
- Kiểm tra Backend đã chạy tại `http://localhost:8000`
- Kiểm tra CORS middleware trong `backend/main.py`:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["http://localhost:3000", "http://localhost:3001"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

### Database Issues

**Problem:** Database file quá lớn
```bash
# Solution: Load ít data hơn
# Sửa trong etl_load_data.py:
load_jobs_sample(session, limit=10000)  # Thay vì 50000
```

**Problem:** Slow queries
```bash
# Solution: Tạo indexes
# Đã có sẵn trong models.py:
# - Index on jobs.title
# - Index on jobs.location
# - Index on skills.name
```

---

## 📊 Kiểm Tra Ứng Dụng Đang Chạy

### Backend Health Check
```bash
curl http://localhost:8000/api/health
# Response: {"status": "ok", "database": "connected", ...}
```

### Frontend Check
- Mở browser: `http://localhost:3000`
- Nếu thấy Navigation bar với 6 links → OK
- Click vào từng trang để test routing

### API Test
```bash
# Test jobs endpoint
curl "http://localhost:8000/api/jobs/search?limit=5"

# Test skills endpoint
curl "http://localhost:8000/api/skills/top?limit=10"

# Test forecast endpoint
curl "http://localhost:8000/api/forecast/skill/Python"
```

---

## 📚 Tech Stack Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| **Backend Framework** | FastAPI | 0.115.0 |
| **Database** | SQLite | 3.x |
| **ML Forecasting** | Prophet | 1.1.6 |
| **ORM** | SQLAlchemy | 2.0.36 |
| **Server** | Uvicorn | 0.32.1 |
| **Frontend Framework** | React | 19.2.0 |
| **Routing** | React Router | 7.9.5 |
| **Charts** | Recharts | 3.2.1 |
| **Styling** | Tailwind CSS | 4.1.14 |
| **Icons** | Lucide React | 0.545.0 |

---

## 🎓 Về Project Này

**Tên đề tài:** Dự báo xu hướng nghề nghiệp hot từ dữ liệu thị trường lao động

**Môn học:** Chuyển đổi số

**Dữ liệu:** LinkedIn Job Postings (500K+ records)

**ML Model:** Facebook Prophet (Time Series Forecasting)

**Hotness Algorithm:** 
```
Hotness = 0.3×Volume + 0.3×Growth + 0.2×Salary + 0.2×Demand
```

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. ✅ Python 3.10+ đã cài
2. ✅ Node.js 16+ đã cài
3. ✅ Backend đang chạy tại port 8000
4. ✅ Frontend đang chạy tại port 3000
5. ✅ Database file `job_forecaster.db` tồn tại
6. ✅ Không có process nào đang chiếm port 8000/3000

**Happy Forecasting! 🚀**
