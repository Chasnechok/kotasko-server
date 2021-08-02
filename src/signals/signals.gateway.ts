import { WebSocketGateway, SubscribeMessage, MessageBody } from '@nestjs/websockets'
import { SignalsService } from './signals.service'
import { CreateSignalDto } from './dto/create-signal.dto'
import { UpdateSignalDto } from './dto/update-signal.dto'

@WebSocketGateway()
export class SignalsGateway {
    constructor(private readonly signalsService: SignalsService) {}

    @SubscribeMessage('createSignal')
    create(@MessageBody() createSignalDto: CreateSignalDto) {
        return this.signalsService.create(createSignalDto)
    }

    @SubscribeMessage('findAllSignals')
    findAll() {
        return this.signalsService.findAll()
    }

    @SubscribeMessage('findOneSignal')
    findOne(@MessageBody() id: number) {
        return this.signalsService.findOne(id)
    }

    @SubscribeMessage('updateSignal')
    update(@MessageBody() updateSignalDto: UpdateSignalDto) {
        return this.signalsService.update(updateSignalDto.id, updateSignalDto)
    }

    @SubscribeMessage('removeSignal')
    remove(@MessageBody() id: number) {
        return this.signalsService.remove(id)
    }
}
