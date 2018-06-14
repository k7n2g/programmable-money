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

  const timeoutInHours = 1;
  const timeoutInSeconds = timeoutInHours * 60 * 60;

  beforeEach(async function () {
    this.contract = await AckPayment.new(destinationAddress, amount, timeoutInHours);
  });

  it('should reject contruction if amount is wrong', async function () {

    const wrongAmount = 0;
    await AckPayment.new(destinationAddress,
      wrongAmount,
      timeoutInHours).should.be.rejectedWith(EVMThrow);
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
});
