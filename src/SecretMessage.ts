import {
  Field,
  SmartContract,
  state,
  State,
  method, Reducer, PublicKey, PrivateKey
} from 'o1js';

const adminPublicKey = "B62qmSizxA4KPDV9pAa8G9WxiM9A6Z2YsW8SJr26gR2nFnerMuGn9V1"

export class SecretMessage extends SmartContract {
  @state(Field) num = State<Field>();
  @state(PublicKey) adminKey = State<PublicKey>();
  reducer = Reducer({ actionType: Field });

  init() {
    super.init();
    this.num.set(Field(3));
    this.adminKey.set(PublicKey.fromBase58(adminPublicKey));
  }

  @method addAddress(address: Field, adminPrivateKey: PrivateKey) {
    const adminKey = this.adminKey.getAndRequireEquals();
    PublicKey.fromPrivateKey(adminPrivateKey).equals(adminKey).assertEquals(true);
  }

}
