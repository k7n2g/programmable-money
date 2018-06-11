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

  it('should accept activation if sufficiently funded', async function () {
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    await this.contract.activate({ from: ownerAddress });
    const isActive = await this.contract.isActive();
    isActive.should.be.equal(true);
  });

  it('should accept funding the reward by the owner', async function () {
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    const balance = web3.eth.getBalance(this.contract.address);
    balance.should.be.bignumber.equal(amount);
  });

  it('should accept funding the reward by the external caller', async function () {
    await web3.eth.sendTransaction({ from: other, to: this.contract.address, value: amount });
    const balance = web3.eth.getBalance(this.contract.address);
    balance.should.be.bignumber.equal(amount);
  });
});
