import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SimulationService } from './simulation.service';
import { SimulateParamsDto } from '../aero/dto/simulate-params.dto';

@ApiTags('simulation')
@Controller('simulation')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post('run')
  @ApiOperation({ summary: 'One-shot aerodynamic calculation' })
  run(@Body() params: SimulateParamsDto) {
    return this.simulationService.run(params);
  }
}
