import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { SimulateParamsDto } from '../aero/dto/simulate-params.dto';
import { WsExceptionsFilter } from '../common/filters/ws-exceptions.filter';

@WebSocketGateway({
  cors: { origin: 'http://localhost:3000' },
  namespace: '/',
})
@UseFilters(new WsExceptionsFilter('simulate:error'))
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class SimulationGateway {
  constructor(private readonly simulationService: SimulationService) {}

  @SubscribeMessage('simulate:update')
  handleSimulateUpdate(@MessageBody() params: SimulateParamsDto) {
    const result = this.simulationService.run(params);
    return { event: 'simulate:result', data: result };
  }
}
