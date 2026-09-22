"""Community posts, comments and reactions."""

from alembic import op
import sqlalchemy as sa

revision = "community_20260922"
down_revision = "standings_cache_20250918"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "community_posts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.String(2000), nullable=False),
        sa.Column("sport", sa.String(40), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_community_posts_user_id", "community_posts", ["user_id"])
    op.create_table(
        "community_likes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "post_id", sa.Integer(), sa.ForeignKey("community_posts.id"), nullable=False
        ),
        sa.UniqueConstraint("user_id", "post_id"),
    )
    op.create_index("ix_community_likes_post_id", "community_likes", ["post_id"])
    op.create_table(
        "community_comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column(
            "post_id", sa.Integer(), sa.ForeignKey("community_posts.id"), nullable=False
        ),
        sa.Column("content", sa.String(1000), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_community_comments_post_id", "community_comments", ["post_id"])


def downgrade():
    op.drop_table("community_comments")
    op.drop_table("community_likes")
    op.drop_table("community_posts")
