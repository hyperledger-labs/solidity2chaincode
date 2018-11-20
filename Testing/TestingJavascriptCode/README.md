
# Installing and instantiating translated chaincode in Fabric.

Make sure your fabric prerequisites are installed on your computer. For this you can help from the following link.

https://hyperledger-fabric.readthedocs.io/en/release-1.3/prereqs.html

Step 1: Get Fabric 1.3 images and binaries

Remove any recent versions of Fabric images:
`docker images | grep fabric | awk '{print $3}' | xargs docker rmi -f`

Get 1.3 images:
`curl -sSL http://bit.ly/2ysbOFE | bash -s 1.3.0 1.3.0 0.4.13`

See this link for details:
https://hyperledger-fabric.readthedocs.io/en/release-1.3/install.html


Step 2: Copy the output directory containing the translator output into `sol2fab/Testing/TestingJavascriptCode/test/chaincode`  directory.

Example for EIP20:

In sol2fab directory:

`cp -r Examples/Example#15/output Testing/TestingJavascriptCode/test/chaincode/`

`cd Testing/TestingJavascriptCode/test/testChaincode/`

Step 3: Reset the current network and start the network.

```
./removeEverything.sh
./startFabricNetwork.sh
```

`./startFabricNetwork.sh` is based on fabcar script.

Step 4: (Optional: Install balance chain code)

```
./deploybalanceChaincode.sh
```

Step 5: (Optional: If not already registered, register user on fabric network) 

```
npm install
node enrollAdmin.js
```

If testing on Mac OS X, and you get the errors on `npm install`, run the following:

```
xcode-select --install
sudo xcode-select --switch /Library/Developer/CommandLineTools
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

Register and enroll five users on fabric network with the following names. These will mimic accounts in Ethereum Remix.
- account1
- account2
- account3
- account4
- account5 

(You can change the name of users, it is for simplicity)

```
node registerUser.js account1

node registerUser.js account2

node registerUser.js account3

node registerUser.js account4

node registerUser.js account5
```

Step 6: (Optional: If not already added users accounts for storing ether balance for users, for the time being set 10000 wei in each account )

```
node registerAccount.js account1 10000

node registerAccount.js account2 10000

node registerAccount.js account3 10000

node registerAccount.js account4 10000

node registerAccount.js account5 10000
```

Step 7: Install and instantiate the translated chaincode

Update chaincode path and chaincode name in `deploytestChaincode.sh` file. This chaincode name will be used for other contracts.

For EIP20, update `deploytestChaincode.sh` line no 8 as follows:
`CHAINCODENAME="EIP20"`

After updating file now this command on terminal

`./deploytestChaincode.sh`

Ensure that no errors occurred during this step.

To mimic Ethereum, the balance of chaincode (smart contract) needs to be added into the `balance`
chain code. Due to a limitation of Fabric, another chain code cannot be called upon a chain code instantiation.
Therefore, we have to explicitly invoke a function in the translated and installed chaincode which will
update its balance.

For EIP20, update the `constructorReuest.json` file with the name of translated chaincode, and the arguments for instantiation:

```
{
  "chaincodeName": "EIP20",
  "args": [
    "100",
    "test",
    "4",
    "SBX"
  ]
}
```

Because installing chaincode in Fabric is a privileged operation, the contract instantiation must be done by 
the admin user created in Step 5.

```
node startContract.js admin
```

# Testing functions of translated chain code

Update `functionCallRequest.json` file. update chaincodeName, functionName, msg.value and arguments. For the simplicity passing address as argument you can pass like object which contain name of user and set address as type like `{ "value": "account2" , "type": "address"}`.

For EIP20 testing 'transfer' function name, update the `functionCallRequest.json` 

```
{
	"chaincodeName": "EIP20",
	"functionName": "transfer",
	"msg.value" : "0",
	"args": [ { "value": "account2" , "type": "address"} , "20"]
}
```
To update the value in blockchain from account1 run
```
node invoke.js account1

```

To get the value from blockchain from account1 run
```
node query.js account1

```

