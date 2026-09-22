from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.db_models import User, Summary, AnalyticsLog
from app.schemas.schemas import AnalyticsResponse, ActivityLogEntry, NameCountEntry

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/", response_model=AnalyticsResponse)
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total summaries
    total_summaries = db.query(Summary).filter(Summary.user_id == current_user.id).count()
    
    # Total words processed (sum word count in AnalyticsLogs)
    word_count_result = db.query(func.sum(AnalyticsLog.word_count)).filter(AnalyticsLog.user_id == current_user.id).first()
    total_words = word_count_result[0] if word_count_result and word_count_result[0] is not None else 0
    
    # Average compression ratio
    avg_comp_result = db.query(func.avg(Summary.compression_ratio)).filter(Summary.user_id == current_user.id).first()
    avg_comp = round(avg_comp_result[0], 2) if avg_comp_result and avg_comp_result[0] is not None else 0.0
    
    # Reading time saved (in minutes)
    # Average reading time saved per summary:
    # We can aggregate total words processed, convert to minutes, and multiply by average reduction percentage
    summaries = db.query(Summary.original_text, Summary.reading_time_reduction).filter(Summary.user_id == current_user.id).all()
    total_saved_minutes = 0.0
    for text, reduction in summaries:
        w_count = len(text.split())
        reading_time_min = w_count / 200.0
        saved_min = reading_time_min * ((reduction or 0.0) / 100.0)
        total_saved_minutes += saved_min
        
    total_saved_minutes = round(total_saved_minutes, 1)
    
    # Activity log for last 7 days
    today = datetime.utcnow().date()
    activity = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        
        # SQLite-compatible date matching
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())
        
        count = db.query(Summary).filter(
            Summary.user_id == current_user.id,
            Summary.created_at >= day_start,
            Summary.created_at <= day_end
        ).count()
        
        activity.append(ActivityLogEntry(date=day_str, count=count))
        
    # Language distribution
    lang_data = db.query(Summary.language, func.count(Summary.id)).filter(
        Summary.user_id == current_user.id
    ).group_by(Summary.language).order_by(desc(func.count(Summary.id))).all()
    
    languages = [NameCountEntry(name=lang or "English", value=count) for lang, count in lang_data]
    
    # Methods distribution
    method_data = db.query(Summary.summary_type, func.count(Summary.id)).filter(
        Summary.user_id == current_user.id
    ).group_by(Summary.summary_type).order_by(desc(func.count(Summary.id))).all()
    
    methods = [NameCountEntry(name=method.capitalize() or "Abstractive", value=count) for method, count in method_data]
    
    return AnalyticsResponse(
        total_summaries=total_summaries,
        total_words_processed=total_words,
        average_compression=avg_comp,
        time_saved_minutes=total_saved_minutes,
        activity=activity,
        languages=languages,
        methods=methods
    )
