import { createSign, generateKeyPairSync } from 'crypto';

export class Wallet {
  public publicKey: string;
  public privateKey: string;
  constructor() {
    // @ts-ignore
    const keypair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEndcoding: { type: 'pkcs8', format: 'pem' },
    });
    this.privateKey = keypair.privateKey;
    this.publicKey = keypair.publicKey;
  }

  transact(amount, payeePublicKey) {
    // rough logic
    // const transaction = new Transaction(amount, this.publicKey, payeePublicKey);
    // const sign = createSign('SHA256');
    // sign.update(transaction.tostring()).end();
    // const signature = sign.sign(this.privateKey);
  }
}
