"""Create user and interest tables

Revision ID: 778b17015fd0
Revises: 
Create Date: 2025-08-26 14:25:20.597624

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '778b17015fd0'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create interests table
    op.create_table(
        'interests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_interests_id'), 'interests', ['id'], unique=False)
    op.create_index(op.f('ix_interests_name'), 'interests', ['name'], unique=True)

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_full_name'), 'users', ['full_name'], unique=False)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # Create user_interest association table
    op.create_table(
        'user_interest',
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('interest_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['interest_id'], ['interests.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], )
    )

    # Create events table
    op.create_table(
        'events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(256), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=True),
        sa.Column('url', sa.String(512), nullable=True),
        sa.Column('source', sa.String(50), nullable=False),
        sa.Column('niche', sa.String(50), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_events_id'), 'events', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_events_id'), table_name='events')
    op.drop_table('events')
    op.drop_table('user_interest')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_full_name'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
    op.drop_index(op.f('ix_interests_name'), table_name='interests')
    op.drop_index(op.f('ix_interests_id'), table_name='interests')
    op.drop_table('interests')