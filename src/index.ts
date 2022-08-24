import express from 'express';
import IndexRouter from './routes/index';
import UserRouter from './routes/user';
import ArtworkRouter from './routes/artwork';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { PrismaClient, UserType } from '@prisma/client';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import path from 'path';
import { readdirSync } from 'fs';

declare module 'express-session' {
  interface SessionData {
    user: {
      id: string;
      role: UserType;
    };
  }
}

const app = express();

app.use(express.json());
app.use(cookieParser());
console.log(path.resolve(__dirname, './public/uplaod'));
app.use(
  session({
    secret: 'session secret yay bcd',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true },
    // @ts-ignore
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);

app.use('/image', express.static(path.join(__dirname, './public/upload')));

app.use('/', IndexRouter);
app.use('/user', UserRouter);
app.use('/artwork', ArtworkRouter);

const port = process.env.PORT ?? 8000;

app.listen(port, () => {
  console.log('App listening at port ' + port);
});

process.on('uncaughtException', () => console.log('Nothing has happened UwU'));
