import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @ApiOperation({ summary: 'Health check' })
  @Get()
  check(): { status: string; message: string } {
    return { status: 'ok', message: 'Server is running' };
  }
}
