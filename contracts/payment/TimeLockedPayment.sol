pragma solidity ^0.4.23;

import "../math/SafeMath.sol";
import "../ownership/Ownable.sol";

/**
 * @title AckPayment
 * @dev Base contract supporting payments with ack
 */
contract TimeLockedPayment is Ownable {
  using SafeMath for uint256;

  uint256 public amount;
  uint256 public lockInHours;
  
  uint256 initiated;

  enum State { Funded, Released }
  State public state;

  /**
   * @dev Constructor
   * @param _amount       amount to send in wei
   * @param _lockInHours  time to lock funds
   */
  constructor(uint256 _amount, uint256 _lockInHours) public payable {
    require(_amount > 0);
    require(_lockInHours > 0);

    owner = msg.sender;
    amount = _amount;
    lockInHours = _lockInHours;

    // solium-disable-next-line security/no-block-members
    initiated = block.timestamp;
  }

  /**
   * @dev Fund the amount
   */
  function () public payable {}

  /**
   * @dev Activate the time lock
   * Requires to be sufficiently funded
   */
  function activate() public onlyOwner {
    require(address(this).balance >= amount);
    state = State.Funded;
  }

  /**
   * @dev getter to check if contract is funded
   */
  function isFunded() public view returns (bool) {
    return State.Funded == state;
  }

  /**
   * @dev getter to check if contract is released
   */
  function isReleased() public view returns (bool) {
    return State.Released == state;
  }

    /**
  * @dev Withdraw funds after time lock has expired
  */
  function withdraw() public onlyOwner {
    require(State.Funded == state);
    // solium-disable-next-line security/no-block-members
    uint256 elapsedTimeInSeconds = block.timestamp.sub(initiated);
    uint256 elapsedTimeInHours = elapsedTimeInSeconds.div(60*60);
    require(elapsedTimeInHours >= lockInHours);
    owner.transfer(amount);
    state = State.Released;
  }
}
