const BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const StandardToken1 = artifacts.require('StandardTokenMock');
const StandardToken2 = artifacts.require('StandardTokenMock');

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

const ERC20Escrow = artifacts.require('EscrowERC20');

contract('EscrowERC20', function ([owner, other]) {
  beforeEach(async function () {
    this.betId = 1;
    this.tokenA = await StandardToken1.new(owner, 100);
    this.tokenB = await StandardToken2.new(other, 100);
    this.contract = await ERC20Escrow.new(this.betId, this.tokenA.address, 10, { from: owner });
  });

  it('should create first bet', async function () {
    await this.contract.matchBet(this.betId, this.tokenB.address, 20, { from: other });
  });
});
