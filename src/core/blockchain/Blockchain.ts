import { Block } from './Block';
import { MerkleTree } from './MerkleTree';
import { writeFile, writeFileSync } from 'fs';
import { createVerify, KeyObject, Sign } from 'crypto';
import path from 'path';
import { getAllTransactions } from '../../routes/transact';
import { Transaction } from '@prisma/client';
import { isEmpty } from 'lodash';

export class Blockchain {
  static instance = new Blockchain();
  chain: Block[] = [];
  genesis: Block | undefined;
  merkleTree: MerkleTree | undefined;

  private constructor() {
    this.genesis = Block.generateGenesisBlock();
    this.chain.push(this.genesis);
  }

  static getInstance() {
    if (this.instance) return this.instance;
    this.instance = new Blockchain();
    return this.instance;
  }

  fromJSON() {
    const json = require(path.resolve('./blockchain.json'));
    if (isEmpty(json)) return this.distribute();
    this.chain = json.chain.map(
      (x) => new Block(x.index, x.timestamp, x.transaction, x.previousBlockHash)
    );
    this.genesis = json.genesis;
    this.merkleTree = new MerkleTree(
      this.chain.map((x) => x.transaction as Transaction)
    );
    this.distribute;
    console.log(Blockchain.instance);

    return Blockchain.instance;
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
      this.merkleTree = new MerkleTree(trans);

      this.chain.push(
        new Block(
          this.getSize(),
          new Date(),
          newTransaction,
          this.lastBlock().getHash()
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
