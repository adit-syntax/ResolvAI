"""initial_schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-09-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0001_initial_schema'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Employees ──
    op.create_table(
        'employees',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=150), unique=True, index=True, nullable=False),
        sa.Column('role', sa.String(length=100), nullable=False),
        sa.Column('department', sa.String(length=100), index=True, nullable=False),
        sa.Column('skills', sa.JSON(), nullable=True),
        sa.Column('availability', sa.String(length=50), server_default='Available', nullable=False),
        sa.Column('current_ticket_load', sa.Integer(), server_default='0', nullable=False),
        sa.Column('shift_hours', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
    )

    # ── Users ──
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=150), unique=True, index=True, nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), server_default='user', nullable=False),
        sa.Column('employee_id', sa.Integer(), sa.ForeignKey('employees.id'), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
    )

    # ── Tickets ──
    op.create_table(
        'tickets',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('user_email', sa.String(length=150), index=True, nullable=False),
        sa.Column('attachment_url', sa.String(length=500), nullable=True),
        sa.Column('category', sa.String(length=100), index=True, nullable=True),
        sa.Column('severity', sa.String(length=50), index=True, nullable=True),
        sa.Column('department', sa.String(length=100), index=True, nullable=True),
        sa.Column('status', sa.String(length=50), index=True, server_default='New', nullable=False),
        sa.Column('auto_resolved', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('auto_response', sa.Text(), nullable=True),
        sa.Column('assignee_id', sa.Integer(), sa.ForeignKey('employees.id'), nullable=True),
        sa.Column('ai_summary', sa.Text(), nullable=True),
        sa.Column('confidence_score', sa.Float(), nullable=True),
        sa.Column('sentiment', sa.String(length=50), nullable=True),
        sa.Column('suggested_department', sa.String(length=100), nullable=True),
        sa.Column('suggested_employee', sa.String(length=100), nullable=True),
        sa.Column('recommended_resolution_path', sa.String(length=100), nullable=True),
        sa.Column('estimated_resolution_time', sa.String(length=50), nullable=True),
        sa.Column('sla_due_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('escalated', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column('assigned_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
    )

    # ── Ticket Replies ──
    op.create_table(
        'ticket_replies',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('ticket_id', sa.Integer(), sa.ForeignKey('tickets.id'), nullable=False),
        sa.Column('author_email', sa.String(length=150), nullable=False),
        sa.Column('author_name', sa.String(length=100), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_employee_reply', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('feedback_helpful', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
    )

    # ── Ticket Notes ──
    op.create_table(
        'ticket_notes',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('ticket_id', sa.Integer(), sa.ForeignKey('tickets.id'), nullable=False),
        sa.Column('author', sa.String(length=100), nullable=False),
        sa.Column('author_email', sa.String(length=150), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_internal', sa.Boolean(), server_default=sa.text('true'), nullable=False),
        sa.Column('note_type', sa.String(length=20), server_default='internal', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
    )

    # ── Ticket Timeline ──
    op.create_table(
        'ticket_timeline',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('ticket_id', sa.Integer(), sa.ForeignKey('tickets.id'), nullable=False),
        sa.Column('event_type', sa.String(length=50), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('old_value', sa.String(length=200), nullable=True),
        sa.Column('new_value', sa.String(length=200), nullable=True),
        sa.Column('actor', sa.String(length=100), server_default='System', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
    )

    # ── Feedback ──
    op.create_table(
        'feedback',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('ticket_id', sa.Integer(), sa.ForeignKey('tickets.id'), nullable=False),
        sa.Column('is_helpful', sa.Boolean(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
    )

    # ── Notifications ──
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('ticket_id', sa.Integer(), sa.ForeignKey('tickets.id'), nullable=False),
        sa.Column('recipient_email', sa.String(length=150), nullable=False),
        sa.Column('subject', sa.String(length=200), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
    )

    # ── System Settings ──
    op.create_table(
        'system_settings',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('key', sa.String(length=100), unique=True, index=True, nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('system_settings')
    op.drop_table('notifications')
    op.drop_table('feedback')
    op.drop_table('ticket_timeline')
    op.drop_table('ticket_notes')
    op.drop_table('ticket_replies')
    op.drop_table('tickets')
    op.drop_table('users')
    op.drop_table('employees')
