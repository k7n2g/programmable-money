pragma solidity ^0.4.23;

import "../ownership/Ownable.sol";

/**
 * @dev In active development
 */
contract Signal is Ownable {

  constructor() 
  public payable {
    owner = msg.sender;
  }

  function () public payable {}
}
