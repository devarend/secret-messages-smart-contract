import { SecretMessage } from "./SecretMessage";
import { Mina, PrivateKey, PublicKey, AccountUpdate, UInt8, Field } from "o1js";

let proofsEnabled = false;

describe("SecretMessage", () => {
  let deployerAccount: PublicKey,
    deployerKey: PrivateKey,
    senderAccount: PublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: SecretMessage;

  const adminPrivateKey = PrivateKey.fromBase58(
    "EKEiWxPJCYkPS5fEv6CkUN1xT1J8rh9ekcBeAu1dLA2vyHJicj2v"
  );

  const user1PrivateKey = PrivateKey.fromBase58(
    "EKEGarttGcyMUCCv4dTWmHA1r5DCxTJQ64svKujspbBrTxfHQgdS"
  );

  const user2PrivateKey = PrivateKey.fromBase58(
    "EKFNeHKHPMYUwvmpqRr4hTyuLPte4o1kKuHxcnaVF2FS1pEeYLuE"
  );

  const user3PrivateKey = PrivateKey.fromBase58(
    "EKE3G8iDwPPoJUdQdiX9bRHe8ofdWrWePZXAHNatYXa7PZz2cXd5"
  );

  beforeAll(async () => {
    if (proofsEnabled) await SecretMessage.compile();
  });

  beforeEach(() => {
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    ({ privateKey: deployerKey, publicKey: deployerAccount } =
      Local.testAccounts[0]);
    ({ privateKey: senderKey, publicKey: senderAccount } =
      Local.testAccounts[1]);
    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new SecretMessage(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it("generates and deploys the `SecretMessage` smart contract with correct initial values", async () => {
    await localDeploy();
    const amountOfMessagesSent = zkApp.amountOfMessagesSent.get();
    const adminKey = zkApp.adminKey.get();
    expect(amountOfMessagesSent).toEqual(UInt8.from(0));
    expect(adminKey).toEqual(PublicKey.fromPrivateKey(adminPrivateKey));
  });

  it("correctly adds an address using the admin private key", async () => {
    await localDeploy();

    // update transaction
    const txn = await Mina.transaction(senderAccount, () => {
      zkApp.addAddress(
        PublicKey.fromPrivateKey(user1PrivateKey),
        adminPrivateKey
      );
    });
    await txn.prove();
    const transaction = await txn.sign([senderKey]).send();
    expect(transaction.isSuccess).toBeTruthy();
  });

  it("correctly adds an address and a message using the private key of an user", async () => {
    await localDeploy();

    const txn = await Mina.transaction(senderAccount, () => {
      zkApp.addAddress(
        PublicKey.fromPrivateKey(user1PrivateKey),
        adminPrivateKey
      );
    });
    await txn.prove();
    const transaction = await txn.sign([senderKey]).send();
    expect(transaction.isSuccess).toBeTruthy();

    const txn2 = await Mina.transaction(senderAccount, () => {
      zkApp.addMessage(Field(28), user1PrivateKey);
    });
    await txn2.prove();
    const transaction2 = await txn2.sign([senderKey]).send();
    const amountOfMessagesSent = zkApp.amountOfMessagesSent.get();
    expect(transaction2.isSuccess).toBeTruthy();
    expect(amountOfMessagesSent.toNumber()).toBe(1);
  });

  it("correctly prevents an user to send two messages with the same private key", async () => {
    await localDeploy();

    const txn = await Mina.transaction(senderAccount, () => {
      zkApp.addAddress(
        PublicKey.fromPrivateKey(user1PrivateKey),
        adminPrivateKey
      );
    });
    await txn.prove();
    const transaction = await txn.sign([senderKey]).send();
    expect(transaction.isSuccess).toBeTruthy();

    const txn2 = await Mina.transaction(senderAccount, () => {
      zkApp.addMessage(Field(28), user1PrivateKey);
    });
    await txn2.prove();
    const transaction2 = await txn2.sign([senderKey]).send();
    const amountOfMessagesSent = zkApp.amountOfMessagesSent.get();
    expect(transaction2.isSuccess).toBeTruthy();
    expect(amountOfMessagesSent.toNumber()).toBe(1);

    let failed = false;
    try {
      const txn3 = await Mina.transaction(senderAccount, () => {
        zkApp.addMessage(Field(28), user1PrivateKey);
      });
      await txn3.prove();
      await txn3.sign([senderKey]).send();
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);
    const amountOfMessagesSent3 = zkApp.amountOfMessagesSent.get();
    expect(amountOfMessagesSent3.toNumber()).toBe(1);
  });
});
