import Hasher from '@utils/hasher';
import { IUser } from '../user/user';
import { v4 } from 'uuid';
import { createHash } from 'crypto';

export interface IBlockData {
  index: number;
  timestamp: Date;
  transaction: ITransactionData | null;
  previousBlockHash: string;
}

export interface ITransactionData {
  from: IUser;
  to: IUser;
  artworkId: string;
  amount: number;
}

export class Block implements IBlockData {
  constructor(
    public readonly index: number,
    public readonly timestamp: Date,
    public readonly transaction: ITransactionData | null,
    public readonly previousBlockHash: string
  ) {}

  static generateGenesisBlock() {
    const date = new Date();
    return new Block(
      0,
      date,
      null,
      Hasher.md5(String(date) + null + '0' + v4())
    );
  }

  getHash() {
    const str = JSON.stringify(this);
    const hash = createHash('SHA256');
    hash.update(str).end();
    return hash.digest('hex');
  }
}
