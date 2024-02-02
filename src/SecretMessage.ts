import {
  Field,
  SmartContract,
  state,
  State,
  method, Reducer, PublicKey, PrivateKey, Bool, Struct
} from 'o1js';

const adminPublicKey = "B62qmSizxA4KPDV9pAa8G9WxiM9A6Z2YsW8SJr26gR2nFnerMuGn9V1"

const initial = {
  state: Bool(false),
  actionState: Reducer.initialActionState,
};

export class SecretMessage extends SmartContract {
  @state(Field) num = State<Field>();
  @state(PublicKey) adminKey = State<PublicKey>();
  reducer = Reducer({ actionType: PublicKey });

  init() {
    super.init();
    this.num.set(Field(3));
    this.adminKey.set(PublicKey.fromBase58(adminPublicKey));
  }

  @method addAddress(address: PublicKey, adminPrivateKey: PrivateKey) {
    const adminKey = this.adminKey.getAndRequireEquals();
    PublicKey.fromPrivateKey(adminPrivateKey).equals(adminKey).assertEquals(true);
    const actions = this.reducer.getActions({
      fromActionState: Reducer.initialActionState,
    });

    let { state: addressExists, actionState } = this.reducer.reduce(
        actions,
        Bool,
        (state: Bool, action: PublicKey) => state.or(action.equals(address)),
        initial
    );

    addressExists.assertFalse('Address exists already')
    this.reducer.dispatch(address);
  }

}
