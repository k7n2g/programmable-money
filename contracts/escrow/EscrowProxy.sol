pragma solidity ^0.4.23;

import "../math/SafeMath.sol";
import "../ownership/Ownable.sol";


/**
 * @title Escrow Proxy
 * @dev Base contract supporting payments with ack
 */
contract EscrowProxy is Ownable {
  using SafeMath for uint256;

  address public originator;
  address public destination;
  uint256 public amount;

  uint256 public initiated;

  enum State { Created, Funded, Accepted, Rejected, Released }
  State public state;

  /**
   * @dev Constructor
   * @param _destination   address of the destination
   * @param _amount        amount in wei
   */
  constructor(address _destination, uint256 _amount) 
  public payable {
    require(_amount > 0);

    originator = msg.sender;
    destination = _destination;
    amount = _amount;

    // solium-disable-next-line security/no-block-members
    initiated = block.timestamp;
    state = State.Created;
  }

  /**
   * @dev Fund the amount
   */
  function () public payable {}

}
