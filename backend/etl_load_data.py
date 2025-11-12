"""
ETL Script - Load CSV data into SQLite Database
Run this once to populate the database
"""
import pandas as pd
import os
from sqlalchemy.orm import Session
from database import engine, init_db, SessionLocal
from models import (
    Job, Company, Salary, Skill, JobSkill, 
    Industry, JobIndustry, CompanyIndustry, Benefit
)
from datetime import datetime
import time

# Path to data folder
DATA_PATH = "../data/raw"

def load_companies(db: Session):
    """Load companies from CSV"""
    print("📦 Loading companies...")
    
    file_path = os.path.join(DATA_PATH, "companies/companies.csv")
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return
    
    df = pd.read_csv(file_path, nrows=10000)  # Limit for demo
    
    companies = []
    for _, row in df.iterrows():
        company = Company(
            company_id=str(row['company_id']),
            name=row.get('name'),
            description=row.get('description'),
            company_size=row.get('company_size'),
            state=row.get('state'),
            country=row.get('country'),
            city=row.get('city'),
            zip_code=row.get('zip_code'),
            address=row.get('address'),
            url=row.get('url')
        )
        companies.append(company)
        
        if len(companies) >= 1000:  # Batch insert
            db.bulk_save_objects(companies)
            db.commit()
            companies = []
            print(f"  ✓ Inserted batch...")
    
    if companies:
        db.bulk_save_objects(companies)
        db.commit()
    
    print(f"✅ Loaded {df.shape[0]} companies")


def load_skills(db: Session):
    """Load skills mapping"""
    print("📦 Loading skills...")
    
    file_path = os.path.join(DATA_PATH, "mappings/skills.csv")
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return
    
    df = pd.read_csv(file_path)
    
    skills = []
    for _, row in df.iterrows():
        skill = Skill(
            skill_abr=row['skill_abr'],
            skill_name=row['skill_name']
        )
        skills.append(skill)
    
    db.bulk_save_objects(skills)
    db.commit()
    
    print(f"✅ Loaded {len(skills)} skills")


def load_industries(db: Session):
    """Load industries mapping"""
    print("📦 Loading industries...")
    
    file_path = os.path.join(DATA_PATH, "mappings/industries.csv")
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return
    
    df = pd.read_csv(file_path)
    
    industries = []
    for _, row in df.iterrows():
        industry = Industry(
            industry_id=int(row['industry_id']),
            industry_name=row['industry_name']
        )
        industries.append(industry)
    
    db.bulk_save_objects(industries)
    db.commit()
    
    print(f"✅ Loaded {len(industries)} industries")


def load_jobs_sample(db: Session):
    """Load a sample of jobs (postings.csv is too large)"""
    print("📦 Loading jobs (sample)...")
    
    # Note: postings.csv is >50MB, we'll load in chunks
    file_path = os.path.join(DATA_PATH, "postings.csv")
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return
    
    # Read in chunks
    chunk_size = 10000
    total_loaded = 0
    max_rows = 50000  # Limit for demo
    
    try:
        for chunk in pd.read_csv(file_path, chunksize=chunk_size):
            if total_loaded >= max_rows:
                break
            
            jobs = []
            for _, row in chunk.iterrows():
                job = Job(
                    job_id=str(row['job_id']),
                    title=row.get('title'),
                    description=row.get('description'),
                    company_id=row.get('company_id'),
                    location=row.get('location'),
                    city=row.get('city'),
                    state=row.get('state'),
                    country=row.get('country'),
                    work_type=row.get('work_type'),
                    is_active=True
                )
                jobs.append(job)
            
            db.bulk_save_objects(jobs)
            db.commit()
            total_loaded += len(jobs)
            
            print(f"  ✓ Loaded {total_loaded} jobs so far...")
            
            if total_loaded >= max_rows:
                break
        
        print(f"✅ Loaded {total_loaded} jobs (sample)")
        
    except Exception as e:
        print(f"❌ Error loading jobs: {e}")


def load_salaries(db: Session):
    """Load salaries data"""
    print("📦 Loading salaries...")
    
    file_path = os.path.join(DATA_PATH, "jobs/salaries.csv")
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return
    
    df = pd.read_csv(file_path, nrows=20000)  # Limit for demo
    
    salaries = []
    for _, row in df.iterrows():
        salary = Salary(
            salary_id=str(row['salary_id']),
            job_id=str(row['job_id']),
            max_salary=row.get('max_salary'),
            med_salary=row.get('med_salary'),
            min_salary=row.get('min_salary'),
            pay_period=row.get('pay_period'),
            currency=row.get('currency'),
            compensation_type=row.get('compensation_type')
        )
        salaries.append(salary)
        
        if len(salaries) >= 1000:
            db.bulk_save_objects(salaries)
            db.commit()
            salaries = []
            print(f"  ✓ Inserted batch...")
    
    if salaries:
        db.bulk_save_objects(salaries)
        db.commit()
    
    print(f"✅ Loaded {df.shape[0]} salaries")


def load_job_skills(db: Session):
    """Load job-skill relationships"""
    print("📦 Loading job skills...")
    
    file_path = os.path.join(DATA_PATH, "jobs/job_skills.csv")
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return
    
    df = pd.read_csv(file_path, nrows=50000)  # Limit for demo
    
    job_skills = []
    for _, row in df.iterrows():
        js = JobSkill(
            job_id=str(row['job_id']),
            skill_abr=row['skill_abr']
        )
        job_skills.append(js)
        
        if len(job_skills) >= 1000:
            db.bulk_save_objects(job_skills)
            db.commit()
            job_skills = []
            print(f"  ✓ Inserted batch...")
    
    if job_skills:
        db.bulk_save_objects(job_skills)
        db.commit()
    
    print(f"✅ Loaded {df.shape[0]} job-skill relationships")


def load_benefits(db: Session):
    """Load benefits data"""
    print("📦 Loading benefits...")
    
    file_path = os.path.join(DATA_PATH, "jobs/benefits.csv")
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return
    
    df = pd.read_csv(file_path, nrows=20000)  # Limit for demo
    
    benefits = []
    for _, row in df.iterrows():
        benefit = Benefit(
            job_id=str(row['job_id']),
            type=row['type'],
            inferred=bool(row['inferred'])
        )
        benefits.append(benefit)
        
        if len(benefits) >= 1000:
            db.bulk_save_objects(benefits)
            db.commit()
            benefits = []
            print(f"  ✓ Inserted batch...")
    
    if benefits:
        db.bulk_save_objects(benefits)
        db.commit()
    
    print(f"✅ Loaded {df.shape[0]} benefits")


def main():
    """Main ETL process"""
    print("=" * 60)
    print("🚀 Starting ETL Process...")
    print("=" * 60)
    
    start_time = time.time()
    
    # Initialize database
    init_db()
    
    # Create session
    db = SessionLocal()
    
    try:
        # Load data in order (respect foreign keys)
        load_companies(db)
        load_skills(db)
        load_industries(db)
        load_jobs_sample(db)  # Takes longest
        load_salaries(db)
        load_job_skills(db)
        load_benefits(db)
        
        print("\n" + "=" * 60)
        print("✅ ETL Process Completed Successfully!")
        print(f"⏱️  Time taken: {time.time() - start_time:.2f} seconds")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ETL Failed: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
