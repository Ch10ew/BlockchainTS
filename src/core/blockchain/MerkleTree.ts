import { Transaction } from '@prisma/client';
import { findTransactionById, getAllTransactions } from '../../routes/transact';
import Hasher from '../../utils/hasher';

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
    console.log(t);
    console.log(transaction);

    const transactionNode = new MerkleNode(
      undefined,
      undefined,
      transaction as Transaction
    );
    const allTransactionNodes = allTransactions.map(
      (x) => new MerkleNode(undefined, undefined, x)
    );
    const proofs = this.getMerkleProof(allTransactionNodes, transactionNode);
    const root = this.proofMerkleRoot(proofs, transactionNode);
    console.log(root.hash);
    console.log(this.root?.hash);
    return this.root?.hash === root.hash;
  }

  private getMerkleProof(
    allMerkleNodes: MerkleNode[],
    merkleNode: MerkleNode,
    proof: any[][] = []
  ) {
    if (allMerkleNodes.length === 1) return proof;
    console.log(allMerkleNodes.length);
    const nodes = [...allMerkleNodes];
    const tree: MerkleNode[] = [];
    if (nodes.length % 2 !== 0) nodes.push(nodes[nodes.length - 1]);
    for (let i = 0; i < nodes.length; i += 2) {
      const merkle = new MerkleNode(nodes[i], nodes[i + 1]);
      tree.push(merkle);
      if (merkle.leftNode === merkleNode)
        proof.push(['leftNode', merkle.leftNode]);
      else if (merkle.rightNode === merkleNode)
        proof.push(['rightNode', merkle.rightNode]);
    }
    return this.getMerkleProof(tree, merkleNode, proof);
  }

  private proofMerkleRoot(proof: any[][], merkleNode: MerkleNode) {
    return proof.reduce((root, [key, value]) => {
      return key === 'leftNode'
        ? new MerkleNode(value, root)
        : new MerkleNode(root, value);
    }, merkleNode);
  }
}
