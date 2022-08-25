import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { Blockchain } from '../../core/blockchain/Blockchain';
import { transferArtwork } from '../transact';

type CreateArtworkData = {
  label: string;
};

const upload = multer({
  dest: './upload',
  limits: { files: 10 * 1024 * 1024 },
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, __dirname + '../../../public/upload');
    },
    filename: (req, file, cb) => {
      cb(null, uuidv4() + path.extname(file.originalname));
    },
  }),
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == 'image/png' ||
      file.mimetype == 'image/jpg' ||
      file.mimetype == 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  },
});

const prisma = new PrismaClient();
const router = express.Router();

router.get('/:id', async (req, res) => {
  const artwork = await prisma.artwork.findUnique({
    where: {
      id: req.params.id,
    },
  });
  if (!artwork) {
    res.sendStatus(404).json({ error: 'Artowrk not found' }).end();
    return;
  }
  res.json(artwork).end();
});

router.get('/', async (req, res) => {
  const artworks = await prisma.artwork.findMany({
    include: {
      artist: true,
    },
    ...(req.query.q && {
      where: {
        OR: [
          {
            label: {
              contains: req.query.q! as string,
            },
          },
          {
            artist: {
              username: {
                contains: req.query.q! as string,
              },
            },
          },
        ],
      },
    }),
  });
  const arts = artworks.map((x) => {
    const art = JSON.parse(JSON.stringify(x));
    delete art.artist.password;
    return art;
  });
  res.json(arts).end();
});

router.post('/upload', upload.single('artworkImg'), async (req, res) => {
  const userSession = req.session.user;
  if (!userSession || userSession.role !== 'ARTIST') {
    res.sendStatus(401).end();
    return;
  }
  if (!req.file) {
    res.sendStatus(500).end();
    return;
  }
  console.log(Blockchain);

  const url = req.protocol + '://' + req.get('host');
  const { label }: CreateArtworkData = req.body;
  const artwork = await prisma.artwork.create({
    data: {
      id: path.basename(req.file?.filename as string),
      label,
      artworkPath: url + '/image/' + req.file?.filename,
      artistId: userSession.id,
      ownerId: userSession.id,
    },
  });
  // TODO: blockchain
  const bc = Blockchain.getInstance();
  transferArtwork(artwork, userSession.id, userSession.id);
  res.json(artwork).end();
});

export default router;
