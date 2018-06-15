import increaseTime from '../helpers/increaseTime';
const BigNumber = web3.BigNumber;
const EVMThrow = require('../helpers/EVMThrow.js');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const TimeLockedPayment = artifacts.require('TimeLockedPayment');

contract('TimeLockedPayment', function ([ownerAddress, destinationAddress, other]) {
  const amount = web3.toWei(1.0, 'ether');
  const feesAmount = 1e16;

  // one month
  const ONE_MONTH_IN_HOURS = 24 * 30;

  beforeEach(async function () {
    this.contract = await TimeLockedPayment.new(amount, ONE_MONTH_IN_HOURS);
  });

  it('should reject if amount is not positive', async function () {
    const amount = 0;
    await TimeLockedPayment.new(amount,
      ONE_MONTH_IN_HOURS).should.be.rejectedWith(EVMThrow);
  });

  it('should reject if lock time is not positive', async function () {
    const lockTime = 0;
    await TimeLockedPayment.new(amount,
      lockTime).should.be.rejectedWith(EVMThrow);
  });

  it('should reject if not funded before the activation', async function () {
    await TimeLockedPayment.new(amount, ONE_MONTH_IN_HOURS);
  });

  it('should disable activation if not sufficiently funded', async function () {
    await this.contract.activate({ from: ownerAddress }).should.be.rejectedWith(EVMThrow);
  });

  it('should enable activation if sufficiently funded', async function () {
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });
    const isFunded = await this.contract.isFunded();
    isFunded.should.be.equal(true);
  });

  it('should not allow to withdraw before time lock has expired', async function () {
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });
    await this.contract.withdraw({ from: ownerAddress }).should.be.rejectedWith(EVMThrow);
  });

  it('should not allow to withdraw before funded', async function () {
    await this.contract.withdraw({ from: ownerAddress }).should.be.rejectedWith(EVMThrow);
  });

  it('should allow to withdraw after time lock has expired', async function () {
    const originalBalance = web3.eth.getBalance(ownerAddress).toNumber();
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    const afterFundsLocked = web3.eth.getBalance(ownerAddress).toNumber();
    assert(Math.abs(originalBalance - afterFundsLocked - amount) < feesAmount, 'Balance should not change');

    await this.contract.activate({ from: ownerAddress });
    const isFunded = await this.contract.isFunded();
    isFunded.should.be.equal(true);
    const oneMonthInSeconds = ONE_MONTH_IN_HOURS * 60 * 60;
    increaseTime(oneMonthInSeconds + 1);
    await this.contract.withdraw({ from: ownerAddress });
    const restoredBalance = web3.eth.getBalance(ownerAddress).toNumber();
    const isReleased = await this.contract.isReleased();
    isReleased.should.be.equal(true);
    assert(Math.abs(originalBalance - restoredBalance) < feesAmount,
      'After withdraw balance should be similar to the original one');
  });
});
