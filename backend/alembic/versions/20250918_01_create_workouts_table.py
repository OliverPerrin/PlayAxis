"""create workouts table

Revision ID: wkt20250918
Revises: abcd1234drop
Create Date: 2025-09-18 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'wkt20250918'
down_revision: Union[str, None] = 'abcd1234drop'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'workouts',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('sport', sa.String(length=32), nullable=False, index=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('duration_sec', sa.Integer(), nullable=False),
        sa.Column('distance_m', sa.Float()),
        sa.Column('elevation_m', sa.Float()),
        sa.Column('avg_power_w', sa.Float()),
        sa.Column('avg_hr', sa.Integer()),
        sa.Column('units', sa.JSON()),
        sa.Column('raw_metrics', sa.JSON()),
        sa.Column('notes', sa.String()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )
    op.create_index('ix_workouts_user_id_started_at', 'workouts', ['user_id', 'started_at'])


def downgrade() -> None:
    op.drop_index('ix_workouts_user_id_started_at', table_name='workouts')
    op.drop_table('workouts')
