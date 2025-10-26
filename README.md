# CS-490 Team 7 Frontend

Vite + React single-page application for the SalonHub project.

## Prerequisites
- Node.js 18 or newer (LTS recommended)
- npm 9+

## Local Development
```bash
npm install
npm run dev
```
Vite prints a local URL (default `http://127.0.0.1:5173`). The backend API runs separately; configure CORS or a Vite proxy before calling Flask endpoints.

## Production Build
```bash
npm run build
npm run preview
```
The build output lives in `dist/`. Deploy the static assets or serve them via the Flask backend once routing is configured.

## Project Structure
```
eslint.config.js  # Lint rules bundled with Vite's React template
src/              # React components, entry point, and styles
public/           # Static assets copied as-is into the build
```

## Next Steps
- Establish routing, global state, and UI framework conventions.
- Integrate with the backend API once endpoints are available.
- Add formatting/linting automation (Prettier, Husky) per team standards.
- Configure environment variables (Vite uses `import.meta.env.VITE_*`).
