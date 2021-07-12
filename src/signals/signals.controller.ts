import { Controller, Get, Res, Session } from '@nestjs/common'
import { SignalsService } from './signals.service'
import { Response } from 'express'

@Controller('signals')
export class SignalsController {
    constructor(private readonly signalsService: SignalsService) {}

    @Get()
    subscribe(@Res() res: Response, @Session() session) {
        res.set({
            Connection: 'keep-alive',
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
        })
        return this.signalsService.subscribe(res, session.user)
    }
}
