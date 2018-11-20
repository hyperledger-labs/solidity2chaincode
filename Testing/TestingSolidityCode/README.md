

# Compile and Migrate Ethereum smart contracts on personal Ethereum blockchain (Ganache).

Step 1: Install truffle. 

`npm install -g truffle`

Step 2: Download and install ganache from: https://truffleframework.com/ganache

Step 3: Make a directory to test Smart Contracts and go to that directory.

```
mkdir test
cd test

```

Step 4: Run the follwing command to instantiate a truffle project, which will generate required directory structure and files.

```
truffle init

```

Step 5: Paste all contract files inside `contracts` folder in test directory.

For EIP20 Example:

Paste `EIP20.sol` and `EIP20Interface.sol` inside `contracts` folder in test directory.

Step 6: Run the following command to compile the smart contracts.

```
truffle compile

```

Step 7:  Open file `truffle.js` present in test directory and replace the content of the file with the following code.

```
module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    }
  }
};
```

Step 8: Go to `migrations` folder in test directory and create a file named `2_deploy_contracts.js` and open the file.

Step 9: Edit the file `2_deploy_contracts.js` and add each contract which is use the tested contracted.

For One Contract: If contract name is `SmartContract1` and it takes 2 parameters then update like below:

```
var contract1 = artifacts.require("SmartContract1");
module.exports = function(deployer) {
 deployer.deploy(contract1,"test",40);
};

```
For More than one Contract: `2_deploy_contracts.js` will be like below

```
var contract1 = artifacts.require("SmartContract1");
var contract2 = artifacts.require("SmartContract2");
module.exports = function(deployer) {
 deployer.deploy(contract1,"test",40);
 deployer.deploy(contract2);

};
```

Note: `SmartContract1` and `SmartContract2` should be replaced by the name of smart contracts.


For EIP20 Example: In `2_deploy_contracts.js` file, replace the content with the following code.

```
var EIP20 = artifacts.require("EIP20");

module.exports = function(deployer) {
 deployer.deploy(EIP20,100,"test",4,"SBX");
};

```




Step 10: To deploy to the contracts make sure Ganache is running and execute the following command.

```
truffle migrate

```

# Testing functions of Ethereum Samrt Contracts

Step 11: To interact with the contract run the following commands

```
truffle console

```

Step 12: For testing the contract functions first get contract instance

```
SmartContract1.deployed().then(function(instance) { SmartContract1 = instance; });

```

Note: `SmartContract1` should be replaced by the name of smart contract.


For EIP20: To interact with the `EIP20` contract run the following command

```

EIP20.deployed().then(function(instance) { EIP20= instance; });

```

Step 13: For testing any function run this command

```
SmartContract1.func(10,20 , {from: web3.eth.accounts[0]} )

```
Note: `SmartContract1` should be replaced by the name of smart contract and `func` should be replaced by the name of function in `SmartContract1` and `web3.eth.accounts[0]` is account 1 address of my personal Ethereum blockchain (Ganache). 

`{from: web3.eth.accounts[0]}` is function caller address.

For EIP20: To interect with the `EIP20` contract function 'balanceOf' run the following command

```
EIP20.balanceOf(web3.eth.accounts[1], {from: web3.eth.accounts[0]})

```

For function 'transfer' run the following command

```
EIP20.transfer(web3.eth.accounts[2],20, {from: web3.eth.accounts[1]})

```

