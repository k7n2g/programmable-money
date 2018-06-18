pragma solidity ^0.4.23;

import "../ownership/Ownable.sol";

/**
 * @dev In active development
 */
contract Signal is Ownable {

  event Log(uint256 amount, bytes abc);

  constructor() 
  public payable {
    owner = msg.sender;
  }

  function () public payable {
    emit Log(msg.value, msg.data);
  }
}
