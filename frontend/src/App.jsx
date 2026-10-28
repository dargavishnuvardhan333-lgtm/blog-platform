import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BookOpen, Feather, LogOut, Menu, Plus, Search, X } from 'lucide-react';
import { apiRequest } from './api.js';
import { AuthDialog } from './components/AuthDialog.jsx';
import { PostCard, PostFeature } from './components/PostCard.jsx';
import { PostEditor } from './components/PostEditor.jsx';
import { PostPage } from './components/PostPage.jsx';
import './blog.css';

const savedToken = localStorage.getItem('blog-market-token');

function Site() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(savedToken);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    apiRequest('/auth/me', { token }).then(({ user: currentUser }) => setUser(currentUser)).catch(() => {
      localStorage.removeItem('blog-market-token');
      setToken(null);
    });
  }, [token]);

  function handleSession(session) {
    localStorage.setItem('blog-market-token', session.token);
    setToken(session.token);
    setUser(session.user);
    setAuthOpen(false);
  }

  function signOut() {
    localStorage.removeItem('blog-market-token');
    setToken(null);
    setUser(null);
  }

  function requestAuth(mode = 'login') {
    setAuthMode(mode);
    setAuthOpen(true);
  }

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="site-shell">
        <header className="topbar">
          <Link className="brand" to="/" aria-label="Blog Platform home"><span className="brand-mark"><BookOpen size={19} strokeWidth={2.2} /></span><span>blog<span className="brand-light">platform</span></span></Link>
          <div className="topbar-search"><Search size={17} /><SearchBox /></div>
          <button className="mobile-menu-toggle icon-button" type="button" aria-label="Toggle navigation" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          <nav className={`topbar-actions ${mobileMenuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            {user ? <><Link className="write-link" to="/write" onClick={() => setMobileMenuOpen(false)}><Plus size={16} /> Write</Link><span className="nav-divider" /><span className="user-greeting"><span className="avatar">{user.username.slice(0, 1).toUpperCase()}</span><span>{user.username}</span></span><button className="icon-button signout-button" onClick={signOut} type="button" aria-label="Sign out" title="Sign out"><LogOut size={17} /></button></> : <><button className="text-button" type="button" onClick={() => requestAuth('login')}>Sign in</button><button className="button button-dark nav-join" type="button" onClick={() => requestAuth('register')}>Join free <ArrowUpRight size={15} /></button></>}
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/posts/:id" element={<PostPage token={token} user={user} onRequireAuth={() => requestAuth('login')} />} />
          <Route path="/write" element={<PostEditor token={token} user={user} onRequireAuth={() => requestAuth('login')} />} />
          <Route path="/posts/:id/edit" element={<PostEditor token={token} user={user} onRequireAuth={() => requestAuth('login')} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <footer className="site-footer"><Link className="brand footer-brand" to="/"><span className="brand-mark"><BookOpen size={17} /></span><span>blog<span className="brand-light">platform</span></span></Link><p>Good ideas deserve a place to grow.</p><span className="footer-note">A quieter corner of the internet <span>·</span> 2026</span></footer>
        {authOpen && <AuthDialog initialMode={authMode} onClose={() => setAuthOpen(false)} onSession={handleSession} />}
      </div>
    </BrowserRouter>
  );
}

function SearchBox() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') ?? '');
  useEffect(() => setValue(searchParams.get('q') ?? ''), [searchParams]);

  function submit(event) {
    event.preventDefault();
    const query = value.trim();
    navigate(query ? `/?q=${encodeURIComponent(query)}` : '/');
  }

  return <form className="search-form" onSubmit={submit} role="search"><input aria-label="Search articles" placeholder="Search stories..." value={value} onChange={(event) => setValue(event.target.value)} />{value && <button className="search-clear" type="button" aria-label="Clear search" onClick={() => { setValue(''); navigate('/'); }}><X size={14} /></button>}<button className="search-submit" type="submit" aria-label="Submit search"><ArrowUpRight size={15} /></button></form>;
}

function HomePage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiRequest(`/posts${query ? `?q=${encodeURIComponent(query)}` : ''}`).then(({ posts: results }) => { if (active) setPosts(results); }).catch((requestError) => { if (active) setError(requestError.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query]);

  const featured = posts[0];
  return (
    <main className="main-content">
      <section className="welcome-row"><div><p className="eyebrow"><span className="eyebrow-line" /> THE OPEN JOURNAL</p><h1>Ideas worth <em>keeping.</em></h1><p className="welcome-copy">Thoughtful writing for curious minds. Find your next read, or share something of your own.</p></div><div className="welcome-stamp"><Feather size={22} strokeWidth={1.6} /><span>Read<br />widely.</span></div></section>
      <section className="feed-section" aria-labelledby="latest-heading">
        <div className="section-heading"><div><p className="eyebrow">A LITTLE SOMETHING TO READ</p><h2 id="latest-heading">{query ? <>Results for <span className="query-label">“{query}”</span></> : 'Fresh from the journal'}</h2></div><span className="post-count">{loading ? '…' : `${posts.length} ${posts.length === 1 ? 'story' : 'stories'}`}</span></div>
        {loading && <div className="feed-loading" role="status"><span className="loader" /> Gathering the latest stories...</div>}
        {error && <div className="notice notice-error" role="alert">{error}<button className="text-button" onClick={() => window.location.reload()} type="button">Try again</button></div>}
        {!loading && !error && posts.length === 0 && <div className="empty-state"><span className="empty-icon"><Search size={22} /></span><h3>{query ? 'No stories found' : 'The first page is still blank'}</h3><p>{query ? 'Try another title or phrase.' : 'Sample posts will appear here once the database is seeded.'}</p>{query && <Link className="text-button" to="/">Clear search <ArrowUpRight size={14} /></Link>}</div>}
        {!loading && !error && featured && <><PostFeature post={featured} />{posts.length > 1 && <div className="post-grid">{posts.slice(1).map((post, index) => <PostCard key={post._id} post={post} index={index} />)}</div>}</>}
      </section>
      <div className="feed-end"><span /><small>YOU’RE ALL CAUGHT UP</small><span /></div>
    </main>
  );
}

function NotFound() {
  return <main className="not-found"><p className="eyebrow">404 · LOST IN THE MARGINS</p><h1>This page wandered off.</h1><Link className="button button-dark" to="/"><ArrowLeft size={16} /> Back to the journal</Link></main>;
}

export default function App() {
  return <Site />;
}
