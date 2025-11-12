"""
FastAPI Main Application
Simple backend for job forecaster demo
"""
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from contextlib import asynccontextmanager
from database import get_db, init_db
from models import Job, Company, Salary, Skill, JobSkill, Industry, Benefit
from forecasting import get_forecaster, get_hottest_skills, quick_forecast
from analytics import get_analytics
from datetime import datetime
import uvicorn

# Lifespan context manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    print("[OK] Database initialized")
    yield
    # Shutdown (if needed)
    print("[INFO] Shutting down...")

# Create FastAPI app
app = FastAPI(
    title="Job Forecaster API",
    description="API for job market analysis and forecasting",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # React default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# HEALTH CHECK
# ============================================

@app.get("/")
def root():
    return {
        "message": "Job Forecaster API",
        "status": "online",
        "version": "1.0.0"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }

# ============================================
# JOBS ENDPOINTS
# ============================================

@app.get("/api/jobs/search")
def search_jobs(
    query: Optional[str] = None,
    location: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Search jobs with filters"""
    
    jobs_query = db.query(Job).filter(Job.is_active == True)
    
    if query:
        jobs_query = jobs_query.filter(
            Job.title.ilike(f"%{query}%")
        )
    
    if location:
        jobs_query = jobs_query.filter(
            Job.location.ilike(f"%{location}%")
        )
    
    total = jobs_query.count()
    jobs = jobs_query.offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "results": [
            {
                "job_id": job.job_id,
                "title": job.title,
                "company_id": job.company_id,
                "location": job.location,
                "city": job.city,
                "state": job.state,
                "work_type": job.work_type
            }
            for job in jobs
        ]
    }

@app.get("/api/jobs/{job_id}")
def get_job_detail(job_id: str, db: Session = Depends(get_db)):
    """Get detailed job information"""
    
    job = db.query(Job).filter(Job.job_id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get salary
    salary = db.query(Salary).filter(Salary.job_id == job_id).first()
    
    # Get skills
    skills = db.query(Skill).join(JobSkill).filter(
        JobSkill.job_id == job_id
    ).all()
    
    # Get benefits
    benefits = db.query(Benefit).filter(Benefit.job_id == job_id).all()
    
    return {
        "job_id": job.job_id,
        "title": job.title,
        "description": job.description,
        "location": job.location,
        "city": job.city,
        "state": job.state,
        "work_type": job.work_type,
        "salary": {
            "min": salary.min_salary if salary else None,
            "max": salary.max_salary if salary else None,
            "median": salary.med_salary if salary else None,
            "period": salary.pay_period if salary else None
        } if salary else None,
        "skills": [{"name": s.skill_name, "code": s.skill_abr} for s in skills],
        "benefits": [{"type": b.type} for b in benefits]
    }

# ============================================
# SKILLS ENDPOINTS
# ============================================

@app.get("/api/skills/top")
def get_top_skills(
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db)
):
    """Get top skills by demand"""
    
    # Count jobs per skill
    skill_counts = db.query(
        Skill.skill_name,
        Skill.skill_abr,
        func.count(JobSkill.id).label('count')
    ).join(JobSkill).group_by(Skill.id).order_by(desc('count')).limit(limit).all()
    
    return [
        {
            "skill": skill.skill_name,
            "code": skill.skill_abr,
            "count": skill.count,
            "hotness": min(100, int(skill.count / 10))  # Simple hotness calculation
        }
        for skill in skill_counts
    ]

@app.get("/api/skills/trending")
def get_trending_skills(limit: int = 20, db: Session = Depends(get_db)):
    """Get trending skills (same as top for now)"""
    return get_top_skills(limit, db)

# ============================================
# SALARIES ENDPOINTS
# ============================================

@app.get("/api/salaries/by-skill")
def get_salaries_by_skill(
    skill: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get salary statistics by skill"""
    
    query = db.query(
        Skill.skill_name,
        func.avg(Salary.med_salary).label('avg_salary'),
        func.min(Salary.min_salary).label('min_salary'),
        func.max(Salary.max_salary).label('max_salary'),
        func.count(Salary.id).label('count')
    ).join(JobSkill, Skill.skill_abr == JobSkill.skill_abr)\
     .join(Salary, JobSkill.job_id == Salary.job_id)\
     .filter(Salary.med_salary.isnot(None))\
     .group_by(Skill.skill_name)
    
    if skill:
        query = query.filter(Skill.skill_name.ilike(f"%{skill}%"))
    
    results = query.order_by(desc('avg_salary')).limit(50).all()
    
    return [
        {
            "skill": r.skill_name,
            "avg_salary": round(r.avg_salary, 2) if r.avg_salary else None,
            "min_salary": r.min_salary,
            "max_salary": r.max_salary,
            "job_count": r.count
        }
        for r in results
    ]

@app.get("/api/salaries/statistics")
def get_salary_statistics(db: Session = Depends(get_db)):
    """Get overall salary statistics"""
    
    stats = db.query(
        func.avg(Salary.med_salary).label('avg'),
        func.min(Salary.min_salary).label('min'),
        func.max(Salary.max_salary).label('max'),
        func.count(Salary.id).label('count')
    ).filter(Salary.med_salary.isnot(None)).first()
    
    return {
        "average": round(stats.avg, 2) if stats.avg else None,
        "minimum": stats.min,
        "maximum": stats.max,
        "total_records": stats.count
    }

# ============================================
# COMPANIES ENDPOINTS
# ============================================

@app.get("/api/companies")
def get_companies(
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get all companies"""
    total = db.query(Company).count()
    companies = db.query(Company).offset(offset).limit(limit).all()
    
    return [
        {
            "company_id": c.company_id,
            "name": c.name,
            "description": c.description,
            "city": c.city,
            "state": c.state,
            "company_size": c.company_size,
            "employee_count": c.employee_count,
            "follower_count": c.follower_count,
            "url": c.url
        }
        for c in companies
    ]

@app.get("/api/companies/search")
def search_companies(
    query: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Search companies"""
    
    companies_query = db.query(Company)
    
    if query:
        companies_query = companies_query.filter(
            Company.name.ilike(f"%{query}%")
        )
    
    total = companies_query.count()
    companies = companies_query.offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "results": [
            {
                "company_id": c.company_id,
                "name": c.name,
                "location": f"{c.city}, {c.state}" if c.city and c.state else c.state,
                "company_size": c.company_size,
                "employee_count": c.employee_count
            }
            for c in companies
        ]
    }

@app.get("/api/companies/top-hiring")
def get_top_hiring_companies(limit: int = 20, db: Session = Depends(get_db)):
    """Get companies with most job postings"""
    
    results = db.query(
        Company.name,
        Company.company_id,
        Company.city,
        Company.state,
        func.count(Job.id).label('job_count')
    ).join(Job, Company.id == Job.company_id)\
     .group_by(Company.id)\
     .order_by(desc('job_count'))\
     .limit(limit).all()
    
    return [
        {
            "name": r.name,
            "company_id": r.company_id,
            "location": f"{r.city}, {r.state}" if r.city else r.state,
            "job_count": r.job_count
        }
        for r in results
    ]

@app.get("/api/companies/{company_id}")
def get_company_detail(company_id: str, db: Session = Depends(get_db)):
    """Get detailed information about a company"""
    company = db.query(Company).filter(Company.company_id == company_id).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Get jobs for this company
    jobs = db.query(Job).filter(Job.company_id == company.id).limit(10).all()
    
    return {
        "company_id": company.company_id,
        "name": company.name,
        "description": company.description,
        "city": company.city,
        "state": company.state,
        "country": company.country,
        "company_size": company.company_size,
        "employee_count": company.employee_count,
        "follower_count": company.follower_count,
        "url": company.url,
        "jobs": [
            {
                "job_id": j.job_id,
                "title": j.title,
                "location": j.location,
                "posted_date": j.posted_date.isoformat() if j.posted_date else None
            }
            for j in jobs
        ],
        "industries": [],
        "specialities": [],
        "employee_counts": []
    }

# ============================================
# ANALYTICS ENDPOINTS
# ============================================

@app.get("/api/analytics/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    """Get dashboard overview statistics"""
    
    total_jobs = db.query(func.count(Job.id)).filter(Job.is_active == True).scalar()
    total_companies = db.query(func.count(Company.id)).scalar()
    total_skills = db.query(func.count(Skill.id)).scalar()
    
    avg_salary = db.query(func.avg(Salary.med_salary)).filter(
        Salary.med_salary.isnot(None)
    ).scalar()
    
    return {
        "total_jobs": total_jobs,
        "total_companies": total_companies,
        "total_skills": total_skills,
        "average_salary": round(avg_salary, 2) if avg_salary else None
    }

@app.get("/api/hotness/top-skills")
def get_hotness_skills(limit: int = 20, db: Session = Depends(get_db)):
    """Get skills with hotness scores"""
    
    # Count and calculate hotness
    results = db.query(
        Skill.skill_name,
        func.count(JobSkill.id).label('count')
    ).join(JobSkill).group_by(Skill.id).order_by(desc('count')).limit(limit).all()
    
    # Calculate hotness score (simple version for demo)
    max_count = results[0].count if results else 1
    
    return [
        {
            "skill": r.skill_name,
            "count": r.count,
            "hotness": round((r.count / max_count) * 100, 1),
            "growth_rate": round(15 + (r.count / max_count) * 20, 1)  # Mock growth
        }
        for r in results
    ]

@app.get("/api/hotness/top-occupations")
def get_hotness_occupations(limit: int = 10, db: Session = Depends(get_db)):
    """Get occupations with hotness scores"""
    
    # Group by job title (simplified occupation)
    results = db.query(
        Job.title,
        func.count(Job.id).label('count')
    ).filter(Job.is_active == True)\
     .group_by(Job.title)\
     .order_by(desc('count'))\
     .limit(limit).all()
    
    max_count = results[0].count if results else 1
    
    return [
        {
            "occupation": r.title,
            "count": r.count,
            "hotness": round((r.count / max_count) * 100, 1),
            "growth_rate": round(10 + (r.count / max_count) * 25, 1),
            "skill_gap": round(30 + (r.count / max_count) * 40, 1)
        }
        for r in results
    ]

# ============================================
# BENEFITS ENDPOINTS
# ============================================

@app.get("/api/benefits/top")
def get_top_benefits(limit: int = 20, db: Session = Depends(get_db)):
    """Get most common benefits"""
    
    results = db.query(
        Benefit.type,
        func.count(Benefit.id).label('count')
    ).group_by(Benefit.type)\
     .order_by(desc('count'))\
     .limit(limit).all()
    
    return [
        {
            "benefit": r.type,
            "count": r.count
        }
        for r in results
    ]

# ============================================
# FORECASTING ENDPOINTS
# ============================================

@app.get("/api/forecast/skill/{skill_name}")
def forecast_skill(
    skill_name: str,
    periods: int = Query(6, ge=1, le=24),
    db: Session = Depends(get_db)
):
    """Forecast demand for a specific skill"""
    return quick_forecast(db, skill_name, periods)

@app.get("/api/forecast/top-skills")
def forecast_top_skills(
    limit: int = Query(10, le=20),
    periods: int = Query(6, ge=1, le=12),
    db: Session = Depends(get_db)
):
    """Forecast demand for top skills"""
    forecaster = get_forecaster(db)
    return forecaster.forecast_top_skills(limit, periods)

@app.get("/api/forecast/trending")
def get_trending_skills_forecast(
    limit: int = 20,
    min_growth: float = 10.0,
    db: Session = Depends(get_db)
):
    """Get trending skills with growth rates"""
    forecaster = get_forecaster(db)
    return forecaster.get_trending_skills(limit, min_growth)

@app.get("/api/hotness/skills-advanced")
def get_hottest_skills_advanced(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get hottest skills with detailed scores"""
    return get_hottest_skills(db, limit)

@app.get("/api/hotness/skill/{skill_name}")
def get_skill_hotness(skill_name: str, db: Session = Depends(get_db)):
    """Get hotness score for specific skill"""
    forecaster = get_forecaster(db)
    
    hotness = forecaster.calculate_hotness_score(skill_name)
    growth = forecaster.calculate_growth_rate(skill_name)
    
    # Get job count
    job_count = db.query(func.count(JobSkill.id))\
        .join(Skill)\
        .filter(Skill.skill_name == skill_name).scalar() or 0
    
    return {
        "skill": skill_name,
        "hotness_score": hotness,
        "growth_rate": growth,
        "job_count": job_count,
        "rating": "***" if hotness > 80 else "**" if hotness > 60 else "*"
    }

@app.get("/api/forecast/salary/{skill_name}")
def forecast_salary(
    skill_name: str,
    periods: int = Query(6, ge=1, le=12),
    db: Session = Depends(get_db)
):
    """Forecast salary trends for a skill"""
    forecaster = get_forecaster(db)
    return forecaster.predict_salary_trend(skill_name, periods)

# ============================================
# ADVANCED ANALYTICS ENDPOINTS
# ============================================

@app.get("/api/analytics/market-overview")
def get_market_overview_endpoint(db: Session = Depends(get_db)):
    """Get comprehensive market overview"""
    analytics = get_analytics(db)
    return analytics.get_market_overview()

@app.get("/api/analytics/industries")
def get_industry_breakdown_endpoint(
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db)
):
    """Get job distribution by industry"""
    analytics = get_analytics(db)
    return analytics.get_industry_breakdown(limit)

@app.get("/api/analytics/locations")
def get_location_insights_endpoint(
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db)
):
    """Get job market insights by location (states)"""
    analytics = get_analytics(db)
    return analytics.get_location_insights(limit)

@app.get("/api/analytics/cities")
def get_city_rankings_endpoint(
    limit: int = Query(30, le=100),
    db: Session = Depends(get_db)
):
    """Get top cities by job opportunities"""
    analytics = get_analytics(db)
    return analytics.get_city_rankings(limit)

@app.get("/api/analytics/skill-network")
def get_skill_network_endpoint(
    min_co_occurrence: int = Query(5, ge=1),
    db: Session = Depends(get_db)
):
    """Get skill relationship network for visualization"""
    analytics = get_analytics(db)
    return analytics.get_skill_network(min_co_occurrence)

@app.get("/api/analytics/skill-co-occurrence/{skill_name}")
def get_skill_co_occurrence_endpoint(
    skill_name: str,
    limit: int = Query(10, le=20),
    db: Session = Depends(get_db)
):
    """Get skills that commonly appear with given skill"""
    analytics = get_analytics(db)
    return analytics.get_skill_co_occurrence(skill_name, limit)

@app.get("/api/analytics/benefits")
def get_benefits_analysis_endpoint(db: Session = Depends(get_db)):
    """Get comprehensive benefits analysis"""
    analytics = get_analytics(db)
    return analytics.get_benefits_analysis()

@app.get("/api/analytics/companies")
def get_company_insights_endpoint(
    limit: int = Query(20, le=50),
    db: Session = Depends(get_db)
):
    """Get insights about top hiring companies"""
    analytics = get_analytics(db)
    return analytics.get_company_insights(limit)

@app.get("/api/analytics/salary-distribution")
def get_salary_distribution_endpoint(
    skill: Optional[str] = None,
    bins: int = Query(10, ge=5, le=20),
    db: Session = Depends(get_db)
):
    """Get salary distribution (histogram)"""
    analytics = get_analytics(db)
    return analytics.get_salary_distribution(skill, bins)

@app.post("/api/analytics/compare-skills")
def compare_skills_endpoint(
    skills: List[str],
    db: Session = Depends(get_db)
):
    """Compare multiple skills across metrics"""
    if len(skills) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 skills allowed")
    
    analytics = get_analytics(db)
    return analytics.compare_skills(skills)

# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    print("[INFO] Starting Job Forecaster API...")
    print("[INFO] Server: http://localhost:8000")
    print("[INFO] Docs: http://localhost:8000/docs")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
