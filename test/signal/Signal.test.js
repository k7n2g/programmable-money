const BigNumber = web3.BigNumber;

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const Signal = artifacts.require('Signal');

const getBalanceInEther = (address) => {
  const amount = web3.eth.getBalance(address);
  return web3.fromWei(amount, 'ether').toNumber();
};

contract('Signal', function ([ownerAddress, destinationAddress, other]) {
  const AMOUNT_IN_ETHER = 1.125;
  const amount = web3.toWei(AMOUNT_IN_ETHER, 'ether');

  beforeEach(async function () {
    this.contract = await Signal.new();
  });

  it('should send data among with the transaction', async function () {
    const contractBalanceInitial = getBalanceInEther(this.contract.address);
    web3.eth.sendTransaction({ from: ownerAddress, data: 'abcdef', to: this.contract.address, value: amount });
    const contractBalanceAfter = getBalanceInEther(this.contract.address);

    (contractBalanceAfter - AMOUNT_IN_ETHER).should.equal(contractBalanceInitial);
  });
});
