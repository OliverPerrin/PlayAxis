"""Add the two historical Eventbrite token columns.

The previous revision already creates the application tables. This revision
must not recreate them or drop them on downgrade.
"""

from alembic import op
import sqlalchemy as sa

revision = "98e7bd8fc190"
down_revision = "778b17015fd0"
branch_labels = None
depends_on = None


def upgrade():
    columns = {c["name"] for c in sa.inspect(op.get_bind()).get_columns("users")}
    with op.batch_alter_table("users") as batch:
        for name in ["eventbrite_access_token", "eventbrite_refresh_token"]:
            if name not in columns:
                batch.add_column(sa.Column(name, sa.String(), nullable=True))


def downgrade():
    columns = {c["name"] for c in sa.inspect(op.get_bind()).get_columns("users")}
    with op.batch_alter_table("users") as batch:
        for name in ["eventbrite_access_token", "eventbrite_refresh_token"]:
            if name in columns:
                batch.drop_column(name)
