import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';
const MongoStore = require('connect-mongo');
const cors = require('cors')

async function start() {
  const PORT = Number(process.env.PORT) || 5000;
  const app = await NestFactory.create(AppModule);
  app.use(cors({
    credentials: true,
    origin: 'http://localhost:3000'
  }))
  app.use(
    session({
      secret: process.env.SESSION_KEY,
      resave: false,
      saveUninitialized: false,
      name: 'SSN',
      store: MongoStore.create({ mongoUrl: process.env.MONGO_URI, touchAfter: 24 * 3600 }),
      cookie: {
        maxAge: 14 * 24 * 60 * 60 * 1000
      }
    })
  );
  await app.listen(PORT, () => console.log(`Server started at ${PORT}!`));
}
start();
