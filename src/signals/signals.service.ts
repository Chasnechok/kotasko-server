import { Injectable } from '@nestjs/common'
import { EventEmitter } from 'events'
import { Response } from 'express'
import { User } from 'src/users/user.schema'
import { SignalTypes } from './signal.type'

const SignalsEmmiter = new EventEmitter()
SignalsEmmiter.setMaxListeners(200)
@Injectable()
export class SignalsService {
    async subscribe(res: Response, user: User) {
        function onSignal(signal: SignalTypes, receivers: User[]) {
            // any authenticated user can connect to this bus => specify receivers to authorize receiving messages
            if (receivers.some((u) => u.id === user.id)) res.write(`data: ${signal} \n\n`)
        }
        res.on('close', () => {
            SignalsEmmiter.removeListener('signal', onSignal)
        })
        SignalsEmmiter.on('signal', onSignal)
    }

    emitSignal(signal: SignalTypes, receivers: User[]) {
        if (!Array.isArray(receivers)) receivers = [receivers]
        SignalsEmmiter.emit('signal', signal, receivers)
    }
}
