import express from 'express';
import { PrismaClient } from '@prisma/client';
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { createPublicKey } from 'crypto';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Hello world');
});

// router.get('/parse', (req, res) => {
//   res.send(200);
//   const priKey = readFileSync(
//     path.resolve(
//       __dirname,
//       '../keys/2314179e-8230-4147-9409-0cf6e8556f9f/private.pem'
//     )
//   );
//   const pubKey = readFileSync(
//     path.resolve(
//       __dirname,
//       '../keys/2314179e-8230-4147-9409-0cf6e8556f9f/public.pem'
//     )
//   );
//   const publicKey = createPublicKey({
//     type: 'spki',
//     key: pubKey,
//     format: 'pem',
//   });
//   console.log(
//     publicKey.export({
//       format: 'pem',
//       type: 'spki',
//     })
//   );
// });

export default router;
