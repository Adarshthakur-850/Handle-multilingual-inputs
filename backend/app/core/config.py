import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "IntelliSummarize AI"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretjwtkeyforintellisummarizeai2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # DB settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./database.db")
    
    # Models config
    BART_MODEL_NAME: str = "sshleifer/distilbart-cnn-12-6"
    T5_MODEL_NAME: str = "t5-small"
    MULTILINGUAL_MODEL_NAME: str = "google/mt5-small"
    NER_MODEL_NAME: str = "dbmdz/bert-large-cased-finetuned-conll03-english"
    
    # Upload configurations
    MAX_FILE_SIZE_MB: int = 10
    ALLOWED_EXTENSIONS: set = {"txt", "pdf", "docx"}
    
    class Config:
        case_sensitive = True

settings = Settings()
