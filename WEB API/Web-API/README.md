# Web-API

Index Number: 75

## About This Project

This project is a simple Node.js REST API built with Express. It uses the data in `seedTuk.json` to serve information about provinces, districts, stations, vehicles, and vehicle ping history.

## How It Works

The server starts from `index.js` and listens on port `3000` by default, or on the port provided in the `PORT` environment variable.

The root route now serves a browser dashboard that helps you inspect the API visually. The JSON status response is available at `/api`.

Available routes:

- `GET /` opens the web UI.
- `GET /api` returns a basic status response.
- `GET /provinces` returns all provinces.
- `GET /provinces/:provinceId` returns one province by ID.
- `GET /districts` returns all districts.
- `GET /districts/:districtId` returns one district by ID.
- `GET /stations` returns all stations.
- `GET /stations/:stationId` returns one station by ID.
- `GET /vehicles` returns all vehicles.
- `GET /vehicles/:vehicleId` returns vehicle details and the latest ping.
- `GET /vehicles/:vehicleId/pings` returns all pings for one vehicle.
- `GET /vehicles/:vehicleId/last-position` returns the latest location for one vehicle.

## Data Flow

1. The app loads the JSON data from `seedTuk.json`.
2. Each route reads from that in-memory data.
3. The API responds with JSON output for the requested resource.
4. If a requested ID does not exist, the API returns a `404` response with an error message.

## Run The Project

```bash
npm install
npm start
```

Then open `http://localhost:3000` in your browser to use the dashboard, or test the API routes with Postman.
