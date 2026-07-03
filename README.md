# Chess Move Guide

A lightweight web app where you can:

- Create a custom-named chess session
- Pick your side (white or black)
- Upload a screenshot of your current board
- Map the board position and get a suggested best move

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
- This project is configured for local server usage only.
