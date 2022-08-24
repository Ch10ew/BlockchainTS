import { Block } from './Block';
import { MerkleTree } from './MerkleTree';
import { writeFile } from 'fs';
import { createVerify, Sign } from 'crypto';
import path from 'path';
import { getAllTransactions } from 'src/routes/transact';
import { Transaction } from '@prisma/client';

export class Blockchain {
  static instance: Blockchain | undefined;
  chain: Block[] = [];
  genesis: Block | undefined;

  private constructor() {
    this.genesis = Block.generateGenesisBlock();
    this.chain.push();
    this.distribute();
  }

  static getInstance() {
    if (this.instance) return this.instance;
    return new Blockchain();
  }

  static fromJSON() {
    const json = require('./blockchain.json');
    this.instance = Object.assign(new Blockchain(), json);
    return this.instance;
  }

  async addBlock(
    newTransaction: Transaction,
    senderPublicKey: string,
    signature: string
  ): Promise<void> {
    const verifier = createVerify('SHA256');
    verifier.update(JSON.stringify(newTransaction));

    const isValid = verifier.verify(senderPublicKey, signature);

    if (isValid) {
      this.chain.push(
        new Block(
          this.getSize(),
          new Date(),
          newTransaction,
          this.lastBlock().getHash(),
          new MerkleTree(await getAllTransactions())
        )
      );
    }
  }

  lastBlock() {
    return this.chain[this.getSize() - 1];
  }

  getSize(): number {
    return this.chain.length;
  }

  distribute() {
    writeFile(
      path.resolve('./blockchain.json'),
      JSON.stringify(this),
      () => {}
    );
  }
}
