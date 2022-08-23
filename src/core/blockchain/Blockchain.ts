import { Block, ITransactionData } from './Block';
import { MerkleTree } from './MerkleTree';
import { v4 as uuidv4 } from 'uuid';
import Hasher from '@utils/hasher';
import { createVerify, Sign } from 'crypto';

export class Blockchain {
  chain: Block[] = [];
  merkleTree: MerkleTree | undefined;
  genesis: Block | undefined;

  constructor() {
    this.genesis = Block.generateGenesisBlock();
    this.chain.push();
  }

  addBlock(
    newTransaction: ITransactionData,
    senderPublicKey: string,
    signature: string
  ): void {
    const verifier = createVerify('SHA256');
    verifier.update(JSON.stringify(newTransaction));

    const isValid = verifier.verify(senderPublicKey, signature);

    if (isValid) {
      this.chain.push(
        new Block(
          this.getSize(),
          new Date(),
          newTransaction,
          this.lastBlock().getHash()
        )
      );
    }
    const tempList: ITransactionData[] = [newTransaction];
    this.merkleTree = new MerkleTree(tempList);
    const date = new Date();
  }

  lastBlock() {
    return this.chain[this.getSize() - 1];
  }

  getSize(): number {
    return this.chain.length;
  }
}
