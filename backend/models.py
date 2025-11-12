"""
Database Models
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    company_id = Column(Integer, ForeignKey("companies.id"))
    location = Column(String)
    city = Column(String)
    state = Column(String)
    country = Column(String)
    posted_date = Column(DateTime)
    expire_date = Column(DateTime, nullable=True)
    work_type = Column(String, nullable=True)  # Remote, Hybrid, Onsite
    is_active = Column(Boolean, default=True)
    
    # Relationships
    company = relationship("Company", back_populates="jobs")
    salaries = relationship("Salary", back_populates="job")
    job_skills = relationship("JobSkill", back_populates="job")
    benefits = relationship("Benefit", back_populates="job")


class Company(Base):
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(String, unique=True, index=True)
    name = Column(String, index=True)
    description = Column(Text, nullable=True)
    company_size = Column(Integer, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    zip_code = Column(String, nullable=True)
    address = Column(String, nullable=True)
    url = Column(String, nullable=True)
    employee_count = Column(Integer, nullable=True)
    follower_count = Column(Integer, nullable=True)
    
    # Relationships
    jobs = relationship("Job", back_populates="company")
    industries = relationship("CompanyIndustry", back_populates="company")


class Salary(Base):
    __tablename__ = "salaries"
    
    id = Column(Integer, primary_key=True, index=True)
    salary_id = Column(String, unique=True, index=True)
    job_id = Column(String, ForeignKey("jobs.job_id"))
    max_salary = Column(Float, nullable=True)
    med_salary = Column(Float, nullable=True)
    min_salary = Column(Float, nullable=True)
    pay_period = Column(String, nullable=True)  # HOURLY, YEARLY
    currency = Column(String, nullable=True)
    compensation_type = Column(String, nullable=True)
    
    # Relationships
    job = relationship("Job", back_populates="salaries")


class Skill(Base):
    __tablename__ = "skills"
    
    id = Column(Integer, primary_key=True, index=True)
    skill_abr = Column(String, unique=True, index=True)
    skill_name = Column(String, index=True)
    
    # Relationships
    job_skills = relationship("JobSkill", back_populates="skill")


class JobSkill(Base):
    __tablename__ = "job_skills"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.job_id"))
    skill_abr = Column(String, ForeignKey("skills.skill_abr"))
    
    # Relationships
    job = relationship("Job", back_populates="job_skills")
    skill = relationship("Skill", back_populates="job_skills")


class Industry(Base):
    __tablename__ = "industries"
    
    id = Column(Integer, primary_key=True, index=True)
    industry_id = Column(Integer, unique=True, index=True)
    industry_name = Column(String, index=True)
    
    # Relationships
    job_industries = relationship("JobIndustry", back_populates="industry")


class JobIndustry(Base):
    __tablename__ = "job_industries"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.job_id"))
    industry_id = Column(Integer, ForeignKey("industries.industry_id"))
    
    # Relationships
    industry = relationship("Industry", back_populates="job_industries")


class CompanyIndustry(Base):
    __tablename__ = "company_industries"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(String, ForeignKey("companies.company_id"))
    industry = Column(String)  # Industry name as string
    
    # Relationships
    company = relationship("Company", back_populates="industries")
    # Note: No relationship to Industry table since we store industry name directly


class Benefit(Base):
    __tablename__ = "benefits"
    
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, ForeignKey("jobs.job_id"))
    type = Column(String)
    inferred = Column(Boolean, default=False)
    
    # Relationships
    job = relationship("Job", back_populates="benefits")


# Analytics Tables for caching computed results
class SkillTrend(Base):
    __tablename__ = "skill_trends"
    
    id = Column(Integer, primary_key=True, index=True)
    skill_name = Column(String, index=True)
    month = Column(String)  # YYYY-MM format
    job_count = Column(Integer)
    growth_rate = Column(Float)
    hotness_score = Column(Float)
    avg_salary = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)


class OccupationTrend(Base):
    __tablename__ = "occupation_trends"
    
    id = Column(Integer, primary_key=True, index=True)
    occupation = Column(String, index=True)
    month = Column(String)
    job_count = Column(Integer)
    growth_rate = Column(Float)
    skill_gap = Column(Float)
    hotness_score = Column(Float)
    avg_salary = Column(Float, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)
