import { Injectable } from '@nestjs/common';
import { AeroService } from '../aero/aero.service';
import { SimulateParamsDto } from '../aero/dto/simulate-params.dto';

@Injectable()
export class SimulationService {
  constructor(private readonly aeroService: AeroService) {}

  run(params: SimulateParamsDto) {
    return this.aeroService.calculateAll(params);
  }
}
