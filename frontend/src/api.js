const DATABASE_KEY = 'blog-market-database-v1';
const TOKEN_KEY = 'blog-market-token';
const PASSWORD_ITERATIONS = 120000;

const samplePosts = [
  {
    title: 'The quiet art of starting again',
    content: `There is a particular kind of courage in beginning again. It rarely announces itself. More often, it looks like opening the notebook on an ordinary Tuesday, making a little room for curiosity, and deciding that the next small step is enough.\n\nWe tend to romanticize fresh starts as dramatic turning points. In practice, they are assembled from modest choices: a walk without a destination, a question asked out loud, or a paragraph written before the day gets busy. Those choices do not erase what came before. They give it somewhere useful to lead.\n\nThe work is not to become a different person overnight. It is to notice what still feels alive in you and give it a little attention. Start there, and let momentum arrive in its own time.`,
    imageUrl: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=85',
  },
  {
    title: 'A slower morning, a clearer mind',
    content: `The first hour of the day has a way of setting the volume for everything that follows. When it begins with notifications and hurried decisions, the mind learns to sprint before it has even found its footing.\n\nA slower morning does not require an elaborate ritual. It can be a glass of water before coffee, five minutes beside an open window, or breakfast eaten without a screen nearby. The point is not to optimize the morning. It is to give your attention a gentle place to land.\n\nOver time, these small pauses become less like a routine and more like a room you know how to enter. The day still brings its noise. You simply meet it with a little more space around you.`,
    imageUrl: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?auto=format&fit=crop&w=1400&q=85',
  },
  {
    title: 'What we learn by paying attention',
    content: `Attention is often treated like a resource to spend. But it is also a way of making contact with the world. The details we notice change what a place, a conversation, or an ordinary afternoon can become.\n\nTry walking a familiar route without trying to get anywhere faster. Notice the names on shop windows, the light collecting on brick, the moment a stranger holds a door. These are not grand discoveries. They are reminders that the world is larger than the list of things we need to finish.\n\nTo pay attention is to practice being here. And being here, even briefly, can make the rest of the day feel more like a life than a sequence of tasks.`,
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=85',
  },
];

function writeDatabase(database) {
  localStorage.setItem(DATABASE_KEY, JSON.stringify(database));
}

function readDatabase() {
  const saved = localStorage.getItem(DATABASE_KEY);
  if (saved) return JSON.parse(saved);

  const now = Date.now();
  const database = {
    users: [],
    posts: samplePosts.map((post, index) => {
      const createdAt = new Date(now - (index + 1) * 86400000).toISOString();
      return { ...post, _id: `sample-${index + 1}`, author: { _id: 'sample-writer', username: 'maya' }, createdAt, updatedAt: createdAt, commentCount: 0 };
    }),
    comments: [],
    activeUserId: null,
  };
  writeDatabase(database);
  return database;
}

function makeId() {
  return crypto.randomUUID();
}

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const saltBytes = Uint8Array.from(atob(salt), (character) => character.charCodeAt(0));
  const hash = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltBytes, iterations: PASSWORD_ITERATIONS, hash: 'SHA-256' }, key, 256);
  return bytesToBase64(hash);
}

function publicUser(user) {
  return { id: user._id, username: user.username, email: user.email, role: 'user' };
}

function requireUser(token) {
  const database = readDatabase();
  if (!token || token !== localStorage.getItem(TOKEN_KEY) || !database.activeUserId) throw new Error('Please sign in to continue.');
  const user = database.users.find((item) => item._id === database.activeUserId);
  if (!user) throw new Error('Your session is no longer valid.');
  return { database, user };
}

