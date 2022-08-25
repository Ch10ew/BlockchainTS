import { Transaction } from '@prisma/client';
import { findTransactionById, getAllTransactions } from '../../routes/transact';
import Hasher from '../../utils/hasher';

type proof = {
  position: 'left' | 'right';
  node: MerkleNode;
};

export class MerkleNode {
  public hash: string | undefined;
  private proof: any;
  constructor(
    public leftNode: MerkleNode | undefined = undefined,
    public rightNode: MerkleNode | undefined = undefined,
    private readonly data: Transaction | undefined = undefined
  ) {
    if (!leftNode && !rightNode) {
      this.hash = Hasher.sha256(this.data!);
    } else {
      this.hash = Hasher.sha256(leftNode?.hash! + rightNode?.hash);
    }
  }
}

export class MerkleTree {
  root: MerkleNode | undefined;
  size: number | undefined;
  constructor(nodes: Transaction[]) {
    this.size = Math.ceil(Math.log2(nodes.length));
    this.root = MerkleTree.buildTree(
      nodes.map((x) => new MerkleNode(undefined, undefined, x))
    );
  }

  static buildTree(nodes: MerkleNode[]): MerkleNode {
    if (nodes.length === 1) return nodes[0];
    const nodeCopy = [...nodes];
    let finalNodes: MerkleNode[] = [];
    if (nodes.length % 2 !== 0) nodeCopy.push(nodes[nodes.length - 1]);

    for (let j = 0; j < nodeCopy.length; j += 2) {
      finalNodes.push(new MerkleNode(nodeCopy[j], nodeCopy[j + 1]));
    }
    return this.buildTree(finalNodes);
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
    console.log(root.hash);
    console.log(this.root?.hash);
    return this.root?.hash === root.hash;
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
