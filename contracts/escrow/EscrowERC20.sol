
pragma solidity ^0.4.24;

import "../math/SafeMath.sol";
import "../ownership/Ownable.sol";
import "../token/ERC20/ERC20.sol";


contract EscrowERC20 is Ownable {
  enum BetStatus { Initiated, Matched, Settled }

  struct Bet {
    address holder;
    ERC20 token;
    uint amount;
  }

  struct Proposal {
    Bet creator;
    Bet contender;
    BetStatus status;
  }

  mapping(uint => Proposal) public proposals;
  mapping(address => Bet) openBets;
  mapping(address => Bet) proposedBets;

  constructor (uint _id, ERC20 _token, uint _amount) public {
    openBets[msg.sender] = Bet(msg.sender, _token, _amount);
    proposals[_id].creator = openBets[msg.sender];
  }

  /**
   * Before matching the bet, check (TODO):
   * - is the amount of tokens sufficient?
   * - does the token belongs to the list of accepted tokens by bet creators
   */
  function matchBet(uint _id, ERC20 _token, uint _amount) public {
    proposedBets[msg.sender] = Bet(msg.sender, _token, _amount);
    proposals[_id].contender = proposedBets[msg.sender];
  }
}
