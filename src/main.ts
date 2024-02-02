import { SecretMessage } from './SecretMessage.js';
import {
  Field,
  Mina,
  PrivateKey,
  AccountUpdate, PublicKey,
} from 'o1js';

const useProof = false;

const Local = Mina.LocalBlockchain({ proofsEnabled: useProof });
Mina.setActiveInstance(Local);
const { privateKey: deployerKey, publicKey: deployerAccount } = Local.testAccounts[0];
const { privateKey: senderKey, publicKey: senderAccount } = Local.testAccounts[1];

console.log(deployerAccount.toBase58())

const zkAppPrivateKey = PrivateKey.random();
const zkAppAddress = zkAppPrivateKey.toPublicKey();

const zkAppInstance = new SecretMessage(zkAppAddress);
const deployTxn = await Mina.transaction(deployerAccount, () => {
  AccountUpdate.fundNewAccount(deployerAccount);
  zkAppInstance.deploy();
});
await deployTxn.sign([deployerKey, zkAppPrivateKey]).send();

const num0 = zkAppInstance.num.get();
console.log('state after init:', num0.toString());

const txn1 = await Mina.transaction(senderAccount, () => {
  zkAppInstance.addAddress(PublicKey.fromBase58('B62qoFq6xWugjEe4Gag8QYwuTkjuufC8EWiYsstr3c1CfRctNrRtHEg'), PrivateKey.fromBase58(""));
});
await txn1.prove();
await txn1.sign([senderKey]).send();


const txn2 = await Mina.transaction(senderAccount, () => {
  zkAppInstance.addAddress(PublicKey.fromBase58('B62qoFq6xWugjEe4Gag8QYwuTkjuufC8EWiYsstr3c1CfRctNrRtHEg'), PrivateKey.fromBase58(""));
});
await txn2.prove();
await txn2.sign([senderKey]).send();


const num1 = zkAppInstance.num.get();
console.log('state after txn1:', num1.toString());
