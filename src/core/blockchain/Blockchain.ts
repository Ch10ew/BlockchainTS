import { Block } from './Block';
import { MerkleNode, MerkleTree } from './MerkleTree';
import { writeFile, writeFileSync } from 'fs';
import { createVerify, KeyObject, Sign } from 'crypto';
import path from 'path';
import { findTransactionById, getAllTransactions } from '../../routes/transact';
import { Transaction } from '@prisma/client';
import { isEmpty } from 'lodash';

type proof = {
  position: 'left' | 'right';
  node: MerkleNode;
};

export class Blockchain {
  static instance = new Blockchain();
  chain: Block[] = [];
  genesis: Block | undefined;
  merkleRootHash: string | undefined;

  private constructor() {
    this.genesis = Block.generateGenesisBlock();
    this.chain.push(this.genesis);
  }

  static getInstance() {
    if (this.instance) return this.instance;
    this.instance = new Blockchain();
    return this.instance;
  }

  async fromJSON() {
    const json = require(path.resolve('./blockchain.json'));
    if (isEmpty(json)) return this.distribute();
    this.chain = json.chain.map((x) => {
      console.log(x.transaction);
      const trans: Transaction | null = x.transaction
        ? {
            id: x.transaction.id,
            createdAt: new Date(x.transaction.createdAt),
            artworkId: x.transaction.artworkId,
            fromId: x.transaction.fromId,
            toId: x.transaction.toId,
          }
        : null;
      return new Block(x.index, x.timestamp, trans, x.previousBlockHash);
    });
    this.genesis = json.genesis;
    const allTrans = await getAllTransactions();
    this.merkleRootHash = json.merkleRootHash;
    this.distribute();
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
      this.merkleRootHash = new MerkleTree(trans).root?.hash;

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

  public async proofTransaction(transactionId: string) {
    const [transaction, allTransactions] = await Promise.all([
      findTransactionById(transactionId),
      getAllTransactions(),
    ]);
    if (!transaction) return false;
    const t = allTransactions.filter(
      (x) => x.id === transactionId
    )[0] as Transaction;

    const transactionNode = new MerkleNode(
      undefined,
      undefined,
      transaction as Transaction
    );
    const allTransactionNodes = allTransactions.map(
      (x) => new MerkleNode(undefined, undefined, x)
    );
    const proofs = this.getMerkleProof(allTransactionNodes, transactionNode);
    console.log(proofs);
    const root = this.proofMerkleRoot(proofs, transactionNode);
    return this.merkleRootHash === root.hash;
  }

  private getMerkleProof(
    allMerkleNodes: MerkleNode[],
    merkleNode: MerkleNode,
    proof: proof[] = []
  ) {
    if (allMerkleNodes.length === 1) return proof;
    let next = merkleNode;
    const nodes = [...allMerkleNodes];
    const tree: MerkleNode[] = [];
    if (nodes.length % 2 !== 0) nodes.push(nodes[nodes.length - 1]);
    for (let i = 0; i < nodes.length; i += 2) {
      const merkle = new MerkleNode(nodes[i], nodes[i + 1]);
      tree.push(merkle);
      if (merkle.leftNode?.hash === merkleNode.hash) {
        console.log('left');
        proof.push({ position: 'left', node: merkle.rightNode! });
        next = merkle;
      } else if (merkle.rightNode?.hash === merkleNode.hash) {
        console.log('right');
        proof.push({ position: 'right', node: merkle.leftNode! });
        next = merkle;
      }
    }
    return this.getMerkleProof(tree, next, proof);
  }

  private proofMerkleRoot(proof: proof[], merkleNode: MerkleNode) {
    return proof.reduce((root, { position, node }, i) => {
      return position === 'right'
        ? new MerkleNode(node, root)
        : new MerkleNode(root, node);
    }, merkleNode);
  }
}
