import { Transaction } from '@prisma/client';
import Hasher from '../../utils/hasher';

export class MerkleNode {
  public hash: string | undefined;
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
    console.log(this.root);
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
}
