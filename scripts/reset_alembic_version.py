"""
One-time script: reset Render DB to empty so we can run all migrations from scratch.
Drops and recreates public schema (and alembic_version). Run from project root.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from backend.database.config import DATABASE_URL

def main():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE"))
        conn.execute(text("CREATE SCHEMA public"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
        conn.commit()
    print("Public schema reset. Now run: alembic upgrade head")

if __name__ == "__main__":
    main()