function validatePost({ title, content, imageUrl = '' }) {
  if (typeof title !== 'string' || title.trim().length < 4 || title.trim().length > 140) throw new Error('Title must be between 4 and 140 characters.');
  if (typeof content !== 'string' || content.trim().length < 20 || content.trim().length > 30000) throw new Error('Post content must be between 20 and 30,000 characters.');
  if (typeof imageUrl !== 'string' || imageUrl.length > 2000 || (imageUrl && !/^https?:\/\//i.test(imageUrl))) throw new Error('Image URL must start with http:// or https://.');
}

export async function apiRequest(path, { token, ...options } = {}) {
  const method = options.method ?? 'GET';
  const payload = typeof options.body === 'string' ? JSON.parse(options.body) : options.body ?? {};
  const database = readDatabase();

  if (path === '/auth/register' && method === 'POST') {
    const username = typeof payload.username === 'string' ? payload.username.trim() : '';
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const password = payload.password;
    if (username.length < 2 || username.length > 30) throw new Error('Username must be between 2 and 30 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
    if (typeof password !== 'string' || password.length < 8 || password.length > 72) throw new Error('Password must be between 8 and 72 characters.');
    if (database.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) throw new Error('That username is already in use.');
    if (database.users.some((user) => user.email === email)) throw new Error('That email is already in use.');
    const salt = bytesToBase64(crypto.getRandomValues(new Uint8Array(16)));
    const user = { _id: makeId(), username, email, salt, passwordHash: await hashPassword(password, salt), createdAt: new Date().toISOString() };
    database.users.push(user);
    database.activeUserId = user._id;
    const sessionToken = makeId();
    writeDatabase(database);
    localStorage.setItem(TOKEN_KEY, sessionToken);
    return { token: sessionToken, user: publicUser(user) };
  }

  if (path === '/auth/login' && method === 'POST') {
    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const user = database.users.find((item) => item.email === email);
    if (!user || typeof payload.password !== 'string' || await hashPassword(payload.password, user.salt) !== user.passwordHash) throw new Error('Email or password is incorrect.');
    database.activeUserId = user._id;
    const sessionToken = makeId();
    writeDatabase(database);
    localStorage.setItem(TOKEN_KEY, sessionToken);
    return { token: sessionToken, user: publicUser(user) };
  }

  if (path === '/auth/me') return { user: publicUser(requireUser(token).user) };

  if ((path === '/posts' || path.startsWith('/posts?')) && method === 'GET') {
    const query = new URLSearchParams(path.split('?')[1] ?? '').get('q')?.trim().toLowerCase();
    const posts = [...database.posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).filter((post) => !query || `${post.title} ${post.content}`.toLowerCase().includes(query)).map((post) => ({ ...post, commentCount: database.comments.filter((comment) => comment.post === post._id).length }));
    return { posts };
  }

  const commentListMatch = path.match(/^\/posts\/([^/]+)\/comments$/);
  if (commentListMatch && method === 'GET') {
    if (!database.posts.some((post) => post._id === commentListMatch[1])) throw new Error('This post could not be found.');
    return { comments: database.comments.filter((comment) => comment.post === commentListMatch[1]) };
  }
  if (commentListMatch && method === 'POST') {
    const { user } = requireUser(token);
    const content = typeof payload.content === 'string' ? payload.content.trim() : '';
    if (content.length < 2 || content.length > 1200) throw new Error('Comment must be between 2 and 1,200 characters.');
    if (!database.posts.some((post) => post._id === commentListMatch[1])) throw new Error('This post could not be found.');
    const comment = { _id: makeId(), content, author: { _id: user._id, username: user.username }, post: commentListMatch[1], createdAt: new Date().toISOString() };
    database.comments.push(comment);
    writeDatabase(database);
    return { comment };
  }

  const postMatch = path.match(/^\/posts\/([^/?]+)$/);
  if (postMatch && method === 'GET') {
    const post = database.posts.find((item) => item._id === postMatch[1]);
    if (!post) throw new Error('This post could not be found.');
    return { post };
  }
  if (path === '/posts' && method === 'POST') {
    const { database: current, user } = requireUser(token);
    validatePost(payload);
    const now = new Date().toISOString();
    const post = { _id: makeId(), title: payload.title.trim(), content: payload.content.trim(), imageUrl: payload.imageUrl?.trim() ?? '', author: { _id: user._id, username: user.username }, createdAt: now, updatedAt: now, commentCount: 0 };
    current.posts.unshift(post);
    writeDatabase(current);
    return { post };
  }
  if (postMatch && method === 'PATCH') {
    const { database: current, user } = requireUser(token);
    const post = current.posts.find((item) => item._id === postMatch[1]);
    if (!post) throw new Error('This post could not be found.');
    if (post.author._id !== user._id) throw new Error('You can only edit your own posts.');
    validatePost(payload);
    post.title = payload.title.trim();
    post.content = payload.content.trim();
    post.imageUrl = payload.imageUrl?.trim() ?? '';
    post.updatedAt = new Date().toISOString();
    writeDatabase(current);
    return { post };
  }
  if (postMatch && method === 'DELETE') {
    const { database: current, user } = requireUser(token);
    const postIndex = current.posts.findIndex((item) => item._id === postMatch[1]);
    if (postIndex < 0) throw new Error('This post could not be found.');
    if (current.posts[postIndex].author._id !== user._id) throw new Error('You can only delete your own posts.');
    current.posts.splice(postIndex, 1);
    current.comments = current.comments.filter((comment) => comment.post !== postMatch[1]);
    writeDatabase(current);
    return { message: 'Post deleted.' };
  }

  const commentMatch = path.match(/^\/comments\/([^/]+)$/);
  if (commentMatch && method === 'DELETE') {
    const { database: current, user } = requireUser(token);
    const commentIndex = current.comments.findIndex((comment) => comment._id === commentMatch[1]);
    if (commentIndex < 0) throw new Error('This comment could not be found.');
    if (current.comments[commentIndex].author._id !== user._id) throw new Error('You can only delete your own comments.');
    current.comments.splice(commentIndex, 1);
    writeDatabase(current);
    return { message: 'Comment deleted.' };
  }

  throw new Error(`Local data action not found: ${method} ${path}`);
}

export function postExcerpt(content, maxLength = 180) {
  const text = content.replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

export function formatDate(date, options = { month: 'long', day: 'numeric', year: 'numeric' }) {
  return new Intl.DateTimeFormat('en', options).format(new Date(date));
}
