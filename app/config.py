from pathlib import Path
import os

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[1]

load_dotenv(PROJECT_ROOT / ".env")


def get_setting(name: str, default: str = "") -> str:
    return os.getenv(name, default)
"""Carrega e disponibiliza as configurações do ambiente."""
