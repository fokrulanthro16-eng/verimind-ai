import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    NEBIUS_API_KEY: str = ""
    NEBIUS_BASE_URL: str = "https://api.tokenfactory.nebius.com/v1/"
    NEBIUS_MODEL: str = "Qwen/Qwen2.5-Coder-32B-Instruct"
    HF_TOKEN: str = ""
    HF_EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    DATABASE_PATH: str = str(BASE_DIR / "verimind.db")

    # Paths
    BASE_DIR: Path = BASE_DIR
    DATA_DIR: Path = DATA_DIR
    MODEL_PATH: Path = DATA_DIR / "verimind_model.joblib"
    BENCHMARK_PATH: Path = DATA_DIR / "defense_benchmark.csv"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def clean_urls(self):
        # Strip potential markdown link formatting e.g. [url](url)
        url = self.NEBIUS_BASE_URL.strip()
        if "[" in url and "](" in url:
            url = url.split("](")[-1].rstrip(")")
        url = url.strip("[]() ")
        if not url.endswith("/"):
            url += "/"
        self.NEBIUS_BASE_URL = url


settings = Settings()
settings.clean_urls()

MODEL_PATH = settings.MODEL_PATH
BENCHMARK_PATH = settings.BENCHMARK_PATH
NEBIUS_API_KEY = settings.NEBIUS_API_KEY
NEBIUS_BASE_URL = settings.NEBIUS_BASE_URL
NEBIUS_MODEL = settings.NEBIUS_MODEL
HF_TOKEN = settings.HF_TOKEN
HF_EMBEDDING_MODEL = settings.HF_EMBEDDING_MODEL
DATABASE_PATH = settings.DATABASE_PATH

