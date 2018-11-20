
# For Testing EIP20:

## Step 1. Instantiating contract

### For Ethereum: 

After 8th step from sol2fab/Testing/TestingSolidityCode/README.md

--> In `2_deploy_contracts.js` file, replace the content with the following code.

```
var EIP20 = artifacts.require("EIP20");

module.exports = function(deployer) {
 deployer.deploy(EIP20,100,"test",4,"SBX");
};

```
--> To deploy to the contracts make sure Ganache is running and execute the following command.

```
truffle migrate

```
--> For testing the contract functions first get contract instance

```
SmartContract1.deployed().then(function(instance) { SmartContract1 = instance; });

```



### For Fabric:

After 6th step from sol2fab/Testing/TestingJavascriptCode/README.md

--> Update `deploytestChaincode.sh` file 

line no 8: `CHAINCODENAME="EIP20"`

--> Run the following command 
`./deploytestChaincode.sh`

--> Update `constructorRequest.json`

```
{
	"chaincodeName": "EIP20",
	"args": [ "100","test","4","SBX" ]
}
```

--> `node startContract.js admin`

#########################################################################

## Step 2: Test function `balanceOf` of EIP20

### For Ethereum:
```
EIP20.balanceOf(web3.eth.accounts[0], {from: web3.eth.accounts[0]}) ; //web3.eth.accounts[0] account 1 address
```
response = BigNumber { s: 1, e: 1, c: [ 100 ] } // actually value is coming in c: which is 100

### For Fabric:

--> update `functionCallRequest.json`

```
{
	"chaincodeName": "EIP20",
	"functionName": "balanceOf",
	"msg.value" : "0",
	"args": [ { "value": "admin" , "type": "address"} ]
}
```

--> `node query.js admin`
response = 100


#########################################################################

## Step 3: Test function `decimal` of EIP20

### For Ethereum:
```
EIP20.decimals({from: web3.eth.accounts[0]}) ; //web3.eth.accounts[0] account 1 address
```
response =  BigNumber { s: 1, e: 0, c: [ 4 ] } ; //actually value is coming in c: which is 4

### For Fabric:

--> update `functionCallRequest.json`

```
{
	"chaincodeName": "EIP20",
	"functionName": "decimals",
	"msg.value" : "0",
	"args": []
}
```

--> `node query.js account1`
response = 4

#########################################################################

## Step 4: Test function `name` of EIP20

### For Ethereum:
```
EIP20.name({from: web3.eth.accounts[0]}) ; //web3.eth.accounts[0] account 1 address
```
response = "test"

### For Fabric:

--> update `functionCallRequest.json`

```
{
	"chaincodeName": "EIP20",
	"functionName": "name",
	"msg.value" : "0",
	"args": []
}
```

--> `node query.js account1` 
response = test

#########################################################################

## Step 5: Test function `symbol` of EIP20

### For Ethereum:
```
EIP20.symbol({from: web3.eth.accounts[0]}) ; //web3.eth.accounts[0] account 1 address
```
response = 'SBX'

### For Fabric:

--> update `functionCallRequest.json`

```
{
	"chaincodeName": "EIP20",
	"functionName": "symbol",
	"msg.value" : "0",
	"args": []
}
```

--> `node query.js account1` 
response = SBX

#########################################################################

## Step 6: Test function `totalSupply` of EIP20

### For Ethereum:
```
EIP20.totalSupply({from: web3.eth.accounts[0]}) ; //web3.eth.accounts[0] account 1 address
```
response = BigNumber { s: 1, e: 2, c: [ 100 ] } // actually value is coming in c: which is 100

### For Fabric:

--> update `functionCallRequest.json`

```
{
	"chaincodeName": "EIP20",
	"functionName": "totalSupply",
	"msg.value" : "0",
	"args": []
}
```

--> `node query.js account1 `
response = 100

#########################################################################

## Step 7: Test function `transfer` of EIP20

### For Ethereum:
```
EIP20.transfer(web3.eth.accounts[1], 20, {from: web3.eth.accounts[0]}) ; //web3.eth.accounts[0] account 1 address
```

### For Fabric:

--> update functionCallRequest.json

```
{
	"chaincodeName": "EIP20",
	"functionName": "transfer",
	"msg.value" : "0",
	"args": [ { "value": "account2" , "type": "address"} , "20"]
}
```

--> `node invoke.js admin`

#########################################################################

## Step 8: Check the balance of sender account (Account1 in Remix, admin in Fabric)

### For Ethereum:
```
EIP20.balanceOf(web3.eth.accounts[0], {from: web3.eth.accounts[0]}) ; //web3.eth.accounts[0] account 1 address
```
response = BigNumber { s: 1, e: 1, c: [ 80 ] } // actually value is coming in c: which is 80

