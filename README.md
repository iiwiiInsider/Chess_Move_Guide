# Chess Move Guide

A lightweight web app where you can:

- Create a custom-named chess session
- Pick your side (white or black)
- Upload a screenshot of your current board
- Map the board position and get a suggested best move

## Deploy to GitHub Pages

This repository is configured to deploy automatically to GitHub Pages using GitHub Actions.

1. Commit your changes locally.
2. Push to the main branch.
3. In repository Settings > Pages, ensure Source is set to GitHub Actions.
4. Wait for the Deploy to GitHub Pages workflow to complete.
5. Open your site at: `https://iiwiiinsider.github.io/Chess_Move_Guide/`

Quick publish commands:

```bash
git add .
git commit -m "Update labels and deploy-ready frontend"
git push origin main
```

### GitHub Pages Runtime Mode

- On GitHub Pages, there is no Node server, so the app automatically runs in browser storage mode.
- Sessions are saved in localStorage in your browser.
- Screenshot uploads are stored as data URLs in your browser storage for each saved game.
- Best move analysis runs in-browser using chess.js and the same minimax strategy.

When running locally with npm run dev, the app automatically uses the backend API mode.

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm run dev
```

3. Open:

```text
http://localhost:3000
```

## Notes

- The screenshot is uploaded and stored with the session.
- The app currently uses an onboard minimax engine for move recommendation.
- For best results, mirror your screenshot position on the board mapper before running analysis.
