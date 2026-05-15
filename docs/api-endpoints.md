# F1 AeroLab — REST API Reference

Base URL: `http://localhost:3001`
Interactive docs: `http://localhost:3001/api` (Swagger UI)

## Endpoints

### GET /health
Returns server status.
**Response:** `{ "status": "ok" }`

---

### POST /simulation/run
One-shot aerodynamic calculation (no WebSocket needed).
**Body:**
```json
{ "speed": 200, "wingAngle": 15, "weight": 740, "dragCoefficient": 0.95 }
```
**Response:**
```json
{
  "downforce": 4253, "drag": 2693, "lift": -4253,
  "aeroEfficiency": 1.579, "grip": 1.586, "weightTransfer": 1850,
  "chartData": [...]
}
```

---

### GET /presets
Returns all saved presets, newest first.
**Response:** array of Preset objects

### POST /presets
Saves a new car setup preset.
**Body:**
```json
{ "name": "Monaco Setup", "speed": 240, "wingAngle": 20, "weight": 795, "dragCoefficient": 1.1 }
```

### GET /presets/:id
Returns a single preset by ID.

### DELETE /presets/:id
Deletes a preset by ID.
