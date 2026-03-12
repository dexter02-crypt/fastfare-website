---
description: Deploy FastFare Website to VPS (srv1362277)
---

# Deploy FastFare Website to VPS

## VPS Details
- **Server**: `root@srv1362277`
- **Project path**: `/var/www/fastfare/frontend-ui`
- **Repo**: `dexter02-crypt/fastfare-website` (branch: `main`)

## Steps

### 1. Push code to GitHub
// turbo
```bash
git add . && git commit -m "<message>" && git push
```
Run from: `c:\Users\Shikhar\Desktop\FastFare Website`

### 2. Give user the VPS deploy command
Provide this single copy-paste command for the user to run on their VPS via SSH:

```bash
cd /var/www/fastfare/frontend-ui && git stash && git pull origin main && npm install && npm run build
```

### Notes
- The user SSHs into the VPS with: `ssh root@srv1362277`
- Always `git stash` before `git pull` to avoid merge conflicts from lock file changes on the server
- The frontend is a Vite + React app; `npm run build` outputs to `dist/`
- There is also an older copy at `/var/www/FastFare-Website-1/frontend-ui` — do NOT use this one
