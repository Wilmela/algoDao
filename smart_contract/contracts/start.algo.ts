import { Contract } from '@algorandfoundation/tealscript';
// import { verify } from 'crypto';

// eslint-disable-next-line no-unused-vars
class Start extends Contract {
  registeredAsaId = GlobalStateKey<Asset>();

  proposal = GlobalStateKey<string>();

  votesTotal = GlobalStateKey<number>();

  votesInFavor = GlobalStateKey<number>();

  inFavor = BoxMap<Address, boolean>();

  createApplication(proposal: string): void {
    this.proposal.value = proposal;
  }

  // Make and asset. This is one tnx call
  bootstrap(): Asset {
    verifyTxn(this.txn, { sender: this.app.creator }); // Verifies this contract is the caller
    assert(!this.registeredAsaId.exists); // Ensure not a particular asset had been created
    // Create an asset
    const registeredAsa = sendAssetCreation({
      configAssetTotal: 1_000, // Total supply
      configAssetFreeze: this.app.address, // This contract has the ability to freeze assets
      configAssetClawback: this.app.address, // This contract takes back assets on close out
    });
    // Update the global state value with the regenerated asset
    this.registeredAsaId.value = registeredAsa;
    return registeredAsa; // return the generated asset
  }

  // Register transfers 1 ASA to tnx.sender then freezes it. 3 tnx in a row
  // 1 optin, 2 sendAssesTransfer, 3 sendAssetFreeze
  // @allow.call('OptIn')
  // eslint-disable-next-line no-unused-vars
  register(registeredASA: Asset): void {
    assert(this.txn.sender.assetBalance(this.registeredAsaId.value) === 0);
    sendAssetTransfer({
      xferAsset: this.registeredAsaId.value,
      assetReceiver: this.txn.sender,
      assetAmount: 1,
    });

    sendAssetFreeze({
      freezeAsset: this.registeredAsaId.value,
      freezeAssetAccount: this.txn.sender,
      freezeAssetFrozen: true,
    });
  }

  getRegisteredASA(): Asset {
    return this.registeredAsaId.value;
  }

  // eslint-disable-next-line no-unused-vars
  vote(boxMBRPayment: PayTxn, inFavor: boolean, registeredASA: Asset): void {
    // Ensure the caller (msg.sender) has an asset
    assert(this.txn.sender.assetBalance(this.registeredAsaId.value) === 1);
    assert(!this.inFavor(this.txn.sender).exists);
    this.inFavor(this.txn.sender).value = inFavor;

    const preBoxMBR = this.app.address.minBalance; // Get initial MBR for creating a Box

    verifyTxn(boxMBRPayment, {
      receiver: this.app.address, // Payment receiver
      amount: this.app.address.minBalance - preBoxMBR, // Subtract whatever the current
      // MBR amount is from the previous
    });

    this.votesTotal.value = this.votesTotal.value + 1;

    if (inFavor) {
      this.votesInFavor.value = this.votesInFavor.value + 1;
    }
  }

  // @allow.call('CloseOut')
  // eslint-disable-next-line no-unused-vars
  deregister(registeredASA: Asset): void {
    if (this.inFavor(this.txn.sender).exists) {
      this.votesTotal.value = this.votesTotal.value - 1;
      if (this.inFavor(this.txn.sender).value) {
        this.votesInFavor.value = this.votesInFavor.value - 1;
      }

      const preMBR = this.app.address.minBalance;
      this.inFavor(this.txn.sender).delete();

      sendPayment({
        amount: preMBR - this.app.address.minBalance,
        receiver: this.txn.sender,
      });
    }

    sendAssetTransfer({
      xferAsset: this.registeredAsaId.value,
      assetSender: this.txn.sender,
      assetReceiver: this.app.address,
      assetAmount: 1,
    });
  }

  getProposal(): string {
    return this.proposal.value;
  }

  getVotes(): [number, number] {
    return [this.votesInFavor.value, this.votesTotal.value];
  }
}