### For Fabric:

--> update `functionCallRequest.json`

{
	"chaincodeName": "EIP20",
	"functionName": "balanceOf",
	"msg.value" : "0",
	"args": [ { "value": "admin" , "type": "address"} ]
}

--> `node query.js account1`
response = 80

#########################################################################

## Step 9: Check the balance of receiver account (Account2 in Remix, account2 in Fabric)

### For Ethereum:
```
EIP20.balanceOf(web3.eth.accounts[1], {from: web3.eth.accounts[0]}) ; 
```
response = BigNumber { s: 1, e: 1, c: [ 20 ] } // actually value is coming in c: which is 20

### For Fabric:

--> update `functionCallRequest.json`

```
{
	"chaincodeName": "EIP20",
	"functionName": "balanceOf",
	"msg.value" : "0",
	"args": [ { "value": "account2" , "type": "address"} ]
}
```

--> `node query.js account1 `
response = 20


#########################################################################

## Step 10: Test the `approve` function

### For Ethereum:
```
EIP20.approve(web3.eth.accounts[2],25, {from: web3.eth.accounts[0]}) ; 
```

### For Fabric:

--> update `functionCallRequest.json`

```
{
	"chaincodeName": "EIP20",
	"functionName": "approve",
	"msg.value" : "0",
	"args": [ { "value": "account3" , "type": "address"} , "25" ]
}
```

--> `node invoke.js admin`

#########################################################################

## Step 11: Test the `allowed` function

### For Ethereum:

```
EIP20.allowed(web3.eth.accounts[0],web3.eth.accounts[2], {from: web3.eth.accounts[0]}) ; 
```
response = BigNumber { s: 1, e: 1, c: [ 25 ] } // actually value is coming in c: which is 25

### For Fabric:

--> update `functionCallRequest.json`

```
{
	"chaincodeName": "EIP20",
	"functionName": "allowed",
	"msg.value" : "0",
	"args": [ { "value": "admin" , "type": "address"},{ "value": "account3" , "type": "address"} ]
}
```

--> node query.js account1 
response = 25

#########################################################################

## Step 12: Test the `transferFrom` function

### For Ethereum:

```
EIP20.transferFrom(web3.eth.accounts[0],web3.eth.accounts[1],15, {from: web3.eth.accounts[2]}) ; 
```

### For Fabric:

--> update `functionCallRequest.json`

```
{
	"chaincodeName": "EIP20",
	"functionName": "transferFrom",
	"msg.value" : "0",
	"args": [ { "value": "admin" , "type": "address"},{ "value": "account2" , "type": "address"},"15" ]
}
```

--> `node invoke.js account3`


#########################################################################

## Step 13: Test the balance of source account (account1 in Remix, admin in Fabric)

### For Ethereum:

```
EIP20.balanceOf(web3.eth.accounts[0], {from: web3.eth.accounts[0]}) ; 
```
response = BigNumber { s: 1, e: 1, c: [ 65 ] } // actually value is coming in c: which is 65

### For Fabric:

--> update `functionCallRequest.json`

```
{
	"chaincodeName": "EIP20",
	"functionName": "balanceOf",
	"msg.value" : "0",
	"args": [ { "value": "admin" , "type": "address"} ]
}
```

--> `node query.js account1`
response = 65

#########################################################################


## Step 14: Test the balance of account2

### For Ethereum:

```
EIP20.balanceOf(web3.eth.accounts[1], {from: web3.eth.accounts[0]}) ; 
```
response = BigNumber { s: 1, e: 1, c: [ 35 ] } // actually value is coming in c: which is 35

### For Fabric:

--> update `functionCallRequest.json`

```
{
	"chaincodeName": "EIP20",
	"functionName": "balanceOf",
	"msg.value" : "0",
	"args": [ { "value": "account2" , "type": "address"} ]
}
```

--> `node query.js account1`
reponse = 35

#########################################################################

## Step 15: Test `allowed` for account3. 

### For Ethereum:

```
EIP20.allowed(web3.eth.accounts[0],web3.eth.accounts[2], {from: web3.eth.accounts[0]}) ; 
```
response = BigNumber { s: 1, e: 1, c: [ 10 ] } // actually value is coming in c: which is 10

### For Fabric:

--> update `functionCallRequest.json`

```
{
	"chaincodeName": "EIP20",
	"functionName": "allowed",
	"msg.value" : "0",
	"args": [ { "value": "admin" , "type": "address"},{ "value": "account3" , "type": "address"} ]
}
```

--> node query.js account1 
response = 10
