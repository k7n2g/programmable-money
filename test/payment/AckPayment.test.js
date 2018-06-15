import increaseTime from '../helpers/increaseTime';
const BigNumber = web3.BigNumber;
const EVMThrow = require('../helpers/EVMThrow.js');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const AckPayment = artifacts.require('AckPayment');

contract('AckPayment', function ([ownerAddress, destinationAddress, other]) {
  const amount = web3.toWei(1.0, 'ether');
  const feesAmount = 1e16;

  const timeoutInHours = 1;

  beforeEach(async function () {
    this.contract = await AckPayment.new(destinationAddress, amount, timeoutInHours);
  });

  it('should reject if payment amount is not positive', async function () {
    const wrongAmount = 0;
    await AckPayment.new(destinationAddress,
      wrongAmount,
      timeoutInHours).should.be.rejectedWith(EVMThrow);
  });

  it('should reject if timeout is not positive', async function () {
    const wrongTimeout = 0;
    await AckPayment.new(destinationAddress,
      amount,
      wrongTimeout).should.be.rejectedWith(EVMThrow);
  });

  it('should disable activation if not sufficiently funded', async function () {
    await this.contract.activate({ from: ownerAddress }).should.be.rejectedWith(EVMThrow);
  });

  it('should throw if attempted to be released too soon', async function () {
    await this.contract.release({ from: ownerAddress }).should.be.rejectedWith(EVMThrow);
  });

  it('should throw if attempted to be rejected too soon', async function () {
    await this.contract.reject({ from: destinationAddress }).should.be.rejectedWith(EVMThrow);
  });

  it('should throw if attempted to be accepted too soon', async function () {
    await this.contract.accept({ from: destinationAddress }).should.be.rejectedWith(EVMThrow);
  });

  it('should throw if attempted to be released too soon', async function () {
    await this.contract.claimReleasedFunds({ from: destinationAddress }).should.be.rejectedWith(EVMThrow);
  });

  it('should throw if attempted to be released because of the timeout too soon', async function () {
    await this.contract.claimTimeoutedFunds({ from: ownerAddress }).should.be.rejectedWith(EVMThrow);
  });

  it('should throw if attempted to be released because of the timeout too soon', async function () {
    await this.contract.claimRejectedFunds({ from: ownerAddress }).should.be.rejectedWith(EVMThrow);
  });

  it('should enable activation if sufficiently funded', async function () {
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });
    const isFunded = await this.contract.isFunded();
    isFunded.should.be.equal(true);
  });

  it('should enable funding the reward by the owner', async function () {
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    const balance = web3.eth.getBalance(this.contract.address);
    balance.should.be.bignumber.equal(amount);
  });

  it('should enable funding the reward by the external caller', async function () {
    await web3.eth.sendTransaction({ from: other, to: this.contract.address, value: amount });
    const balance = web3.eth.getBalance(this.contract.address);
    balance.should.be.bignumber.equal(amount);
  });

  it('should allow to accept the payment by payee', async function () {
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });
    await this.contract.accept({ from: destinationAddress });
    const isAccepted = await this.contract.isAccepted();
    isAccepted.should.be.equal(true);
  });

  it('should reject if accepted not by the payee but by the owner', async function () {
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });
    await this.contract.accept({ from: ownerAddress }).should.be.rejectedWith(EVMThrow);
  });

  it('should reject if accepted not by the payee but by the other account', async function () {
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });
    await this.contract.accept({ from: other }).should.be.rejectedWith(EVMThrow);
  });

  it('should allow to release the payment by payer', async function () {
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });
    await this.contract.accept({ from: destinationAddress });
    await this.contract.release({ from: ownerAddress });
    const isReleased = await this.contract.isReleased();
    isReleased.should.be.equal(true);
  });

  it('should throw if attempted to be released by not owner', async function () {
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });
    await this.contract.accept({ from: destinationAddress });
    await this.contract.release({ from: other }).should.be.rejectedWith(EVMThrow);
  });

  it('should throw if attempted to be claimed not by not payee', async function () {
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });
    await this.contract.accept({ from: destinationAddress });
    await this.contract.release({ from: ownerAddress });
    await this.contract.claimReleasedFunds({ from: other }).should.be.rejectedWith(EVMThrow);
  });

  it('should allow to claim the payment by payee', async function () {
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });
    await this.contract.accept({ from: destinationAddress });
    await this.contract.release({ from: ownerAddress });
    const destinationBalance = web3.eth.getBalance(destinationAddress);
    await this.contract.claimReleasedFunds({ from: destinationAddress });
    const destinationBalanceAfterClaim = web3.eth.getBalance(destinationAddress);
    destinationBalanceAfterClaim.should.be.not.equal(destinationBalance);
    assert(Math.abs(destinationBalanceAfterClaim - destinationBalance - amount) < feesAmount);
  });

  it('should allow to claim back rejected payment by payer', async function () {
    const initialOriginatorBalance = web3.eth.getBalance(ownerAddress).toNumber();
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });
    await this.contract.reject({ from: destinationAddress });
    await this.contract.claimRejectedFunds({ from: ownerAddress });
    const finalOriginatorBalance = web3.eth.getBalance(ownerAddress).toNumber();
    assert(Math.abs(finalOriginatorBalance - initialOriginatorBalance) < feesAmount, 'Balance should not change');
  });

  it('should throw if claiming rejected funds not by the owner', async function () {
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });
    await this.contract.reject({ from: destinationAddress });
    await this.contract.claimRejectedFunds({ from: other }).should.be.rejectedWith(EVMThrow);
  });

  it('should not allow to accept the payment after the timeout', async function () {
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });

    // rewind to expire the payment plus one second
    increaseTime(60 * 60 + 1);
    await this.contract.accept({ from: destinationAddress }).should.be.rejectedWith(EVMThrow);
  });

  it('should allow to claim back rejected funds', async function () {
    const initialOriginatorBalance = web3.eth.getBalance(ownerAddress).toNumber();
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });
    await this.contract.reject({ from: destinationAddress });
    await this.contract.claimRejectedFunds({ from: ownerAddress });
    const finalOriginatorBalance = web3.eth.getBalance(ownerAddress).toNumber();
    assert(Math.abs(finalOriginatorBalance - initialOriginatorBalance) < feesAmount, 'Balance should not change');
  });

  it('should allow to claim back timeouted funds', async function () {
    const initialOriginatorBalance = web3.eth.getBalance(ownerAddress).toNumber();
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });
    increaseTime(60 * 60 * 2);
    await this.contract.claimTimeoutedFunds({ from: ownerAddress });
    const finalOriginatorBalance = web3.eth.getBalance(ownerAddress).toNumber();
    assert(Math.abs(finalOriginatorBalance - initialOriginatorBalance) < feesAmount, 'Balance should not change');
  });

  it('should not allow to claim back timeouted funds too soon', async function () {
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });
    increaseTime(60 * 60 - 2);
    await this.contract.claimTimeoutedFunds({ from: ownerAddress }).should.be.rejectedWith(EVMThrow);
  });
});
