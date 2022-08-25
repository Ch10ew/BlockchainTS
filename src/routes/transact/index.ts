import express from 'express';
import { Artwork, PrismaClient, RequestStatus } from '@prisma/client';
import { createSign } from 'crypto';
import { getPrivateKey, getPublicKey } from '../../utils/keys/keyUtils';
import { Blockchain } from '../../core/blockchain/Blockchain';
import { isEmpty } from 'lodash';

type CreateRequestData = {
  artworkId: string;
  buyerId: string;
};

const prisma = new PrismaClient();
const router = express.Router();

export const getAllTransactions = async () => {
  return prisma.transaction.findMany({
    orderBy: [{ createdAt: 'asc' }],
  });
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

router.get('/', async (req, res) => {
  let queryParams: any = [];
  if (!isEmpty(req.query)) {
    if (req.query.status) {
      queryParams.push({ status: req.query.status });
    }
    if (req.query.notStatus) {
      queryParams.push({
        status: {
          not: req.query.notStatus,
        },
      });
    }
    if (req.query.fromId) {
      queryParams.push({ fromId: req.query.fromId });
    }
    if (req.query.toId) {
      queryParams.push({ toId: req.query.toId });
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
  console.log(queryParams);
  const request = await prisma.request.findMany({
    include: {
      from: true,
      to: true,
      artwork: true,
    },
    // ...(!isEmpty(req.query) && {
    //   where: {
    //     OR: queryParams,
    //   },
    // }),
    where: {
      OR: [
        { status: { not: 'PENDING' } },
        { fromId: 'ff943052-e07a-4b25-a409-1081b83325ba' },
        { toId: 'ff943052-e07a-4b25-a409-1081b83325ba' },
      ],
    },
  });
  res.json(request);
});

router.post('/', async (req, res) => {
  if (!req.body.artworkId || !req.body.buyerId) {
    res.sendStatus(403);
    return;
  }
  const [user, artwork] = await prisma.$transaction([
    prisma.user.findUnique({
      where: {
        id: req.body.buyerId,
      },
    }),
    prisma.artwork.findUnique({
      where: {
        id: req.body.artworkId,
      },
      include: {
        artist: true,
      },
    }),
  ]);
  if (!artwork || !user) {
    res.sendStatus(404);
    return;
  }
  const request = await prisma.request.create({
    data: {
      fromId: req.body.buyerId,
      toId: artwork.ownerId,
      artworkId: artwork.id,
    },
  });
  res.json(request);
});

router.put('/response', async (req, res) => {
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
    await transferArtwork(request.artwork, request.toId, request.fromId);
    res.json(request);
  }
});

router.get('/blockchain', (req, res) =>
  res.json(Blockchain.getInstance().chain)
);

router.get('/proof/:id', async (req, res) => {
  const isValid = await Blockchain.getInstance().proofTransaction(
    req.params.id
  );
  res.json({ isValid });
});

router.get('/:id', async (req, res) => {
  const trans = await prisma.artwork.findUnique({
    where: {
      id: req.params.id,
    },
  });
  if (trans) return res.sendStatus(404);
  res.json({ trans });
});

router.get('/cert/:id', async (req, res) => {
  const latestTransaction = await prisma.transaction.findFirst({
    orderBy: [{ createdAt: 'desc' }],
    where: {
      artworkId: req.params.id,
    },
    include: {
      from: true,
      to: true,
    },
  });
  if (!latestTransaction) return res.sendStatus(404).end();
  res.json({
    data: latestTransaction,
  });
});

router.get('/transaction', async (req, res) => {
  console.log('hi');
  let queryParams: any = [];
  if (!isEmpty(req.query)) {
    if (req.query.fromId) {
      queryParams.push({ fromId: req.query.fromId });
    }
    if (req.query.toId) {
      queryParams.push({ toId: req.query.toId });
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
  const trans = await prisma.transaction.findMany({
    include: {
      from: true,
      to: true,
      artwork: true,
    },
    ...(!isEmpty(req.query) && {
      where: {
        OR: queryParams,
      },
    }),
  });
});

export default router;
