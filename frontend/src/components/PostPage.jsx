import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarDays, MessageCircle, MoreHorizontal, Send, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest, formatDate } from '../api.js';

const fallbackImage = 'https://images.unsplash.com/photo-1455390582262-044cdee27799?auto=format&fit=crop&w=1500&q=85';

export function PostPage({ token, user, onRequireAuth }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingComment, setSavingComment] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([apiRequest(`/posts/${id}`), apiRequest(`/posts/${id}/comments`)]).then(([postData, commentData]) => {
      if (!active) return;
      setPost(postData.post);
      setComments(commentData.comments);
      setError('');
    }).catch((requestError) => { if (active) setError(requestError.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function addComment(event) {
    event.preventDefault();
    if (!token) return onRequireAuth();
    setSavingComment(true);
    setError('');
    try {
      const { comment } = await apiRequest(`/posts/${id}/comments`, { method: 'POST', token, body: JSON.stringify({ content: commentText }) });
      setComments((current) => [...current, comment]);
      setCommentText('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingComment(false);
    }
  }

  async function deleteComment(commentId) {
    try {
      await apiRequest(`/comments/${commentId}`, { method: 'DELETE', token });
      setComments((current) => current.filter((comment) => comment._id !== commentId));
    } catch (requestError) { setError(requestError.message); }
  }

  async function deletePost() {
    if (!window.confirm('Delete this story and its comments? This cannot be undone.')) return;
    try {
      await apiRequest(`/posts/${id}`, { method: 'DELETE', token });
      navigate('/');
    } catch (requestError) { setError(requestError.message); }
  }

  if (loading) return <main className="post-loading"><span className="loader" /> Opening the story...</main>;
  if (error && !post) return <main className="not-found"><p className="eyebrow">STORY NOT FOUND</p><h1>{error}</h1><Link className="button button-dark" to="/"><ArrowLeft size={16} /> Back to the journal</Link></main>;
  if (!post) return null;

  const isOwner = user?.id === String(post.author?._id);
  return (
    <main className="reading-page">
      <div className="reading-topline"><Link className="back-link" to="/"><ArrowLeft size={16} /> All stories</Link>{isOwner && <div className="post-actions"><button className="icon-button" type="button" aria-label="More story actions" onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={21} /></button>{menuOpen && <div className="post-actions-menu"><Link to={`/posts/${id}/edit`}>Edit story <ArrowLeft size={14} /></Link><button type="button" onClick={deletePost}><Trash2 size={14} /> Delete story</button></div>}</div>}</div>
      {error && <div className="notice notice-error" role="alert">{error}</div>}
      <article className="reading-article">
        <div className="article-meta"><span className="category-dot" /> FIELD NOTES <span className="meta-divider">/</span> {formatDate(post.createdAt)}</div>
        <h1>{post.title}</h1>
        <div className="reading-byline"><span className="avatar">{(post.author?.username ?? 'G').slice(0, 1).toUpperCase()}</span><span><strong>{post.author?.username ?? 'Guest writer'}</strong><small>Published {formatDate(post.createdAt)}</small></span><span className="byline-divider" /><span className="reading-time"><CalendarDays size={15} /> A thoughtful read</span></div>
        <img className="reading-cover" src={post.imageUrl || fallbackImage} alt="" onError={(event) => { event.currentTarget.src = fallbackImage; }} />
        <div className="article-body">{post.content.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      </article>
      <section className="comments-section" aria-labelledby="comments-title">
        <div className="comments-heading"><div><p className="eyebrow">THE CONVERSATION</p><h2 id="comments-title">Reader notes <span>{comments.length}</span></h2></div><MessageCircle size={21} /></div>
        <form className="comment-form" onSubmit={addComment}><span className="avatar">{user?.username?.slice(0, 1).toUpperCase() ?? '?'}</span><div className="comment-input-wrap"><textarea aria-label="Write a comment" value={commentText} maxLength="1200" rows="2" onChange={(event) => setCommentText(event.target.value)} placeholder={user ? 'Add something thoughtful...' : 'Sign in to join the conversation'} onFocus={() => { if (!user) onRequireAuth(); }} /><div className="comment-form-bottom"><span>{commentText.length} / 1,200</span><button className="button button-dark comment-submit" type="submit" disabled={savingComment || !commentText.trim()}>{savingComment ? 'Sending...' : 'Add note'}<Send size={14} /></button></div></div></form>
        {comments.length === 0 ? <p className="no-comments">No notes yet. Start the conversation.</p> : <div className="comment-list">{comments.map((comment) => <article className="comment" key={comment._id}><span className="avatar avatar-small">{(comment.author?.username ?? 'G').slice(0, 1).toUpperCase()}</span><div className="comment-main"><div className="comment-heading"><strong>{comment.author?.username ?? 'Guest writer'}</strong><time>{formatDate(comment.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</time>{(user?.id === String(comment.author?._id) || user?.role === 'admin') && <button className="delete-comment" type="button" onClick={() => deleteComment(comment._id)} aria-label="Delete comment"><Trash2 size={15} /></button>}</div><p>{comment.content}</p></div></article>)}</div>}
      </section>
    </main>
  );
}
