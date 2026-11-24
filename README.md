# David Hall’s workbench

The portfolio at davidhall.tech uses static HTML, CSS and native JavaScript. Without JavaScript, the same projects and career history are available as a single readable document.

Use Node 22 and run `npm ci`. Run `npm start` to build and serve the site at http://localhost:3000 (the local server requires Python 3). Edit `public/index.html` for copy or `public/workbench/` for visuals and interaction. Rebuild with `npm run build` or run `npm test` to rebuild and check the release.

The build generates a one-column text PDF at `/David-Hall-CV.pdf` and the corresponding plain Markdown at `/profile.md` from the same HTML. The discovery file at `/llms.txt` points to the Markdown. Netlify publishes `build/` using `netlify.toml`. The production branch is selected in the Netlify project.
