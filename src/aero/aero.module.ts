import { Module } from '@nestjs/common';
import { AeroService } from './aero.service';

@Module({
  providers: [AeroService],
  exports: [AeroService],
})
export class AeroModule {}
