import {
  Field,
  SmartContract,
  state,
  State,
  method, Reducer, PublicKey, PrivateKey, Bool, UInt8
} from 'o1js';

const adminPublicKey = "B62qmSizxA4KPDV9pAa8G9WxiM9A6Z2YsW8SJr26gR2nFnerMuGn9V1"

const initial = {
  state: Bool(false),
  actionState: Reducer.initialActionState,
};

export class SecretMessage extends SmartContract {
  @state(UInt8) amountOfMessagesSent = State<UInt8>();
  @state(PublicKey) adminKey = State<PublicKey>();
  reducer = Reducer({ actionType: PublicKey });

  init() {
    super.init();
    this.amountOfMessagesSent.set(UInt8.from(0));
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

    addressExists.assertFalse('Address exists already');
    this.reducer.dispatch(address);
  }

  @method addMessage(message: Field, eligiblePrivateKey: PrivateKey) {
    const eligibleAddress = PublicKey.fromPrivateKey(eligiblePrivateKey);

    const actions = this.reducer.getActions({
      fromActionState: Reducer.initialActionState,
    });

    let { state: isAddressEligible } = this.reducer.reduce(
        actions,
        Bool,
        (state: Bool, action: PublicKey) => state.or(action.equals(eligibleAddress)),
        initial
    );

    isAddressEligible.assertTrue('Address is not eligible');
    const amountOfMessagesSent = this.amountOfMessagesSent.getAndRequireEquals();
    this.amountOfMessagesSent.set(amountOfMessagesSent.add(1));
  }

}
