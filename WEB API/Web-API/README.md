# Web-API

Index Number: 75

## About This Project

This project is a simple Node.js REST API built with Express. It uses the data in `seedTuk.json` to serve information about provinces, districts, stations, vehicles, and vehicle locations.

## How It Works

The server starts from `index.js` and listens on port `3000` by default, or on the port provided in the `PORT` environment variable.

The root route serves a browser dashboard that helps you inspect the API visually. The JSON status response is available at `/api`.

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
- `GET /vehicles/:vehicleId` returns vehicle details plus the latest ping in `last_ping`.
- `GET /vehicles/:vehicleId/pings` returns all pings for one vehicle.
- `GET /vehicles/:vehicleId/last-position` returns the latest location for one vehicle.

## Response Shapes

The API returns JSON in these shapes:

- `GET /provinces` -> `[{ province_id, name }]`
- `GET /provinces/:id` -> `{ province_id, name }`
- `GET /districts` -> `[{ district_id, name, province_id }]`
- `GET /districts/:id` -> `{ district_id, name, province_id }`
- `GET /stations` -> `[{ station_id, name, district_id }]`
- `GET /stations/:id` -> `{ station_id, name, district_id }`
- `GET /vehicles` -> `[{ vehicle_id, reg_number, device_id, station_id }]`
- `GET /vehicles/:vehicleId` -> `{ vehicle_id, reg_number, device_id, station_id, last_ping }`
- `GET /vehicles/:vehicleId/last-position` -> `{ vehicle_id, timestamp, lat, lng, speed }`

For the vehicle detail route, `last_ping` is the most recent matching ping or `null` if no pings exist.

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
