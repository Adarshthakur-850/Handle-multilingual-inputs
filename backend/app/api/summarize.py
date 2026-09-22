import json
import time
from typing import Optional
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.db_models import User, Summary, AnalyticsLog
from app.schemas.schemas import SummarizeRequest, SummaryResponse
from app.services.nlp_utils import (
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_url,
    calculate_readability,
    extract_keywords,
    extract_entities
)
from app.services.summarizer import SummarizerEngine

router = APIRouter(prefix="/summarize", tags=["summarize"])
engine = SummarizerEngine()

def process_and_save_summary(
    db: Session,
    user: User,
    title: str,
    original_text: str,
    mode: str,
    type: str,
    language: str,
    length_ratio: float
) -> SummaryResponse:
    if not original_text or len(original_text.strip()) < 20:
        raise HTTPException(status_code=400, detail="Document content is too short to summarize (minimum 20 characters).")
        
    start_time = time.time()
    
    # Run the summarizer
    try:
        summary_text, model_used = engine.summarize(original_text, type, mode, length_ratio, language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NLP summarization error: {str(e)}")
        
    time_taken = time.time() - start_time
    
    # Calculate word metrics
    orig_words = len(original_text.split())
    sum_words = len(summary_text.split())
    
    # Calculations
    compression_ratio = round(sum_words / orig_words if orig_words > 0 else 0, 3)
    
    # Reading times in minutes (assuming 200 WPM)
    orig_reading_time = orig_words / 200.0
    sum_reading_time = sum_words / 200.0
    time_saved_pct = round(((orig_reading_time - sum_reading_time) / orig_reading_time) * 100, 1) if orig_reading_time > 0 else 0.0
    
    # Readability (Flesch)
    readability = calculate_readability(summary_text)
    
    # Keywords & Entities
    keywords = extract_keywords(original_text, top_n=6)
    entities = extract_entities(original_text)
    
    # Create DB entry
    db_summary = Summary(
        title=title,
        original_text=original_text,
        summary_text=summary_text,
        summary_mode=mode,
        summary_type=type,
        language=language,
        model_used=model_used,
        reading_time_reduction=time_saved_pct,
        compression_ratio=compression_ratio,
        readability_score=readability,
        keywords=json.dumps(keywords),
        entities=json.dumps(entities),
        user_id=user.id
    )
    db.add(db_summary)
    
    # Create Analytics entry
    analytics = AnalyticsLog(
        user_id=user.id,
        action="generate_summary",
        word_count=orig_words,
        time_taken_seconds=time_taken
    )
    db.add(analytics)
    
    db.commit()
    db.refresh(db_summary)
    
    # Format and return Pydantic response
    return SummaryResponse(
        id=db_summary.id,
        title=db_summary.title,
        original_text=db_summary.original_text,
        summary_text=db_summary.summary_text,
        summary_mode=db_summary.summary_mode,
        summary_type=db_summary.summary_type,
        language=db_summary.language,
        model_used=db_summary.model_used,
        reading_time_reduction=db_summary.reading_time_reduction,
        compression_ratio=db_summary.compression_ratio,
        readability_score=db_summary.readability_score,
        keywords=keywords,
        entities=entities,
        created_at=db_summary.created_at
    )

@router.post("/text", response_model=SummaryResponse)
def summarize_text(
    request: SummarizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    original_text = ""
    title = "Text Summary"
    
    if request.text:
        original_text = request.text.strip()
        title = original_text[:30] + "..." if len(original_text) > 30 else original_text
    elif request.url:
        try:
            original_text = extract_text_from_url(request.url)
            # Use URL path/domain for title
            parsed = urllib.parse.urlparse(request.url)
            title = f"Web Article: {parsed.netloc}{parsed.path[:15]}"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch content from URL: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Either 'text' or 'url' must be provided.")
        
    return process_and_save_summary(
        db=db,
        user=current_user,
        title=title,
        original_text=original_text,
        mode=request.mode,
        type=request.type,
        language=request.language,
        length_ratio=request.length_ratio
    )

@router.post("/file", response_model=SummaryResponse)
def summarize_file(
    file: UploadFile = File(...),
    mode: str = Form("detailed"),
    type: str = Form("abstractive"),
    language: str = Form("English"),
    length_ratio: float = Form(0.25),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check file size
    file_size_mb = 0
    file_bytes = b""
    
    try:
        file_bytes = file.file.read()
        file_size_mb = len(file_bytes) / (1024 * 1024)
        if file_size_mb > 10:
            raise HTTPException(status_code=400, detail="File size exceeds the maximum limit of 10MB.")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail="Failed to read file.")
        
    # Extract text based on file extension
    filename = file.filename
    extension = filename.split(".")[-1].lower()
    
    if extension == "pdf":
        try:
            original_text = extract_text_from_pdf(file_bytes)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to extract text from PDF: {str(e)}")
    elif extension == "docx":
        try:
            original_text = extract_text_from_docx(file_bytes)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to extract text from DOCX: {str(e)}")
    elif extension == "txt":
        try:
            original_text = file_bytes.decode("utf-8", errors="ignore")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse text file: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT.")
        
    title = filename
    return process_and_save_summary(
        db=db,
        user=current_user,
        title=title,
        original_text=original_text,
        mode=mode,
        type=type,
        language=language,
        length_ratio=length_ratio
    )
import urllib.parse # Helper import for URL parsing
