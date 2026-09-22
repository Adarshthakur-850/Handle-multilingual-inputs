import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.db_models import User, Summary
from app.schemas.schemas import SummaryResponse

router = APIRouter(prefix="/history", tags=["history"])

@router.get("/", response_model=List[SummaryResponse])
def get_history(
    search: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Summary).filter(Summary.user_id == current_user.id)
    
    if search:
        query = query.filter(Summary.title.ilike(f"%{search}%"))
        
    db_summaries = query.order_by(Summary.created_at.desc()).offset(skip).limit(limit).all()
    
    responses = []
    for s in db_summaries:
        # Deserialize JSON fields
        try:
            kws = json.loads(s.keywords) if s.keywords else []
        except Exception:
            kws = []
        try:
            ents = json.loads(s.entities) if s.entities else []
        except Exception:
            ents = []
            
        responses.append(
            SummaryResponse(
                id=s.id,
                title=s.title,
                original_text=s.original_text,
                summary_text=s.summary_text,
                summary_mode=s.summary_mode,
                summary_type=s.summary_type,
                language=s.language,
                model_used=s.model_used,
                reading_time_reduction=s.reading_time_reduction,
                compression_ratio=s.compression_ratio,
                readability_score=s.readability_score,
                keywords=kws,
                entities=ents,
                created_at=s.created_at
            )
        )
    return responses

@router.get("/{summary_id}", response_model=SummaryResponse)
def get_summary_by_id(
    summary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    s = db.query(Summary).filter(Summary.id == summary_id, Summary.user_id == current_user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Summary not found.")
        
    try:
        kws = json.loads(s.keywords) if s.keywords else []
    except Exception:
        kws = []
    try:
        ents = json.loads(s.entities) if s.entities else []
    except Exception:
        ents = []
        
    return SummaryResponse(
        id=s.id,
        title=s.title,
        original_text=s.original_text,
        summary_text=s.summary_text,
        summary_mode=s.summary_mode,
        summary_type=s.summary_type,
        language=s.language,
        model_used=s.model_used,
        reading_time_reduction=s.reading_time_reduction,
        compression_ratio=s.compression_ratio,
        readability_score=s.readability_score,
        keywords=kws,
        entities=ents,
        created_at=s.created_at
    )

@router.delete("/{summary_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_summary(
    summary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    s = db.query(Summary).filter(Summary.id == summary_id, Summary.user_id == current_user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Summary not found.")
        
    db.delete(s)
    db.commit()
    return None
