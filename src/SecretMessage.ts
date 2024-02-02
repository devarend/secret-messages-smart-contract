import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Reducer,
  PublicKey,
  PrivateKey,
  Bool,
  UInt8,
  Gadgets,
  Provable,
  Struct,
} from "o1js";

const adminPublicKey =
  "B62qmSizxA4KPDV9pAa8G9WxiM9A6Z2YsW8SJr26gR2nFnerMuGn9V1";

const initial = {
  state: Bool(false),
  actionState: Reducer.initialActionState,
};

export class Message extends Struct({
  address: PublicKey,
  message: Field,
}) {}

export class SecretMessage extends SmartContract {
  @state(UInt8) amountOfMessagesSent = State<UInt8>();
  @state(PublicKey) adminKey = State<PublicKey>();
  reducer = Reducer({ actionType: Message });

  init() {
    super.init();
    this.amountOfMessagesSent.set(UInt8.from(0));
    this.adminKey.set(PublicKey.fromBase58(adminPublicKey));
  }

  @method addAddress(address: PublicKey, adminPrivateKey: PrivateKey) {
    const adminKey = this.adminKey.getAndRequireEquals();
    PublicKey.fromPrivateKey(adminPrivateKey)
      .equals(adminKey)
      .assertEquals(true);
    const actions = this.reducer.getActions({
      fromActionState: Reducer.initialActionState,
    });

    let { state: addressExists } = this.reducer.reduce(
      actions,
      Bool,
      (state: Bool, action: Message) =>
        state.or(action.address.equals(address)),
      initial
    );

    addressExists.assertFalse("Address already exists");
    this.reducer.dispatch(new Message({ address, message: Field(0) }));
  }

  @method addMessage(message: Field, eligiblePrivateKey: PrivateKey) {
    const eligibleAddress = PublicKey.fromPrivateKey(eligiblePrivateKey);
    const actions = this.reducer.getActions({
      fromActionState: Reducer.initialActionState,
    });
    let { state: allowedToAddMessage } = this.reducer.reduce(
      actions,
      Bool,
      (state: Bool, action: Message) =>
        state
          .or(action.address.equals(eligibleAddress))
          .and(action.message.equals(Field(0))),
      initial
    );
    allowedToAddMessage.assertTrue("Address is not allowed to add a message");

    const filteredMessage = Gadgets.and(message, Field.from(63), 254);
    const [sixthBit, fifthBit, fourthBit, thirdBit, secondBit, firstBit] =
      filteredMessage.toBits(6);

    const firstCheck = Provable.if(
      firstBit.equals(Bool(true)),
      secondBit.or(thirdBit).or(fourthBit).or(fifthBit).or(sixthBit),
      Bool(false)
    );
    firstCheck.assertEquals(Bool(false));

    const secondCheck = Provable.if(
      secondBit.equals(Bool(true)),
      thirdBit.equals(Bool(true)),
      Bool(false)
    );
    secondCheck.assertEquals(Bool(true));

    const thirdCheck = Provable.if(
      fourthBit.equals(Bool(true)),
      fifthBit.or(sixthBit),
      Bool(false)
    );
    thirdCheck.assertEquals(Bool(false));

    const amountOfMessagesSent =
      this.amountOfMessagesSent.getAndRequireEquals();
    this.amountOfMessagesSent.set(amountOfMessagesSent.add(1));

    this.reducer.dispatch(
      new Message({
        address: eligibleAddress,
        message,
      })
    );
  }
}
