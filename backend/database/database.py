from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.database.config import DATABASE_URL

Base = declarative_base()
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# dependency
def get_db():
    db= SessionLocal()
    try:
        yield db
    finally:
        db.close()
