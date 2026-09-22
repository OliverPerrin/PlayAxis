import React, { useState } from "react";
import { Link } from "react-router-dom";
import { HeartIcon, ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import {
  getCommunity,
  createPost,
  likePost,
  commentPost,
  deletePost,
} from "../api";
import useResource from "../hooks/useResource";
import {
  PageHeader,
  ResourceState,
  EmptyState,
  formatDate,
  formatTime,
} from "../components/ui";
import { ACTIVITIES } from "../utils/workouts";
function Post({ post, reload, refreshing }) {
  const { user } = useAuth();
  const [comments, setComments] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  async function action(fn) {
    setBusy(true);
    setError("");
    try {
      await fn();
      reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="panel community-post">
      <div className="post-head">
        <div className="avatar">{post.author.slice(0, 2).toUpperCase()}</div>
        <div className="post-author">
          <h3>{post.author}</h3>
          <p>
            {formatDate(post.created_at)} · {formatTime(post.created_at)} ·{" "}
            {post.sport}
          </p>
        </div>
        {post.own &&
          (confirm ? (
            <div>
              <button
                className="text-button danger"
                disabled={busy || refreshing}
                onClick={() => action(() => deletePost(post.id))}
              >
                Confirm delete
              </button>
              <button
                style={{ marginLeft: 12 }}
                className="text-button"
                onClick={() => setConfirm(false)}
              >
                Keep
              </button>
            </div>
          ) : (
            <button
              className="text-button danger"
              onClick={() => setConfirm(true)}
            >
              Delete
            </button>
          ))}
      </div>
      <p className="post-body">{post.content}</p>
      <div className="post-actions">
        {user ? (
          <button
            disabled={busy || refreshing}
            aria-pressed={post.liked}
            className={post.liked ? "selected" : ""}
            onClick={() => action(() => likePost(post.id))}
          >
            <HeartIcon />
            {post.likes} {post.likes === 1 ? "like" : "likes"}
          </button>
        ) : (
          <Link className="text-link" to="/auth?next=/community">
            Sign in to react
          </Link>
        )}
        <button onClick={() => setComments((v) => !v)} aria-expanded={comments}>
          <ChatBubbleLeftIcon />
          {post.comments.length} comments
        </button>
      </div>
      {comments && (
        <div className="comment-list">
          {post.comments.length ? (
            post.comments.map((c) => (
              <div key={c.id} className="comment">
                <strong>{c.author}</strong>
                <p>{c.content}</p>
              </div>
            ))
          ) : (
            <p className="small muted">Start the conversation.</p>
          )}
          {user && (
            <form
              className="comment-form"
              onSubmit={(e) => {
                e.preventDefault();
                action(async () => {
                  await commentPost(post.id, text.trim());
                  setText("");
                });
              }}
            >
              <input
                aria-label="Write a comment"
                placeholder="Add a comment"
                maxLength={1000}
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button
                className="button secondary"
                disabled={busy || refreshing || !text.trim()}
              >
                Post
              </button>
            </form>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
    </article>
  );
}
export default function CommunityPage() {
  const { user } = useAuth();
  const [pages, setPages] = useState(1);
  const resource = useResource(`community:${user?.id || "guest"}`, () =>
    getCommunity(pages),
  );
  const [text, setText] = useState("");
  const [sport, setSport] = useState("general");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function publish(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createPost({ content: text.trim(), sport });
      setText("");
      resource.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="Better, together"
        title="The community"
        description="Share a small win, find a training partner, or tell us about a great place to play."
      />
      <div className="feed-layout">
        <div className="page-stack">
          {user ? (
            <form className="panel panel-pad" onSubmit={publish}>
              <label htmlFor="post-content">What’s moving you today?</label>
              <textarea
                id="post-content"
                style={{ width: "100%" }}
                rows={3}
                maxLength={2000}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="A new route, a good session, an open invitation…"
                required
              />
              <div
                className="form-actions"
                style={{ justifyContent: "space-between" }}
              >
                <select
                  aria-label="Post sport"
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                >
                  <option value="general">General</option>
                  {ACTIVITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  className="button primary"
                  disabled={busy || !text.trim()}
                >
                  {busy ? "Posting…" : "Share with the community"}
                </button>
              </div>
              {error && (
                <p role="alert" className="notice error">
                  {error}
                </p>
              )}
              <p className="source-note">
                Posts are public. Keep personal contact details out of your
                post.
              </p>
            </form>
          ) : (
            <section className="panel panel-pad">
              <h3>A good conversation starts with you.</h3>
              <p className="muted small" style={{ margin: "10px 0 18px" }}>
                Join in to share an update or react to someone’s progress.
              </p>
              <Link className="button primary" to="/auth?next=/community">
                Join the conversation
              </Link>
            </section>
          )}
          <ResourceState resource={resource}>
            {resource.data?.posts?.length ? (
              resource.data.posts.map((post) => (
                <Post
                  post={post}
                  key={post.id}
                  reload={resource.reload}
                  refreshing={resource.loading || !!resource.error}
                />
              ))
            ) : (
              <section className="panel">
                <EmptyState title="Be the first to say hello">
                  This is a new conversation. Share a route you love or a
                  session you’re proud of.
                </EmptyState>
              </section>
            )}
          </ResourceState>
          {resource.data?.has_more && (
            <button
              className="button secondary"
              disabled={resource.loading}
              onClick={() => {
                setPages((p) => p + 1);
                resource.reload();
              }}
            >
              {resource.loading ? "Loading…" : "Load older posts"}
            </button>
          )}
        </div>
        <aside className="training-note" style={{ alignSelf: "start" }}>
          <p className="eyebrow">Everyone belongs</p>
          <h3>Good sport starts here.</h3>
          <p>
            Celebrate effort at every level. Be kind, keep it relevant, and
            respect each other’s privacy.
          </p>
          <Link className="text-link" to="/contact">
            Report a concern
          </Link>
        </aside>
      </div>
    </>
  );
}
