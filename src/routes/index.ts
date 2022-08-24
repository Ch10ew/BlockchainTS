import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Hello world');
});

export default router;
