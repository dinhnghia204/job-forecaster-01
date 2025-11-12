from database import SessionLocal
from models import Job, Industry, JobIndustry, Company
from sqlalchemy import func

db = SessionLocal()

# Check Job columns
job = db.query(Job).first()
print("=== Sample Job Data ===")
print(f"job_id: {job.job_id}")
print(f"title: {job.title}")
print(f"location: {job.location if hasattr(job, 'location') else 'N/A'}")
print(f"city: {job.city if hasattr(job, 'city') else 'N/A'}")
print(f"state: {job.state if hasattr(job, 'state') else 'N/A'}")
print(f"company_id: {job.company_id}")

# Check if location field has data
jobs_with_location = db.query(Job).filter(Job.location.isnot(None)).count() if hasattr(Job, 'location') else 0
print(f"\nJobs with location: {jobs_with_location}")

# Check Company data
company = db.query(Company).first()
print("\n=== Sample Company Data ===")
print(f"company_id: {company.company_id}")
print(f"name: {company.name}")
print(f"city: {company.city if hasattr(company, 'city') else 'N/A'}")
print(f"state: {company.state if hasattr(company, 'state') else 'N/A'}")

# Check Industry data
print("\n=== Industry Data ===")
print(f"Total industries: {db.query(Industry).count()}")
print(f"Total job-industry links: {db.query(JobIndustry).count()}")

# Sample industries
industries = db.query(Industry).limit(5).all()
for ind in industries:
    print(f"  - {ind.industry_name}")

db.close()
