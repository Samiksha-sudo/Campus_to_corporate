# Deploy Skill

description: Build client, push to GitHub, and upload to production server (campustocorporate.co.uk)

## When invoked

When the user types `/deploy` or asks to "deploy", "push to server", "push everywhere", or "push to github and server", follow these steps exactly.

## Steps

### 1. Check git status
Run `git status` to see what files have changed. Show the user a brief summary.

### 2. Build the client
```
cd /c/Users/User/campus-to-corporate/client && NODE_OPTIONS=--max-old-space-size=4096 npm run build
```
If the build fails, stop and report the errors. Do NOT proceed to deploy.

### 3. Upload client build to server
```
scp -r /c/Users/User/campus-to-corporate/client/dist/* campuscorp@138.68.181.160:/home/campuscorp/app/client/dist/
```

### 4. Commit and push to GitHub
Stage all changed files, write a concise commit message summarising what changed, then push to `origin main`.

If the user provided a commit message, use it. Otherwise write one based on the changed files.

```
git add <changed files>
git commit -m "<message>\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git push origin main
```

### 5. Restart server (only if server-side files changed)
If any files under `server/src/` changed, also:
- Run `npx tsc --noEmitOnError false` in `/c/Users/User/campus-to-corporate/server/` to rebuild the server dist
- Upload: `scp -r /c/Users/User/campus-to-corporate/server/dist campuscorp@138.68.181.160:/home/campuscorp/app/server/`
- Restart: `ssh campuscorp@138.68.181.160 "pm2 restart campus-corp-server"`

### 6. Confirm
Report back:
- ✓ Build succeeded
- ✓ Uploaded to campustocorporate.co.uk
- ✓ Pushed to GitHub (commit hash)
- ✓ Server restarted (if applicable)

## Key details
- Server: `campuscorp@138.68.181.160`
- Client dist path on server: `/home/campuscorp/app/client/dist/`
- Server dist path on server: `/home/campuscorp/app/server/dist/`
- PM2 process name: `campus-corp-server`
- GitHub repo: `https://github.com/Samiksha-sudo/Campus_to_corporate`
- Branch: `main`
- Project root: `C:\Users\User\campus-to-corporate`
