# F1 AeroLab — Aerodynamic Formulas

## Constants
| Symbol | Value | Unit | Description |
|--------|-------|------|-------------|
| ρ | 1.225 | kg/m³ | Air density at sea level |
| A | 1.5 | m² | Reference frontal area |
| g | 9.81 | m/s² | Gravitational acceleration |
| wheelbase | 3.6 | m | Typical F1 wheelbase |
| CG height | 0.3 | m | Typical F1 center of gravity height |
| braking decel | 30 | m/s² | Typical F1 braking deceleration (~3g) |

## Input Parameters
| Parameter | Unit | Range |
|-----------|------|-------|
| speed | km/h | 0–400 |
| wingAngle | degrees | 0–30 |
| weight | kg | 600–1000 |
| dragCoefficient (Cd) | dimensionless | 0.5–1.5 |

## Derived Values
- v (m/s) = speed / 3.6
- Cl = wingAngle × 0.1  (linear lift coefficient approximation)

## Formulas
```
Downforce (N)    = 0.5 × ρ × v² × Cl × A
Drag (N)         = 0.5 × ρ × v² × Cd × A
Lift (N)         = -Downforce
Aero Efficiency  = Downforce / Drag  (0 if drag is 0)
Grip             = (Downforce + weight × g) / (weight × g)
Weight Transfer  = (weight × 30 × 0.3) / 3.6
```

## Worked Example
speed=360 km/h, wingAngle=10°, weight=800 kg, Cd=1.0

- v = 360/3.6 = 100 m/s
- Cl = 10 × 0.1 = 1.0
- Downforce = 0.5 × 1.225 × 10000 × 1.0 × 1.5 = **9,188 N**
- Drag = 0.5 × 1.225 × 10000 × 1.0 × 1.5 = **9,188 N**
- Aero Efficiency = 9188 / 9188 = **1.0**
- Grip = (9188 + 800×9.81) / (800×9.81) = **2.17**
- Weight Transfer = (800 × 30 × 0.3) / 3.6 = **2,000 N**

## Chart Data
41 points generated per calculation: speed 0 to 400 km/h in steps of 10.
Each point contains: `{ speed, downforce, drag }`.
Wing angle and Cd from the user's current input are held constant across all points.
