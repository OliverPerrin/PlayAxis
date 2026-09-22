from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func,
)
from app.db.base_class import Base


class CommunityPost(Base):
    __tablename__ = "community_posts"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    content = Column(String(2000), nullable=False)
    sport = Column(String(40), nullable=False, default="general")
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )


class CommunityLike(Base):
    __tablename__ = "community_likes"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(
        Integer, ForeignKey("community_posts.id"), nullable=False, index=True
    )
    __table_args__ = (UniqueConstraint("user_id", "post_id"),)


class CommunityComment(Base):
    __tablename__ = "community_comments"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(
        Integer, ForeignKey("community_posts.id"), nullable=False, index=True
    )
    content = Column(String(1000), nullable=False)
    created_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
