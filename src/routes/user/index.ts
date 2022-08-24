import express from 'express';
import { Prisma, PrismaClient, User } from '@prisma/client';
import { compare, genSalt, hash } from 'bcrypt';
import { LoginData } from 'src/common/type/loginType';
import { Wallet } from '../../core/blockchain/Wallet';
import { mkdir, writeFile } from 'fs';
import path from 'path';

type UserSignUpInput = {
  username: string;
  password: string;
  userType: string;
};

export function excludePassword<User, Key extends keyof User>(
  user: User,
  ...keys: Key[]
): Omit<User, Key> {
  for (let key of keys) {
    delete user[key];
  }
  return user;
}

const prisma = new PrismaClient();
const router = express.Router();

router.post('/signup', async (req, res) => {
  const { username, password }: UserSignUpInput = req.body;
  const queryUser = await prisma.user.findUnique({
    where: {
      username,
    },
  });
  if (queryUser) {
    res.status(403).json({ error: 'User already exist' }).end();
    return;
  }
  const salt = await genSalt(10);
  const hashedPassowrd = await hash(password, salt);

  const wallet = new Wallet();
  const user = await prisma.user.create({
    data: {
      ...req.body,
      password: hashedPassowrd,
    },
  });
  // TODO: blockchain

  mkdir(path.resolve(__dirname, `../../keys/${user.id}`), () => {});
  await Promise.all([
    writeFile(
      path.resolve(__dirname, `../../keys/${user.id}/public.pem`),
      wallet.publicKey,
      () => {}
    ),
    writeFile(
      path.resolve(__dirname, `../../keys/${user.id}/private.pem`),
      wallet.privateKey.export({
        type: 'pkcs8',
        format: 'pem',
      }),
      () => {}
    ),
  ]);
  res.json(user);
});

router.post('/login', async (req, res) => {
  const { username, password }: LoginData = req.body;
  const user = await prisma.user.findFirst({
    where: {
      username: username,
    },
  });
  if (user) {
    const validPassword = await compare(password, user?.password);
    if (validPassword) {
      req.session.user = { id: user.id, role: user.userType };
      res.sendStatus(200).end();
      return;
    }
    res.sendStatus(401).json({ error: 'Unauthorized' }).end();
    return;
  }
  res.sendStatus(404).json({ error: 'User not found' });
});

router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.params.id,
    },
  });
  if (!user) return res.sendStatus(404).json({ error: 'User not found' });
  res.json(excludePassword(user, 'password'));
});

export default router;