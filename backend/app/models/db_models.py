from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    summaries = relationship("Summary", back_populates="user", cascade="all, delete-orphan")
    analytics_logs = relationship("AnalyticsLog", back_populates="user", cascade="all, delete-orphan")

class Summary(Base):
    __tablename__ = "summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    original_text = Column(Text, nullable=False)
    summary_text = Column(Text, nullable=False)
    summary_mode = Column(String, nullable=False)  # short, detailed, bullet, executive, etc.
    summary_type = Column(String, nullable=False)  # extractive, abstractive, hybrid, rag
    language = Column(String, nullable=False)      # English, Hindi, Spanish, etc.
    model_used = Column(String, nullable=False)
    reading_time_reduction = Column(Float, nullable=True) # Percentage time saved
    compression_ratio = Column(Float, nullable=True)      # final/original length
    readability_score = Column(Float, nullable=True)      # Flesch-Kincaid ease score
    keywords = Column(Text, nullable=True)                # JSON list
    entities = Column(Text, nullable=True)                # JSON list of dicts
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", back_populates="summaries")

class AnalyticsLog(Base):
    __tablename__ = "analytics_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False)               # summarize, login, etc.
    word_count = Column(Integer, default=0)
    time_taken_seconds = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="analytics_logs")
