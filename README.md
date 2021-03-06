# Use Cases for Programmable Money
[![Build Status](https://travis-ci.org/miktam/programmable-money.svg?branch=master)](https://travis-ci.org/miktam/programmable-money)
[![Coverage Status](https://coveralls.io/repos/github/miktam/programmable-money/badge.svg?branch=master)](https://coveralls.io/github/miktam/programmable-money?branch=master)

## Smart Contracts

This is a set of [Smart Contracts](https://en.wikipedia.org/wiki/Smart_contract) on Ethereum.
Reason to use is the ability to programatically (mathematically) ensure the outcomes of important interaction, such as:

- payment with conditions, such as acknowledge, locking, escrow and another examples of what is possible to automate money agreements. 

## Use Cases
A. Payment with condition: a) payer informs the payee, receives an acknowledgement, and confirms/releases the payment

I. Players:
1) **Originator** - payer
2) **Destination** - payee
3) **Proxy** - business logic of the transaction, smart contract

II. Amount:
1) **Amount** which Originator would like to send to Destination, using Proxy

III. Steps:

0) Alice and Bob download the app from AppStore/Google Play, and fund it with Ether/ERC20/any other digital asset on Ethereum blockchain.
1) *Originator* sends *Amount* to *Proxy*, specifying destination and timeout (Alice sends 1 ETH to Bob via _Proxy_, specifying timeout to 24h)
2) **Destination** app receives a notification that payment was initiated, acknowledges the payment (see 2a to see alternative)
3) *Originator* receives notification that payment was accepted, and has a choice to: 
4) *Originator* releases the funds
5) *Destinatior* receives funds 

or 

2) *Originator* rejects the payment
3) *Destination* receives notification that payment was rejected 

or

2) In case if *Destination* has not acknowledged the payment before the timeout, funds are returned to the *Originator* 

This use case is built on concepts of [PullPayment](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/payment/PullPayment.sol) introduced by OpenZeppelin. 

B. Time lock

I. Players:
1) **Originator** - payer
3) **Proxy** - business logic of the transaction, smart contract

II. Amount:
1) **Amount** which Originator would like to lock, using *Proxy*

III. Steps:

1) *Originator* sends *Amount* to *Proxy*, specifying the locking time (Alice locks 1 ETH  via _Proxy_, specifying time to lock: 1 month)
2) After 1 month, funds are released back to the *Originator*
3) *Originator* pulls the funds

C. Payment with confirmation: a) payer informs the payee, receives an acknowledgement, and confirms/releases the payment

The difference comparing to scenario A is that here multisig approach is used.
Initially senders issues a payment, which requires extra signature (mimicking multisig approach).
The main issue here is how to make sure that receiver is still the person who was intended to be paid.
It could be mitigated by creting an address of smart contract by the receiver, as one of the options.

## Security
Smart contracts are heavily influenced by [OpenZeppelin work](https://openzeppelin.org/api/docs/open-zeppelin.html) which focuses on community standards driven source code in Solidity. 
In addition, transparency of Ethereum Blockchain is adding audiatibility of all the steps.

## Motivation (Why?)
"If I had asked people what they wanted, they would have said faster horses" (H.Ford)

Probably instead of focusing how to make better (faster) payment mechanism (strong competitors, such as Visa and Mastercard), it is wiser to create scenarios which were not possible before, such as trivially easy to use smart contracts for non trivial use cases - such as escrow, pre-paid and other small (but important) payment related scenarios

## License
Code released under the [MIT License](LICENSE)
