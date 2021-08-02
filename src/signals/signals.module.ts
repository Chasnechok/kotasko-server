import { Module } from '@nestjs/common'
import { SignalsService } from './signals.service'
import { SignalsGateway } from './signals.gateway'

@Module({
    providers: [SignalsGateway, SignalsService],
})
export class SignalsModule {}
