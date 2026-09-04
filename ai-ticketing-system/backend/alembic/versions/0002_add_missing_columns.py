"""add_missing_columns

Revision ID: 0002_add_missing_columns
Revises: 0001_initial_schema
Create Date: 2026-09-05 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0002_add_missing_columns'
down_revision: Union[str, Sequence[str], None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    is_sqlite = conn.dialect.name == "sqlite"

    if not is_sqlite:
        statements = [
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "ALTER TABLE employees ADD COLUMN IF NOT EXISTS skill_tags TEXT DEFAULT ''",
            "ALTER TABLE employees ADD COLUMN IF NOT EXISTS avg_resolution_time FLOAT DEFAULT 0.0",
            "ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        ]
        for stmt in statements:
            try:
                op.execute(stmt)
            except Exception:
                pass


def downgrade() -> None:
    pass
