# Website Deployment Guide

## GitHub Pages Deployment

The StateKeeper website is automatically deployed to GitHub Pages using GitHub Actions.

### Setup Instructions

1. **Enable GitHub Pages**
   - Go to your repository Settings
   - Navigate to Pages section
   - Source: Select "GitHub Actions"

2. **Configure Custom Domain**
   - In the same Pages section
   - Add custom domain: `statekeeper.oxog.dev`
   - DNS Configuration (on your domain provider):
     - Add a CNAME record pointing to: `ersinkoc.github.io`
     - Or add A records pointing to GitHub's IPs:
       ```
       185.199.108.153
       185.199.109.153
       185.199.110.153
       185.199.111.153
       ```

3. **Automatic Deployment**
   - Every push to `main` branch that modifies `website/**` files triggers deployment
   - Manual deployment: Go to Actions → Deploy Website → Run workflow

### Build Locally

```bash
# First build the main package (website depends on it)
npm install
npm run build

# Then build the website
cd website
npm install
npm run build
npm run preview
```

### Deployment Flow

1. Push changes to `main` branch
2. GitHub Actions:
   - Builds the main @oxog/statekeeper package
   - Installs website dependencies (includes local package)
   - Builds the website
   - Verifies CNAME file exists
   - Deploys to GitHub Pages
3. Available at: https://statekeeper.oxog.dev

### Files

- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `website/public/CNAME` - Custom domain configuration (copied to dist during build)
- `website/vite.config.ts` - Vite configuration with base path
- `website/dist/` - Built files (generated)

### Important Notes

- The website depends on the main package via `"file:.."` in package.json
- The main package MUST be built before building the website
- CNAME file is automatically copied from `public/` to `dist/` during build
- Vite base path is set to `/` for custom domain

### Troubleshooting

**Custom domain not working?**
- Check DNS propagation (can take up to 24 hours)
- Verify CNAME file is in the dist folder after build
- Check GitHub Pages settings
- Ensure "Enforce HTTPS" is enabled in Pages settings

**Build failing?**
- Check Actions tab for error logs
- Verify Node.js version (20.x)
- Ensure main package builds successfully first
- Check that website/package.json has `"@oxog/statekeeper": "file:.."`

**Module not found errors?**
- Run `npm install` in both root and website directories
- Ensure main package is built (`npm run build` in root)
- Check that dist/ folder exists in root with built files

**404 on routes?**
- SPA routing is handled by React Router
- GitHub Pages serves all routes through index.html
- Verify base path in vite.config.ts is set to `/`
