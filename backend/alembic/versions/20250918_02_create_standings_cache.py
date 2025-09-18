"""create standings cache table

Revision ID: standings_cache_20250918
Revises: 20250918_01_create_workouts_table
Create Date: 2025-09-18
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'standings_cache_20250918'
down_revision: Union[str, None] = '20250918_01_create_workouts_table'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.create_table(
        'standings_cache',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('sport', sa.String(length=64), nullable=False, unique=True, index=True),
        sa.Column('data', sa.JSON(), nullable=False),
        sa.Column('refreshed_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
    )
    op.create_index('ix_standings_cache_sport', 'standings_cache', ['sport'], unique=True)

def downgrade() -> None:
    op.drop_index('ix_standings_cache_sport', table_name='standings_cache')
    op.drop_table('standings_cache')
