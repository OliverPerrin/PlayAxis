"""drop eventbrite token columns

Revision ID: abcd1234drop
Revises: 98e7bd8fc190
Create Date: 2025-09-12 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'abcd1234drop'
down_revision: Union[str, None] = '98e7bd8fc190'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Safely drop columns if they exist
    with op.batch_alter_table('users') as batch_op:
        try:
            batch_op.drop_column('eventbrite_access_token')
        except Exception:
            pass
        try:
            batch_op.drop_column('eventbrite_refresh_token')
        except Exception:
            pass

def downgrade() -> None:
    # Recreate columns (nullable) for rollback
    with op.batch_alter_table('users') as batch_op:
        batch_op.add_column(sa.Column('eventbrite_access_token', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('eventbrite_refresh_token', sa.String(), nullable=True))
