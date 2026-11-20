"""
Database configuration and session management.
Uses SQLite with SQLAlchemy ORM.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ticketing.db")

# Managed Postgres (Render/Heroku) hands out legacy 'postgres://' URLs;
# SQLAlchemy 2.0 only accepts the 'postgresql://' scheme.
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("sqlite"):
    # check_same_thread is a SQLite-only connect arg.
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # pool_pre_ping avoids stale-connection errors on managed Postgres.
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def init_extensions():
    """Enable PostgreSQL extensions such as pgvector if supported."""
    if not DATABASE_URL.startswith("sqlite"):
        from sqlalchemy import text
        try:
            with engine.connect() as conn:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
                print("[Database] pgvector extension verified / initialized.")
        except Exception as e:
            print(f"[Database] pgvector initialization notice: {e}")


def get_db():
    """Dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
