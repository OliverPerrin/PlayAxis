from datetime import timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_user, get_optional_user
from app.models.user import User
from app.models.community import CommunityPost, CommunityLike, CommunityComment

router = APIRouter()


class PostIn(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    sport: str = Field(default="general", max_length=40)

    @field_validator("content")
    @classmethod
    def strip_content(cls, text):
        if not text.strip():
            raise ValueError("Write a message first")
        return text.strip()


class CommentIn(PostIn):
    content: str = Field(min_length=1, max_length=1000)


@router.get("")
@router.get("/")
def feed(
    limit: int = Query(30, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    user=Depends(get_optional_user),
):
    posts = (
        db.query(CommunityPost)
        .order_by(CommunityPost.created_at.desc(), CommunityPost.id.desc())
        .offset(skip)
        .limit(limit + 1)
        .all()
    )
    output = []
    for p in posts[:limit]:
        author = db.get(User, p.user_id)
        likes = db.query(CommunityLike).filter_by(post_id=p.id).all()
        comments = (
            db.query(CommunityComment, User)
            .join(User, CommunityComment.user_id == User.id)
            .filter(CommunityComment.post_id == p.id)
            .order_by(CommunityComment.created_at)
            .all()
        )
        output.append(
            {
                "id": p.id,
                "author": author.full_name or "Member",
                "content": p.content,
                "sport": p.sport,
                "created_at": (
                    p.created_at.replace(tzinfo=timezone.utc)
                    if p.created_at.tzinfo is None
                    else p.created_at
                ),
                "own": bool(user and p.user_id == user.id),
                "likes": len(likes),
                "liked": any(user and l.user_id == user.id for l in likes),
                "comments": [
                    {
                        "id": c.id,
                        "author": u.full_name or "Member",
                        "content": c.content,
                        "created_at": (
                            c.created_at.replace(tzinfo=timezone.utc)
                            if c.created_at.tzinfo is None
                            else c.created_at
                        ),
                    }
                    for c, u in comments
                ],
            }
        )
    return {"posts": output, "has_more": len(posts) > limit, "skip": skip}


@router.post("", status_code=201)
def post(body: PostIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = CommunityPost(user_id=user.id, **body.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"id": p.id}


@router.post("/{post_id}/like")
def like(post_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not db.get(CommunityPost, post_id):
        raise HTTPException(404, "Post not found")
    existing = (
        db.query(CommunityLike).filter_by(user_id=user.id, post_id=post_id).first()
    )
    if existing:
        db.delete(existing)
    else:
        db.add(CommunityLike(user_id=user.id, post_id=post_id))
    db.commit()
    return {"liked": not bool(existing)}


@router.post("/{post_id}/comments", status_code=201)
def comment(
    post_id: int,
    body: CommentIn,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if not db.get(CommunityPost, post_id):
        raise HTTPException(404, "Post not found")
    c = CommunityComment(user_id=user.id, post_id=post_id, content=body.content)
    db.add(c)
    db.commit()
    return {"ok": True}


@router.delete("/{post_id}")
def remove(post_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    p = db.get(CommunityPost, post_id)
    if not p or p.user_id != user.id:
        raise HTTPException(404, "Post not found")
    db.query(CommunityLike).filter_by(post_id=post_id).delete()
    db.query(CommunityComment).filter_by(post_id=post_id).delete()
    db.delete(p)
    db.commit()
    return {"deleted": True}
