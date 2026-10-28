# Blog Platform

A responsive React and Vite blog app. Accounts, posts, and comments are stored in the browser's `localStorage`; no server or database installation is required.

## Run locally

Requirements: Node.js 20.19+ (or 22.12+) and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`. Create an account with **Join free** to publish stories and comments. Three sample posts are added automatically on first load.

Build a production bundle with `npm run build`; preview it with `npm run preview`.

## Deploy to GitHub Pages

1. Push this project to a GitHub repository.
2. In the repository, open **Settings → Pages** and set the source to **GitHub Actions**.
3. Push to the `main` branch or run the **Deploy to GitHub Pages** workflow manually from the Actions tab.

The workflow builds the app with the repository-specific base path and publishes `frontend/dist`. It also includes a 404 fallback for direct links to posts. For a `username.github.io` repository, the workflow uses the root path automatically.

## Deploy

This is a static single-page app. The repository includes Vercel and Netlify configuration for the build output and client-side routes. Import the repository in either provider and deploy from the workspace root; the settings use `npm install`, `npm run build`, and `frontend/dist`. No environment variables or database service are required. The same build can be hosted on any static host that serves `frontend/dist` and rewrites unknown paths to `index.html`.

## Persistence and security

This version uses browser `localStorage` as its database. Data is private to the current browser profile and origin: it does not synchronize between devices, browsers, or users. Clearing site data removes the account and content. Passwords are stored as salted PBKDF2-SHA-256 hashes, not plaintext, but browser storage is user-controlled and this client-only authentication is not suitable for sensitive data or production authorization. Use a server-side database and authentication for a shared or production service.

## Features

- Register and sign in; sessions survive a page refresh.
- Search published sample and user-created stories by title or content.
- Read full posts, create posts, and edit or delete posts owned by the signed-in user.
- Add comments and delete your own comments.
- Responsive feed, reading, editor, and account dialog layouts.

`.env.example` is retained for the internship deliverable; this browser-only app does not require environment variables.
