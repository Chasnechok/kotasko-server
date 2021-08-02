import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as session from 'express-session'
import { ValidationPipe } from '@nestjs/common'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const MongoStore = require('connect-mongo')

export const SESSION_PARSER = session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    name: 'SSN',
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI, touchAfter: 24 * 3600 }),
    cookie: {
        maxAge: 14 * 24 * 60 * 60 * 1000,
        domain: process.env.NODE_ENV == 'development' ? 'localhost' : 'kotasko.com',
    },
})

export enum MainModelNames {
    TASKS,
    FILES,
    CHORES,
}

async function start() {
    const PORT = Number(process.env.PORT) || 5000
    const app = await NestFactory.create(AppModule)
    app.enableCors({
        origin: ['http://localhost:3000', 'https://kotasko.com', 'https://www.kotasko.com'],
        credentials: true,
    })
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
        })
    )
    app.use(SESSION_PARSER)
    await app.listen(PORT, () => console.log(`Server started at ${PORT}!`))
}
start().catch(console.log)
