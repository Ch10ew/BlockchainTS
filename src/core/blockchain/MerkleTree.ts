import { Transaction } from '@prisma/client';
import Hasher from '@utils/hasher';

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
    this.root = MerkleTree.buildTree(nodes);
  }

  static buildTree(nodes: Transaction[]): MerkleNode {
    const nodeCopy = [...nodes];
    let finalNodes: MerkleNode[] = [];
    if (!(nodes.length % 2)) nodeCopy.push(nodes[nodes.length - 1]);

    for (let i = 0; i < nodeCopy.length; i++) {
      finalNodes.push(new MerkleNode(undefined, undefined, nodeCopy[i]));
    }

    for (let i = 0; i < nodeCopy.length / 2; i++) {
      const level: MerkleNode[] = [];
      for (let j = 0; j < nodeCopy.length; j += 2) {
        const node = new MerkleNode(finalNodes[j], finalNodes[j + 1]);
      }
      finalNodes = level;
    }
    return finalNodes[0];
  }
}
