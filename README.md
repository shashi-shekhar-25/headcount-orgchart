# Headcount Org Chart

A self-hosted web app for visualizing headcount spreadsheets as an interactive org chart and simulating reorgs by dragging employees onto new managers.

## Features

- Upload `.xlsx` files with Employee ID, Name, Manager ID, Title, and Department
- Validate hierarchy issues such as unknown managers, self-managers, and cycles
- Render a top-down org chart with zoom, pan, and minimap
- Simulate reorgs in the browser with drag-and-drop reparenting
- Track changes and export an updated spreadsheet plus a Changes sheet
- Process all HR data locally in the browser; the Express server only serves static files

## Tech stack

- Node.js + Express
- React + Vite
- `@xyflow/react` for the org chart
- `elkjs` for hierarchical layout
- `read-excel-file` and `ExcelJS` for client-side Excel import/export
- Plain CSS and React `useReducer` for state

## Getting started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — build the frontend into `client/dist`
- `npm start` — serve the built app with Express on port 3000
- `npm test` — run Node test suite for pure functions

## Production

```bash
npm run build
npm start
```

Or with Docker:

```bash
docker build -t headcount-orgchart .
docker run --rm -p 3000:3000 headcount-orgchart
```

## Privacy

Your spreadsheet is parsed entirely in the browser and is never uploaded to the server.

## Sample data

Use the in-app **Sample Template** button to download a five-row example workbook, or use the JSON fixtures in `fixtures/` for tests.

## License

MIT dependencies only. See individual package licenses on npm.
