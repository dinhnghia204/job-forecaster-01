# 🚀 HƯỚNG DẪN CHẠY BACKEND

## Bước 1: Cài đặt Python packages

```powershell
cd backend
pip install -r requirements.txt
```

## Bước 2: Load dữ liệu từ CSV vào Database

```powershell
python etl_load_data.py
```

⏱️ **Lưu ý**: Quá trình này có thể mất 5-10 phút vì phải load nhiều dữ liệu.

Sau khi chạy xong, bạn sẽ thấy file `job_forecaster.db` được tạo ra.

## Bước 3: Chạy API Server

```powershell
python main.py
```

Server sẽ chạy tại: **http://localhost:8000**

API Documentation: **http://localhost:8000/docs** (Swagger UI tự động)

## Bước 4: Test API

Mở trình duyệt và test các endpoint:

- http://localhost:8000/ - Health check
- http://localhost:8000/api/health
- http://localhost:8000/api/analytics/overview
- http://localhost:8000/api/skills/top
- http://localhost:8000/api/hotness/top-skills
- http://localhost:8000/api/hotness/top-occupations

## API Endpoints có sẵn:

### Jobs
- `GET /api/jobs/search` - Tìm kiếm jobs
- `GET /api/jobs/{job_id}` - Chi tiết job

### Skills
- `GET /api/skills/top` - Top skills by demand
- `GET /api/skills/trending` - Trending skills

### Salaries
- `GET /api/salaries/by-skill` - Lương theo skill
- `GET /api/salaries/statistics` - Thống kê lương

### Companies
- `GET /api/companies/search` - Tìm kiếm công ty
- `GET /api/companies/top-hiring` - Top hiring companies

### Analytics
- `GET /api/analytics/overview` - Tổng quan
- `GET /api/hotness/top-skills` - Skills hotness score
- `GET /api/hotness/top-occupations` - Occupations hotness

### Benefits
- `GET /api/benefits/top` - Top benefits

## Troubleshooting

### Lỗi: "postings.csv too large"
- Giảm `max_rows` trong `etl_load_data.py` (dòng 116) xuống 20000 hoặc 10000

### Lỗi: "Module not found"
- Chạy lại: `pip install -r requirements.txt`

### Lỗi: "Database locked"
- Đóng tất cả connections cũ
- Xóa file `job_forecaster.db` và chạy lại ETL

## Lưu ý quan trọng:

1. **Database**: Đang dùng SQLite (file `job_forecaster.db`) - đơn giản, không cần cài PostgreSQL
2. **Data**: Load ~50,000 jobs + 10,000 companies (đủ cho demo, không quá chậm)
3. **CORS**: Đã enable cho port 3000 và 3001 (React frontend)
4. **Swagger Docs**: Tự động tạo tại `/docs` - rất tiện để test API

## Next Steps:

Sau khi backend chạy được, bước tiếp theo là:
1. Update frontend để connect với backend thật (thay vì mock data)
2. Tạo thêm các pages: Job Search, Company Directory, Skills Analytics
3. Tạo Admin panel
