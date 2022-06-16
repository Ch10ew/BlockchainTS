import { BinaryToTextEncoding, createHash, randomBytes } from 'crypto'

type HashTarget = string | Object

export default class Hasher {
  static md5(target: HashTarget, encode: BinaryToTextEncoding = 'base64'): string {
    const targetStr = this.objectChecker(target)
    return createHash('md5').update(targetStr).digest(encode)
  }

  static generateSalt(bytes: number = 16, encode: BufferEncoding = 'utf-8'): string {
    return randomBytes(bytes).toString(encode)
  }

  private static objectChecker(target: HashTarget): string {
    return typeof target === 'object' ? target.toString() : target
  }
}