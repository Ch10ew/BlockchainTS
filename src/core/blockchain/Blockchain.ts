import { Block } from './Block';
import { MerkleTree } from './MerkleTree';
import { writeFile, writeFileSync } from 'fs';
import { createVerify, KeyObject, Sign } from 'crypto';
import path from 'path';
import { getAllTransactions } from '../../routes/transact';
import { Transaction } from '@prisma/client';

export class Blockchain {
  static instance = new Blockchain();
  chain: Block[] = [];
  genesis: Block | undefined;

  private constructor() {
    this.genesis = Block.generateGenesisBlock();
    this.chain.push(this.genesis);
    this.distribute();
  }

  static getInstance() {
    if (this.instance) return this.instance;
    this.instance = new Blockchain();
    console.log(this.instance);
    return this.instance;
  }

  static fromJSON() {
    const json = require('./blockchain.json');
    this.instance = Object.assign(new Blockchain(), json);
    return this.instance;
  }

  async addBlock(
    newTransaction: Transaction,
    senderPublicKey: KeyObject,
    signature: string | Buffer
  ): Promise<void> {
    const verifier = createVerify('SHA256');
    verifier.update(JSON.stringify(newTransaction));

    const isValid = verifier.verify(
      senderPublicKey,
      signature as string,
      'base64'
    );
    if (isValid) {
      const trans = await getAllTransactions();
      this.chain.push(
        new Block(
          this.getSize(),
          new Date(),
          newTransaction,
          this.lastBlock().getHash(),
          new MerkleTree(trans)
        )
      );
      this.distribute();
    }
  }

  lastBlock() {
    return this.chain[this.getSize() - 1];
  }

  getSize(): number {
    return this.chain.length;
  }

  distribute() {
    writeFileSync(path.resolve('./blockchain.json'), JSON.stringify(this));
  }
}
