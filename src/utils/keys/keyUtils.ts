import { Artwork } from '@prisma/client';
import { createPrivateKey, createPublicKey, KeyObject } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';

export const getPublicKey = (userId: string) => {
  const pubKey = readFileSync(
    path.resolve(__dirname, '../../keys/', userId, 'public.pem')
  );
  return createPublicKey({
    type: 'spki',
    key: pubKey,
    format: 'pem',
  });
};

export const getPrivateKey = (userId: string) => {
  const priKey = readFileSync(
    path.resolve(__dirname, '../../keys/', userId, 'private.pem')
  );
  return createPrivateKey({
    type: 'pkcs8',
    key: priKey,
    format: 'pem',
  });
};
