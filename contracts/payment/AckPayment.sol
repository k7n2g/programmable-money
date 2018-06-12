pragma solidity ^0.4.23;

import "../math/SafeMath.sol";
import "../ownership/Ownable.sol";

/**
 * @title AckPayment
 * @dev Base contract supporting payments with ack
 */
contract AckPayment is Ownable {
  using SafeMath for uint256;

  address public originator;
  address public destination;
  uint256 public amount;
  uint256 public timeoutInHours;

  enum State { Created, Funded, Accepted, Released }
  State public state;

  /**
   * @dev Constructor
   * @param _destination   address of the destination
   * @param _amount        amount to send in wei
   * @param _timeoutInHours expiration time before destination will accept
   */
  constructor(address _destination, uint256 _amount, uint256 _timeoutInHours) public payable {
    require(_amount > 0);
    require(_timeoutInHours > 0);

    originator = msg.sender;
    destination = _destination;
    amount = _amount;
    timeoutInHours = _timeoutInHours;

    state = State.Created;
  }

  /**
   * @dev Fund the amount
   */
  function () public payable {}

  /**
   * @dev Activate payment 
   * prerequisite: contract is funded 
   */
  function activate() public onlyOwner {
    require(state == State.Created);
    require(address(this).balance >= amount);
    state = State.Funded;
  }

  /**
   * @dev Get current state
   */
  function isActive() public view returns (bool) {
    return State.Funded == state;
  }
}
