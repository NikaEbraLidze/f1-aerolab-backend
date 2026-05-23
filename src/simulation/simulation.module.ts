import { Module } from '@nestjs/common';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './simulation.service';
import { SimulationGateway } from './simulation.gateway';
import { AeroModule } from '../aero/aero.module';

@Module({
  imports: [AeroModule],
  controllers: [SimulationController],
  providers: [SimulationService, SimulationGateway],
  exports: [SimulationService],
})
export class SimulationModule {}
