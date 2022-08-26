import Hasher from '../../utils/hasher';
import { IUser } from '../user/user';
import { v4 } from 'uuid';
import { createHash } from 'crypto';
import { MerkleTree } from './MerkleTree';
import { Transaction } from '@prisma/client';
import { Type } from 'class-transformer';

export class Block {
  constructor(
    public readonly index: number,
    public readonly timestamp: Date,
    public readonly transaction: Transaction | null,
    public readonly previousBlockHash: string
  ) {}

  static generateGenesisBlock() {
    const date = new Date();
    return new Block(
      0,
      date,
      null,
      Hasher.sha256(String(date) + null + '0' + v4())
    );
  }

  getHash() {
    const str = JSON.stringify(this);
    const hash = createHash('SHA256');
    hash.update(str).end();
    return hash.digest('hex');
  }
}
