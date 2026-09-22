from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

class SummarizeRequest(BaseModel):
    text: Optional[str] = None
    url: Optional[str] = None
    mode: str = "detailed"          # short, detailed, bullet, executive, academic, meeting, news
    type: str = "abstractive"       # extractive, abstractive, hybrid, rag
    language: str = "English"       # English, Hindi, Spanish, French, German, Arabic
    length_ratio: float = 0.25      # Slider value (0.1 to 0.8)

class EntityModel(BaseModel):
    text: str
    label: str

class SummaryResponse(BaseModel):
    id: int
    title: str
    original_text: str
    summary_text: str
    summary_mode: str
    summary_type: str
    language: str
    model_used: str
    reading_time_reduction: Optional[float] = None
    compression_ratio: Optional[float] = None
    readability_score: Optional[float] = None
    keywords: List[str] = []
    entities: List[EntityModel] = []
    created_at: datetime

    class Config:
        from_attributes = True

class ActivityLogEntry(BaseModel):
    date: str
    count: int

class NameCountEntry(BaseModel):
    name: str
    value: int

class AnalyticsResponse(BaseModel):
    total_summaries: int
    total_words_processed: int
    average_compression: float
    time_saved_minutes: float
    activity: List[ActivityLogEntry]
    languages: List[NameCountEntry]
    methods: List[NameCountEntry]
