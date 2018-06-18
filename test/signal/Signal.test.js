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
    const DATA_TO_SEND = 'my awesome data';
    const contractBalanceInitial = getBalanceInEther(this.contract.address);
    const txId = await web3.eth.sendTransaction({
      from: ownerAddress,
      data: web3.toHex(DATA_TO_SEND),
      to: this.contract.address,
      value: amount
    });

    const allTransactionInfo = web3.eth.getTransaction(txId);
    // check if data is stored correctly
    web3.toAscii(allTransactionInfo.input).should.equal(DATA_TO_SEND);

    (getBalanceInEther(this.contract.address) - AMOUNT_IN_ETHER).should.equal(contractBalanceInitial);
  });
});
