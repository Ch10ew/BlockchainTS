import express from 'express';
import { Artwork, PrismaClient, RequestStatus } from '@prisma/client';
import { createSign } from 'crypto';
import { getPrivateKey, getPublicKey } from '../../utils/keys/keyUtils';
import { Blockchain } from '../../core/blockchain/Blockchain';

type CreateRequestData = {
  artworkId: string;
  buyerId: string;
};

const prisma = new PrismaClient();
const router = express.Router();

export const getAllTransactions = async () => {
  return prisma.transaction.findMany();
};

export const findTransactionById = async (transctionId: string) =>
  await prisma.transaction.findUnique({
    where: {
      id: transctionId,
    },
  });

export const transferArtwork = async (
  artwork: Artwork,
  ownerId: string,
  buyerId: string
) => {
  const transaction = await prisma.transaction.create({
    data: {
      artworkId: artwork.id,
      fromId: ownerId,
      toId: buyerId,
    },
  });
  const sign = createSign('SHA256');
  sign.update(JSON.stringify(transaction)).end();
  const signature = sign.sign(getPrivateKey(ownerId), 'base64');
  Blockchain.getInstance().addBlock(
    transaction,
    getPublicKey(ownerId),
    signature
  );
  await prisma.artwork.update({
    where: {
      id: artwork.id,
    },
    data: {
      ownerId: buyerId,
    },
  });
};

router.get('', (req, res) => {
  let queryParams: any = [];
  if (req.query) {
    if (req.query.fromId) {
      queryParams.push(req.query.fromId);
    }
    if (req.query.toId) {
      queryParams.push(req.query.toId);
    }
    if (req.query.q) {
      queryParams.push(
        {
          from: {
            username: {
              contains: req.query.q! as string,
            },
          },
        },
        {
          to: {
            username: {
              contains: req.query.q! as string,
            },
          },
        },
        {
          artwork: {
            label: {
              contains: req.query.q! as string,
            },
          },
        }
      );
    }
  }
  return prisma.transaction.findMany({
    include: {
      from: true,
      to: true,
      artwork: true,
    },
    ...(req.query && {
      where: {
        OR: queryParams,
      },
    }),
  });
});

router.post('/request', async (req, res) => {
  if (!req.body.artworkId || !req.body.buyerId) {
    res.sendStatus(403);
    return;
  }
  const artwork = await prisma.artwork.findUnique({
    where: {
      id: req.body.artworkId,
    },
    include: {
      artist: true,
    },
  });
  if (!artwork) {
    res.sendStatus(404);
    return;
  }
  const request = await prisma.request.create({
    data: {
      fromId: req.body.buyerId,
      toId: artwork.artist.id,
      artworkId: artwork.id,
    },
  });
  res.json(request);
});

router.put('/request/response', async (req, res) => {
  if (!req.body.requestId || !req.body.status) {
    return res.sendStatus(404);
  }
  const request = await prisma.request.update({
    where: {
      id: req.body.requestId,
    },
    data: {
      status: req.body.status,
    },
    include: {
      artwork: true,
    },
  });
  if (request.status === RequestStatus.ACCEPTED) {
    await transferArtwork(request.artwork, request.fromId, request.toId);
    res.json(request);
  }
});

router.get('/blockchain', (req, res) =>
  res.json(Blockchain.getInstance().chain)
);

router.get('/proof/:id', (req, res) => {
  res.json({
    isValid: Blockchain.getInstance().merkleTree?.proofTransaction(
      req.params.id
    ),
  });
});
export default router;
