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

  enum State { Funded, Accepted, Rejected, Released }
  State public state;
  
  uint256 initiated;

  /**
   * @dev Throws if called by any account other than the payee.
   */
  modifier onlyPayee() {
    require(msg.sender == destination);
    _;
  }

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

    // solium-disable-next-line security/no-block-members
    initiated = block.timestamp;
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
    require(address(this).balance >= amount);
    state = State.Funded;
  }

  /**
   * @dev Accept payment 
   */
  function accept() public onlyPayee {
    require(state == State.Funded);

    // solium-disable-next-line security/no-block-members
    uint256 elapsedTimeInSeconds = block.timestamp.sub(initiated);
    uint256 elapsedTimeInHours = elapsedTimeInSeconds.div(60*60);
    require(elapsedTimeInHours < timeoutInHours, "Can not be accepted after the timeout");

    state = State.Accepted;
  }

  /**
   * @dev Reject payment 
   */
  function reject() public onlyPayee {
    require(state == State.Funded);
    state = State.Rejected;
  }

  /**
   * @dev Release payment 
   */
  function release() public onlyOwner {
    require(state == State.Accepted);
    state = State.Released;
  }

  /**
  * @dev Claim released amount, called by payee
  */
  function claimReleasedFunds() public onlyPayee {
    require(state == State.Released, "Funds should be released by the owner first");
    destination.transfer(amount);
  }

  /**
  * @dev Claim released amount, called by payer
  */
  function claimRejectedFunds() public onlyOwner {
    require(state == State.Rejected, "Funds should be rejected by the payee first");
    originator.transfer(amount);
  }

  /**
  * @dev Claim not accepted funds
  */
  function claimTimeoutedFunds() public onlyOwner {

    require(state != State.Rejected, "Payment should not be rejected");
    // solium-disable-next-line security/no-block-members
    uint256 elapsedTimeInSeconds = block.timestamp.sub(initiated);
    uint256 elapsedTimeInHours = elapsedTimeInSeconds.div(60*60);
    require(elapsedTimeInHours > timeoutInHours);

    // reject payment
    state = State.Rejected;
    originator.transfer(amount);
  }

  /**
   * @dev getter to check if contract is funded
   */
  function isFunded() public view returns (bool) {
    return State.Funded == state;
  }


  /**
   * @dev getter to check if contract is accepted
   */
  function isAccepted() public view returns (bool) {
    return State.Accepted == state;
  }

  /**
   * @dev getter to check if contract is released
   */
  function isReleased() public view returns (bool) {
    return State.Released == state;
  }

}
