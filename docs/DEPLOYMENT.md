# Deployment Guide

Order matters: **database, then API, then frontend, then update CORS.**

```
Browser -> Vercel/Netlify (React)  --HTTPS-->  Render (Express API)  -->  MongoDB Atlas
```

## 0. Before you start

- [ ] Code is pushed to GitHub (one repo with `client/` and `server/`).
- [ ] `git status` shows no `.env` files or `node_modules/` committed.
- [ ] `npm run e2e` passes locally.

## 1. Database: MongoDB Atlas (free M0)

1. Create an account at mongodb.com/atlas and a **free M0 cluster** (pick a region close to your Render region).
2. **Database Access -> Add New Database User**: username + a strong password (avoid special characters, or URL-encode them, e.g. `@` becomes `%40`). Give it "Read and write to any database".
3. **Network Access -> Add IP Address -> Allow access from anywhere (`0.0.0.0/0`)**. Render's free tier has no fixed IP, so this is required. The database user's password is what protects it.
4. **Database -> Connect -> Drivers**: copy the connection string and add the database name before the `?`:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/staffsync?retryWrites=true&w=majority
   ```
5. Test it and load demo data from your own machine (the inline variable overrides your local `.env`):
   ```bash
   cd server
   MONGO_URI="mongodb+srv://..." SEED_HR_PASSWORD="choose-a-strong-one" SEED_PASSWORD="another-one" npm run seed -- --reset
   ```
   Then check Atlas -> Browse Collections: you should see `users`, `attendances`, `leaves`, etc.

> Do not use the default demo passwords on a public URL. Set `SEED_HR_PASSWORD` and `SEED_PASSWORD` as above.

## 2. Backend: Render

**Option A: Blueprint (uses `render.yaml` in the repo root)**
1. Render dashboard -> **New + -> Blueprint** -> connect your GitHub repo.
2. When prompted, fill in `MONGO_URI` (Atlas string) and `CLIENT_URL` (you can put a placeholder for now). `JWT_SECRET` is generated for you.

**Option B: manual**
1. **New + -> Web Service** -> select the repo.
2. Settings:

| Setting | Value |
|---|---|
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/health` |
| Instance type | Free |

3. Environment variables:

| Key | Value |
|---|---|
| `MONGO_URI` | your Atlas connection string |
| `JWT_SECRET` | a long random string (e.g. `openssl rand -hex 32`) |
| `JWT_EXPIRES_IN` | `1d` |
| `CLIENT_URL` | your frontend URL (set after step 3) |
| `NODE_VERSION` | `20` |

4. After deploy, open `https://<service>.onrender.com/health`. It should return `{"status":"ok",...}`.

Free instances **sleep after ~15 minutes idle**; the first request afterwards takes about 30-60 seconds. Open the site a minute before a demo.

## 3. Frontend: Vercel (or Netlify)

The SPA fallback files are already in the repo: `client/vercel.json` (Vercel) and `client/public/_redirects` (Netlify). They make `/leaves`, `/dashboard`, etc. load on refresh instead of 404.

**Vercel**
1. **Add New -> Project** -> import the repo.
2. Root Directory: `client`. Framework preset: Vite (auto-detected). Build: `npm run build`. Output: `dist`.
3. Environment variable (must be set **before** the build, because Vite bakes it in):
   `VITE_API_URL` = `https://<service>.onrender.com/api`
4. Deploy and copy the URL.

**Netlify**
1. **Add new site -> Import from Git**.
2. Base directory `client`, build command `npm run build`, publish directory `client/dist`.
3. Add the same `VITE_API_URL` variable. Deploy.

Changing `VITE_API_URL` later requires a **redeploy** of the frontend.

## 4. Connect them (CORS)

1. Render -> your service -> Environment -> set `CLIENT_URL` to the exact frontend origin, e.g. `https://staffsync.vercel.app` (no path; a trailing slash is tolerated). Multiple origins can be comma-separated.
2. Save; Render redeploys automatically.

## 5. Verify

```bash
cd server
API_URL=https://<service>.onrender.com/api SEED_HR_PASSWORD="..." SEED_PASSWORD="..." npm run e2e
```
Then follow `docs/E2E_WALKTHROUGH.md` in the browser on the live URL, including a hard refresh on `/leaves`.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Browser console: "blocked by CORS policy" | `CLIENT_URL` on Render doesn't exactly match the frontend origin (scheme + host). Fix and let Render redeploy. |
| Login page shows "Network Error" | `VITE_API_URL` is missing or wrong, or the API is asleep. Open `/health` first; redeploy the frontend after changing the variable. |
| 404 when refreshing `/dashboard` | The redirect file wasn't deployed. Confirm `client/vercel.json` or `client/public/_redirects` is committed, and the Vercel root directory is `client`. |
| Render logs: `MongooseServerSelectionError` | Atlas Network Access doesn't allow `0.0.0.0/0`, or the password in `MONGO_URI` is wrong or not URL-encoded. |
| Render logs: `JWT_SECRET is not set` | Add the variable in Render's Environment tab. |
| Login returns 401 for seeded users | The seed ran against a different database. Check the DB name in `MONGO_URI` and re-run the seed with `--reset`. |
| First request very slow | Free tier cold start. Expected. |
| Mixed-content errors | `VITE_API_URL` must be `https://`, not `http://`. |
