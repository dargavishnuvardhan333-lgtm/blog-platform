import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, postExcerpt } from '../api.js';

const fallbackImage = 'https://images.unsplash.com/photo-1455390582262-044cdee27799?auto=format&fit=crop&w=1200&q=80';

function PostImage({ src, alt, className = '' }) {
  return <img className={className} src={src || fallbackImage} alt={alt} loading="lazy" onError={(event) => { event.currentTarget.src = fallbackImage; }} />;
}

export function PostFeature({ post }) {
  return (
    <article className="feature-card">
      <Link to={`/posts/${post._id}`} className="feature-image-link" aria-label={`Read ${post.title}`}>
        <PostImage className="feature-image" src={post.imageUrl} alt="" />
        <span className="image-label">EDITOR’S PICK <ArrowUpRight size={14} /></span>
      </Link>
      <div className="feature-copy">
        <div className="article-meta"><span className="category-dot" /> FIELD NOTES <span className="meta-divider">/</span> {formatDate(post.createdAt, { month: 'short', day: 'numeric' })}</div>
        <Link to={`/posts/${post._id}`} className="article-title-link"><h3>{post.title}</h3></Link>
        <p className="article-excerpt">{postExcerpt(post.content, 255)}</p>
        <div className="feature-bottom"><Author post={post} /><Link className="read-link" to={`/posts/${post._id}`}>Read story <ArrowUpRight size={15} /></Link></div>
      </div>
    </article>
  );
}

export function PostCard({ post, index = 0 }) {
  return (
    <article className="post-card" style={{ '--card-index': index }}>
      <Link to={`/posts/${post._id}`} className="post-card-image"><PostImage src={post.imageUrl} alt="" /><span className="card-arrow"><ArrowUpRight size={17} /></span></Link>
      <div className="post-card-content">
        <div className="article-meta"><span className="category-dot" /> JOURNAL <span className="meta-divider">/</span> {formatDate(post.createdAt, { month: 'short', day: 'numeric' })}</div>
        <Link to={`/posts/${post._id}`} className="article-title-link"><h3>{post.title}</h3></Link>
        <p className="article-excerpt">{postExcerpt(post.content, 128)}</p>
        <div className="post-card-footer"><Author post={post} /><span className="comment-count"><MessageCircle size={14} /> {post.commentCount ?? 0}</span></div>
      </div>
    </article>
  );
}

function Author({ post }) {
  const username = post.author?.username ?? 'Guest writer';
  return <span className="author-line"><span className="avatar avatar-small">{username.slice(0, 1).toUpperCase()}</span><span>by <strong>{username}</strong></span></span>;
}
