import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from backend or root .env
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediFlow – Autonomous Healthcare Triage Agent"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # LLM Settings: "mock" (offline fallback), "gemini", or "openai"
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mock")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    
    # Safety and Triage Parameters
    SAFETY_MAX_RETRY_LOOPS: int = 2
    HALLUCINATION_THRESHOLD: float = 0.20  # Max acceptable hallucination score
    
    # Knowledge Base Path
    KNOWLEDGE_BASE_DIR: Path = BASE_DIR / "app" / "rag" / "knowledge_base"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "*"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="allow"
    )

settings = Settings()
