# Build & Deployment

## Building for Cloudflare Pages

This project uses a simple build script to prepare files for Cloudflare Pages deployment.

### Quick Start

```bash
# Build the project
npm run build

# The dist/ folder is now ready for deployment
```

### What the build does

The build script (`build.js`) copies only the necessary files to the `dist/` folder:

**Included:**
- All HTML files (`*.html`)
- JavaScript modules (`js/`, `lib/`)
- Styles (`styles/`)
- Documentation (`docs/`)
- Examples (`examples/`)
- Screenshots (`screenshots/`)
- Cloudflare headers (`_headers`)

**Excluded:**
- Development files (`package.json`, `build.js`, etc.)
- Tests (`tests/`, `spec/`)
- Ruby files (`*.rb`, `Gemfile`, etc.)
- Git and IDE files (`.git/`, `.vscode/`, etc.)
- Node modules (`node_modules/`)

### Cloudflare Pages Configuration

When setting up your Cloudflare Pages project:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Root directory:** `dist`

### Local Testing

You can test the built version locally:

```bash
# Build first
npm run build

# Serve the dist folder
cd dist && python3 -m http.server 8000
```

### File Structure After Build

```
dist/
├── index.html
├── oauth-setup.html
├── protocol-help.html
├── simple-calendar-test.html
├── _headers
├── js/
│   ├── app.js
│   ├── calendar-ui.js
│   ├── local-calendar.js
│   └── window-manager.js
├── lib/
│   ├── [all protocol and helper files]
├── styles/
│   └── [all CSS files]
├── docs/
│   └── [all documentation]
├── examples/
│   └── [all example files]
└── screenshots/
    └── [all images]
```