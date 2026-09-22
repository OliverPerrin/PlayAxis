"""Goals, clubs, organised sessions and bounded local-discovery records."""

from alembic import op
from app.models.participation import (
    Goal,
    Club,
    ClubMember,
    SessionEvent,
    SessionAttendee,
    DiscoveryCache,
    ProviderUsage,
)

revision = "participation_20260922"
down_revision = "community_20260922"
branch_labels = None
depends_on = None
TABLES = [
    Goal.__table__,
    Club.__table__,
    ClubMember.__table__,
    SessionEvent.__table__,
    SessionAttendee.__table__,
    DiscoveryCache.__table__,
    ProviderUsage.__table__,
]


def upgrade():
    for table in TABLES:
        table.create(op.get_bind(), checkfirst=True)


def downgrade():
    for table in reversed(TABLES):
        table.drop(op.get_bind(), checkfirst=True)
