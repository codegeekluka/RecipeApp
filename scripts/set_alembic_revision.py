"""Set alembic_version to cea8c50cf9be so we can re-run 0bc4ef7fd568 (column renames)."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', 'database', '.env'))
from backend.database.config import DATABASE_URL
from sqlalchemy import create_engine, text

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    conn.execute(text("UPDATE alembic_version SET version_num = 'cea8c50cf9be'"))
    conn.commit()
print("Set alembic_version to cea8c50cf9be")
