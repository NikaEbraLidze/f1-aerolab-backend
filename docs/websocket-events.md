# F1 AeroLab — WebSocket Events

Server runs on `http://localhost:3001`. Connect with Socket.io client.

## Client → Server

### `simulate:update`
Sent whenever the user changes any parameter.

```json
{
  "speed": 280,
  "wingAngle": 15,
  "weight": 740,
  "dragCoefficient": 0.95
}
```

## Server → Client

### `simulate:result`
Returned immediately after `simulate:update`.

```json
{
  "downforce": 9800,
  "drag": 6200,
  "lift": -9800,
  "aeroEfficiency": 1.58,
  "grip": 2.35,
  "weightTransfer": 1850,
  "chartData": [
    { "speed": 0,   "downforce": 0,     "drag": 0     },
    { "speed": 10,  "downforce": 23,    "drag": 15    },
    ...
    { "speed": 400, "downforce": 37000, "drag": 23500 }
  ]
}
```

### `simulate:error`
Returned when parameters fail validation or calculation throws.

```json
{ "message": "Invalid parameters: speed must not exceed 400" }
```
