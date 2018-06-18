const BigNumber = web3.BigNumber;
const EVMThrow = require('../helpers/EVMThrow.js');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const EscrowProxy = artifacts.require('EscrowProxy');

const getBalanceInEther = (address) => {
  const amount = web3.eth.getBalance(address);
  return web3.fromWei(amount, 'ether').toNumber();
};

const fromWei = (amountInWei) => web3.fromWei(amountInWei, 'ether');

contract('EscrowProxy', function ([ownerAddress, destinationAddress, other]) {
  const amount = web3.toWei(1.0, 'ether');
  const feesAmount = 1e16;

  beforeEach(async function () {
    this.contract = await EscrowProxy.new(destinationAddress, amount);
  });

  it('should reject if initiated with garbage', async function () {
    const wrongAmount = 0;
    await EscrowProxy.new(destinationAddress,
      wrongAmount).should.be.rejectedWith(EVMThrow);
  });

  it('initiate escrow', async function () {
    /* STATE 0
      balances:
        owner = owner0
        proxy = 0
        destination = destination0
    */
    const ownerBalance = getBalanceInEther(ownerAddress);
    const proxyBalance = getBalanceInEther(this.contract.address);

    /* STATE I
      expected balances:
        owner = owner - amount
        proxy = amount
        destination = destination0
    */
    await web3.eth.sendTransaction({ from: ownerAddress, to: this.contract.address, value: amount });
    const newOwnerBalance = getBalanceInEther(ownerAddress);
    assert(Math.abs(ownerBalance - newOwnerBalance - fromWei(amount)) < feesAmount);

    const updatedEscrowBalance = getBalanceInEther(this.contract.address);
    assert(Math.abs(updatedEscrowBalance - proxyBalance - fromWei(amount)) < feesAmount);
  });
});
