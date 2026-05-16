import { Injectable } from '@nestjs/common';
import { SimulateParamsDto } from './dto/simulate-params.dto';

export interface ChartPoint {
  speed: number;
  downforce: number;
  drag: number;
}

export interface AeroResult {
  downforce: number;
  drag: number;
  lift: number;
  aeroEfficiency: number;
  grip: number;
  weightTransfer: number;
  chartData: ChartPoint[];
}

const RHO = 1.225; // air density kg/m³ at sea level
const A = 1.5; // reference frontal area m²
const G = 9.81; // gravitational acceleration m/s²
const WHEELBASE = 3.6; // typical F1 wheelbase m
const CG_HEIGHT = 0.3; // typical F1 center of gravity height m
const BRAKING_ACCEL = 30; // typical F1 braking deceleration m/s² (~3g)

@Injectable()
export class AeroService {
  calculateAll(params: SimulateParamsDto): AeroResult {
    const { speed, wingAngle, weight, dragCoefficient } = params;

    const v = speed / 3.6; // km/h → m/s
    const C1 = wingAngle * 0.1; // linear Cl approximation

    const downforce = Math.round(0.5 * RHO * v * v * C1 * A) || 0;
    const drag = Math.round(0.5 * RHO * v * v * dragCoefficient * A) || 0;
    const lift = -downforce || 0;
    const aeroEfficiency =
      drag > 0 ? Math.round((downforce / drag) * 1000) / 1000 : 0;
    const grip =
      Math.round(((downforce + weight * G) / (weight * G)) * 100) / 100 || 0;
    const weightTransfer =
      Math.round((weight * BRAKING_ACCEL * CG_HEIGHT) / WHEELBASE) || 0;

    const chartData: ChartPoint[] = Array.from({ length: 41 }, (_, i) => {
      const s = i * 10;
      const vs = s / 3.6;
      return {
        speed: s,
        downforce: Math.round(0.5 * RHO * vs * vs * C1 * A),
        drag: Math.round(0.5 * RHO * vs * vs * dragCoefficient * A),
      };
    });

    return {
      downforce,
      drag,
      lift,
      aeroEfficiency,
      grip,
      weightTransfer,
      chartData,
    };
  }
}
