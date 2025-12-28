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
cd website
npm install
npm run build
npm run preview
```

### Deployment Flow

1. Push changes to `main` branch
2. GitHub Actions builds the website
3. Deploys to GitHub Pages
4. Available at: https://statekeeper.oxog.dev

### Files

- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `website/public/CNAME` - Custom domain configuration
- `website/dist/` - Built files (generated)

### Troubleshooting

**Custom domain not working?**
- Check DNS propagation (can take up to 24 hours)
- Verify CNAME file is in the dist folder after build
- Check GitHub Pages settings

**Build failing?**
- Check Actions tab for error logs
- Verify Node.js version (20.x)
- Ensure all dependencies are in package.json

**404 on routes?**
- SPA routing is handled by React Router
- GitHub Pages serves all routes through index.html
