# Lab Name
solidity2chaincode

# Short Description
This tool converts Solidity contract into Javascript chaincode through source-to-source translation for running them onto Hyperledger Fabric.

# Scope of Lab
The purpose of the lab is to perform a source-to-source translation of Solidity contracts into Javascript chaincode for running them into Hyperledger Fabric.

# Initial Committers
- https://github.com/ahmadzafar
- https://github.com/salmanbaset

# Sponsor
- Chris Ferris -  https://github.com/christo4ferris 

# Note: Apache License is not applicable on source examples.

# sol2fab

Sol2fab is a tool for translating Solidity contracts into Javascript
for Hyperlerger Fabric.


# To run the tool:

Make sure you have already installed node on your computer.

Step 1: Clone the repository

`git clone https://github.com/AhmadZafarITU/sol2fab.git`


Step 2: Install dependent packages

```
cd src
npm install
```

Step 3: Translate a Solidity contract (we will translate EIP20)

```
node app.js ../Examples/Example#15/EIP20.sol
``` 

The following files are generated. The chain code file is `EIP20/test.js`. A balance chaincode file is also generated.
```
.
./EIP20
./EIP20/test.js
./EIP20/package.json
./balance
./balance/package.json
./balance/balance.js
./README.md
```

Step 4:

Follow instructions on this page to test invocations of EIP20 contract in Ethereum Remix and translated chaincode.

https://github.com/AhmadZafarITU/sol2fab/blob/master/Testing/TestingExamplesParallelCommands/EIP20.md

# Fabric version supported

Fabric 1.3

# Status of the project
It is still in development phase. Approximately, 70-75% of Solidity keywords have translated. In particular, the following examples are covered:


1.	Storage (https://solidity.readthedocs.io/en/v0.4.24/introduction-to-smart-contracts.html)
2.  EnumExample (https://solidity.readthedocs.io/en/v0.4.24/types.html#enums)
3.  CrowdFunding (https://solidity.readthedocs.io/en/v0.4.24/types.html#structs)
4.  ProofOfExistence3 (https://github.com/sindelio/smart_contracts/blob/master/smart_contract_samples/ProofOfExistence.sol)
5.	Coin (https://solidity.readthedocs.io/en/v0.4.24/introduction-to-smart-contracts.html)
6.	Voting (https://solidity.readthedocs.io/en/v0.4.24/solidity-by-example.html)
7.  Simple Open Auction (https://solidity.readthedocs.io/en/v0.4.24/solidity-by-example.html)
8.  bank (https://github.com/James-Sangalli/learn-solidity-with-examples/blob/master/Finance/bank.sol) 
9.  Blind Auction (https://solidity.readthedocs.io/en/v0.4.24/solidity-by-example.html)
10. Safe Remote Purchase (https://solidity.readthedocs.io/en/v0.4.24/solidity-by-example.html)
11. Abstract Contracts (https://solidity.readthedocs.io/en/v0.4.21/contracts.html#abstract-contracts)
12. Contract Creating Other contract (https://solidity.readthedocs.io/en/v0.4.24/contracts.html#visibility-and-getters)
13. Claimable (https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ownership/Claimable.sol)
14. SimpleSavingsWallet (https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/examples/SimpleSavingsWallet.sol)
15. EIP20 Token (https://github.com/ConsenSys/Tokens/tree/master/contracts/eip20)
16. ERC223 Token (https://github.com/Dexaran/ERC223-token-standard/tree/master/token/ERC223)

