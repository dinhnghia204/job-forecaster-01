"""
Advanced Analytics Module
Market trends, industry analysis, and insights
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from models import Job, Company, Salary, Skill, JobSkill, Industry, JobIndustry, Benefit
from typing import List, Dict, Optional
import pandas as pd


class MarketAnalytics:
    """Advanced market analysis and insights"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_market_overview(self) -> Dict:
        """Get comprehensive market overview"""
        return {
            "jobs": self._get_job_stats(),
            "companies": self._get_company_stats(),
            "skills": self._get_skill_stats(),
            "salaries": self._get_salary_stats(),
            "industries": self._get_industry_stats()
        }
    
    def get_industry_breakdown(self, limit: int = 20) -> List[Dict]:
        """Get job distribution by industry"""
        # Since JobIndustry table is empty, use Skill names as proxy for "industries"
        # Or use job titles to infer industries
        results = self.db.query(
            Skill.skill_name,
            func.count(JobSkill.job_id).label('job_count')
        ).join(JobSkill)\
         .group_by(Skill.skill_name)\
         .order_by(desc('job_count'))\
         .limit(limit).all()
        
        total_jobs = sum([r[1] for r in results]) if results else 0
        
        return [
            {
                "industry_name": r[0] or "Unknown",
                "job_count": r[1],
                "percentage": round((r[1] / total_jobs * 100), 2) if total_jobs > 0 else 0
            }
            for r in results
        ]
    
    def get_location_insights(self, limit: int = 20) -> List[Dict]:
        """Get job market insights by location"""
        # Parse state from location field
        from sqlalchemy import case
        
        # Extract state (assuming format "City, State")
        locations = self.db.query(
            Job.location,
            func.count(Job.id).label('job_count'),
            func.avg(Salary.med_salary).label('avg_salary')
        ).outerjoin(Salary, Job.job_id == Salary.job_id)\
         .filter(Job.location.isnot(None))\
         .group_by(Job.location)\
         .order_by(desc('job_count'))\
         .limit(limit * 2).all()  # Get more to aggregate by state
        
        # Aggregate by state
        state_data = {}
        for location, job_count, avg_salary in locations:
            if ',' in location:
                state = location.split(',')[-1].strip()
            else:
                state = location
            
            if state not in state_data:
                state_data[state] = {
                    'job_count': 0,
                    'salaries': [],
                    'cities': []
                }
            
            state_data[state]['job_count'] += job_count
            if avg_salary:
                state_data[state]['salaries'].append(avg_salary)
            city = location.split(',')[0].strip() if ',' in location else location
            state_data[state]['cities'].append((city, job_count))
        
        # Format results
        results = []
        for state, data in sorted(state_data.items(), key=lambda x: x[1]['job_count'], reverse=True)[:limit]:
            avg_sal = sum(data['salaries']) / len(data['salaries']) if data['salaries'] else None
            top_city = max(data['cities'], key=lambda x: x[1])[0] if data['cities'] else None
            
            results.append({
                "state": state,
                "job_count": data['job_count'],
                "avg_salary": round(avg_sal, 2) if avg_sal else None,
                "top_city": top_city
            })
        
        return results
    
    def get_city_rankings(self, limit: int = 30) -> List[Dict]:
        """Get top cities by job opportunities"""
        # Parse location field (format: "City, State")
        cities = self.db.query(
            Job.location,
            func.count(Job.id).label('job_count'),
            func.avg(Salary.med_salary).label('avg_salary')
        ).outerjoin(Salary, Job.job_id == Salary.job_id)\
         .filter(Job.location.isnot(None))\
         .group_by(Job.location)\
         .order_by(desc('job_count'))\
         .limit(limit).all()
        
        return [
            {
                "city": location.split(',')[0].strip() if ',' in location else location,
                "state": location.split(',')[-1].strip() if ',' in location else '',
                "job_count": job_count,
                "avg_salary": round(avg_salary, 2) if avg_salary else None,
                "location": location
            }
            for location, job_count, avg_salary in cities
        ]
    
    def get_skill_co_occurrence(self, skill_name: str, limit: int = 10) -> List[Dict]:
        """Find skills that commonly appear together with given skill"""
        # Find jobs that require this skill
        target_skill = self.db.query(Skill).filter(
            Skill.skill_name == skill_name
        ).first()
        
        if not target_skill:
            return []
        
        # Get job_ids with this skill
        job_ids = self.db.query(JobSkill.job_id).filter(
            JobSkill.skill_abr == target_skill.skill_abr
        ).subquery()
        
        # Find other skills in those jobs
        co_occurring = self.db.query(
            Skill.skill_name,
            func.count(JobSkill.id).label('count')
        ).join(JobSkill)\
         .filter(JobSkill.job_id.in_(job_ids))\
         .filter(Skill.skill_name != skill_name)\
         .group_by(Skill.skill_name)\
         .order_by(desc('count'))\
         .limit(limit).all()
        
        total = len(self.db.query(JobSkill.job_id).filter(
            JobSkill.skill_abr == target_skill.skill_abr
        ).distinct().all())
        
        return [
            {
                "skill": skill,
                "co_occurrence_count": count,
                "co_occurrence_rate": round((count / total * 100), 2) if total > 0 else 0
            }
            for skill, count in co_occurring
        ]
    
    def get_skill_network(self, min_co_occurrence: int = 5) -> Dict:
        """Build skill relationship network"""
        # Get top skills
        top_skills = self.db.query(Skill.skill_name).join(JobSkill)\
            .group_by(Skill.id)\
            .having(func.count(JobSkill.id) >= min_co_occurrence)\
            .order_by(desc(func.count(JobSkill.id)))\
            .limit(20).all()
        
        skills = [s[0] for s in top_skills]
        
        # Build adjacency matrix
        edges = []
        for skill in skills:
            co_occurring = self.get_skill_co_occurrence(skill, limit=5)
            for co_skill in co_occurring:
                if co_skill['skill'] in skills:
                    edges.append({
                        "source": skill,
                        "target": co_skill['skill'],
                        "weight": co_skill['co_occurrence_count']
                    })
        
        return {
            "nodes": [{"id": skill, "label": skill} for skill in skills],
            "edges": edges
        }
    
    def get_benefits_analysis(self) -> Dict:
        """Analyze benefits offerings"""
        # Top benefits
        top_benefits = self.db.query(
            Benefit.type,
            func.count(Benefit.id).label('count')
        ).group_by(Benefit.type)\
         .order_by(desc('count'))\
         .limit(20).all()
        
        total_jobs_with_benefits = self.db.query(
            func.count(func.distinct(Benefit.job_id))
        ).scalar()
        
        return {
            "top_benefits": [
                {
                    "benefit": benefit,
                    "count": count,
                    "percentage": round((count / total_jobs_with_benefits * 100), 2)
                }
                for benefit, count in top_benefits
            ],
            "total_jobs_with_benefits": total_jobs_with_benefits,
            "average_benefits_per_job": round(
                self.db.query(func.count(Benefit.id)).scalar() / total_jobs_with_benefits, 2
            ) if total_jobs_with_benefits > 0 else 0
        }
    
    def get_company_insights(self, limit: int = 20) -> List[Dict]:
        """Get insights about top hiring companies"""
        companies = self.db.query(
            Company.name,
            Company.company_size,
            Company.city,
            Company.state,
            func.count(Job.id).label('job_count'),
            func.avg(Salary.med_salary).label('avg_salary')
        ).join(Job, Company.company_id == str(Job.company_id))\
         .outerjoin(Salary, Job.job_id == Salary.job_id)\
         .group_by(Company.id)\
         .order_by(desc('job_count'))\
         .limit(limit).all()
        
        results = []
        for name, size, city, state, job_count, avg_salary in companies:
            results.append({
                "company": name,
                "size": size,
                "location": f"{city}, {state}" if city and state else state,
                "active_jobs": job_count,
                "avg_salary": round(avg_salary, 2) if avg_salary else None
            })
        
        return results
    
    def get_salary_distribution(
        self, 
        skill_name: Optional[str] = None,
        bins: int = 10
    ) -> Dict:
        """Get salary distribution (histogram data)"""
        query = self.db.query(Salary.med_salary).filter(
            Salary.med_salary.isnot(None)
        )
        
        if skill_name:
            query = query.join(Job).join(JobSkill).join(Skill).filter(
                Skill.skill_name == skill_name
            )
        
        salaries = [s[0] for s in query.all() if s[0]]
        
        if not salaries:
            return {"error": "No salary data available"}
        
        # Calculate statistics
        salaries_array = pd.Series(salaries)
        
        # Create bins
        hist, bin_edges = pd.cut(salaries_array, bins=bins, retbins=True)
        value_counts = hist.value_counts().sort_index()
        
        distribution = []
        for interval, count in value_counts.items():
            distribution.append({
                "range": f"${int(interval.left):,} - ${int(interval.right):,}",
                "count": int(count),
                "percentage": round((count / len(salaries) * 100), 2)
            })
        
        return {
            "distribution": distribution,
            "statistics": {
                "mean": round(salaries_array.mean(), 2),
                "median": round(salaries_array.median(), 2),
                "std": round(salaries_array.std(), 2),
                "min": round(salaries_array.min(), 2),
                "max": round(salaries_array.max(), 2),
                "q25": round(salaries_array.quantile(0.25), 2),
                "q75": round(salaries_array.quantile(0.75), 2)
            },
            "total_samples": len(salaries)
        }
    
    def compare_skills(self, skill_names: List[str]) -> Dict:
        """Compare multiple skills across various metrics"""
        results = []
        
        for skill_name in skill_names:
            skill = self.db.query(Skill).filter(
                Skill.skill_name == skill_name
            ).first()
            
            if not skill:
                continue
            
            # Job count
            job_count = self.db.query(func.count(JobSkill.id)).filter(
                JobSkill.skill_abr == skill.skill_abr
            ).scalar()
            
            # Average salary
            avg_salary = self.db.query(func.avg(Salary.med_salary))\
                .join(Job).join(JobSkill)\
                .filter(JobSkill.skill_abr == skill.skill_abr)\
                .filter(Salary.med_salary.isnot(None)).scalar()
            
            # Top industries
            top_industry = self.db.query(
                Industry.industry_name,
                func.count(JobIndustry.id).label('count')
            ).join(JobIndustry).join(Job).join(JobSkill)\
             .filter(JobSkill.skill_abr == skill.skill_abr)\
             .group_by(Industry.industry_name)\
             .order_by(desc('count'))\
             .first()
            
            results.append({
                "skill": skill_name,
                "job_count": job_count,
                "avg_salary": round(avg_salary, 2) if avg_salary else None,
                "top_industry": top_industry[0] if top_industry else None
            })
        
        return {
            "skills": results,
            "comparison_date": pd.Timestamp.now().strftime("%Y-%m-%d")
        }
    
    # ========================================
    # Private Helper Methods
    # ========================================
    
    def _get_job_stats(self) -> Dict:
        """Get job statistics"""
        total = self.db.query(func.count(Job.id)).scalar()
        active = self.db.query(func.count(Job.id)).filter(Job.is_active == True).scalar()
        
        return {
            "total": total,
            "active": active,
            "inactive": total - active
        }
    
    def _get_company_stats(self) -> Dict:
        """Get company statistics"""
        total = self.db.query(func.count(Company.id)).scalar()
        
        hiring = self.db.query(
            func.count(func.distinct(Job.company_id))
        ).filter(Job.is_active == True).scalar()
        
        return {
            "total": total,
            "currently_hiring": hiring
        }
    
    def _get_skill_stats(self) -> Dict:
        """Get skill statistics"""
        total = self.db.query(func.count(Skill.id)).scalar()
        
        # Most in-demand
        top_skill = self.db.query(
            Skill.skill_name,
            func.count(JobSkill.id).label('count')
        ).join(JobSkill).group_by(Skill.id)\
         .order_by(desc('count')).first()
        
        return {
            "total": total,
            "most_in_demand": top_skill[0] if top_skill else None,
            "demand_count": top_skill[1] if top_skill else 0
        }
    
    def _get_salary_stats(self) -> Dict:
        """Get salary statistics"""
        stats = self.db.query(
            func.avg(Salary.med_salary).label('avg'),
            func.min(Salary.min_salary).label('min'),
            func.max(Salary.max_salary).label('max')
        ).filter(Salary.med_salary.isnot(None)).first()
        
        return {
            "average": round(stats[0], 2) if stats[0] else None,
            "minimum": round(stats[1], 2) if stats[1] else None,
            "maximum": round(stats[2], 2) if stats[2] else None
        }
    
    def _get_industry_stats(self) -> Dict:
        """Get industry statistics"""
        total = self.db.query(func.count(Industry.id)).scalar()
        
        # Top industry by jobs
        top = self.db.query(
            Industry.industry_name,
            func.count(JobIndustry.id).label('count')
        ).join(JobIndustry).group_by(Industry.industry_name)\
         .order_by(desc('count')).first()
        
        return {
            "total": total,
            "top_industry": top[0] if top else None,
            "top_job_count": top[1] if top else 0
        }


def get_analytics(db: Session) -> MarketAnalytics:
    """Factory function to create analytics instance"""
    return MarketAnalytics(db)
