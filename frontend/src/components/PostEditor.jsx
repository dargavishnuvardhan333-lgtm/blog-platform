import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, ImagePlus } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api.js';

export function PostEditor({ token, user, onRequireAuth }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [form, setForm] = useState({ title: '', content: '', imageUrl: '' });
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) return;
    apiRequest(`/posts/${id}`).then(({ post }) => {
      if (user && String(post.author?._id) !== user.id) {
        setError('You can only edit a story you wrote.');
        return;
      }
      setForm({ title: post.title, content: post.content, imageUrl: post.imageUrl ?? '' });
    }).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, [editing, id, user]);

  async function submit(event) {
    event.preventDefault();
    if (!user || !token) return onRequireAuth();
    setSaving(true);
    setError('');
    try {
      const { post } = await apiRequest(editing ? `/posts/${id}` : '/posts', { method: editing ? 'PATCH' : 'POST', token, body: JSON.stringify(form) });
      navigate(`/posts/${post._id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="editor-page">
      <Link className="back-link" to={editing ? `/posts/${id}` : '/'}><ArrowLeft size={16} /> {editing ? 'Back to story' : 'Back to journal'}</Link>
      <div className="editor-heading"><p className="eyebrow">YOUR NEXT GOOD IDEA</p><h1>{editing ? 'Shape the story.' : 'Start a story.'}</h1><p>Take your time. The best things are worth saying well.</p></div>
      {!user && <div className="notice">Sign in before publishing your story. <button className="text-button" type="button" onClick={onRequireAuth}>Sign in <ArrowUpRight size={14} /></button></div>}
      {loading ? <div className="feed-loading"><span className="loader" /> Opening your draft...</div> : (
        <form className="editor-form" onSubmit={submit}>
          <label className="editor-label">Story title<input required minLength="4" maxLength="140" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Give your idea a name" /></label>
          <label className="editor-label">Cover image URL <span className="optional-label">OPTIONAL</span><span className="input-with-icon"><ImagePlus size={17} /><input type="url" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://..." /></span></label>
          {form.imageUrl && <img className="editor-preview" src={form.imageUrl} alt="Cover preview" onError={(event) => { event.currentTarget.style.display = 'none'; }} onLoad={(event) => { event.currentTarget.style.display = 'block'; }} />}
          <label className="editor-label">Your story<textarea required minLength="20" maxLength="30000" rows="15" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Begin anywhere..." /></label>
          <div className="editor-footer"><span>{form.content.length.toLocaleString()} / 30,000 characters</span><button className="button button-dark" type="submit" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Publish story'}<ArrowUpRight size={16} /></button></div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
      )}
    </main>
  );
}
