'use strict';

var Fabric_Client = require('fabric-client');
var path = require('path');
var fs = require('fs');

let username = process.argv[2];

if(username == undefined)
{
    console.log("username is not passed");
    process.exit(1);
}

let input = fs.readFileSync('functionCallRequest.json', 'utf8');
let data  = JSON.parse(input);

let functionParmeters  = data['args'];
let functionArguments = [];
functionArguments.push(data['msg.value']);

for (let i = 0; i < functionParmeters.length; i++) {
	if (functionParmeters[i].type == 'address') {
		var store_path1 = path.join(__dirname, 'hfc-key-store');
		try {
			let userDetail = fs.readFileSync(store_path1 + '/' + functionParmeters[i].value, 'utf8');
			let certificate = JSON.parse(userDetail).enrollment.identity.certificate;
			functionArguments.push(certificate);
		} catch (error) {
			throw new Error('Failed to get ' + functionParmeters[i].value + ' certificate file ');
		}
	}
	else {
		functionArguments.push(functionParmeters[i]);
	}
}


var fabric_client = new Fabric_Client();
var channel = fabric_client.newChannel('mychannel');
var peer = fabric_client.newPeer('grpc://localhost:7051');
channel.addPeer(peer);

var store_path = path.join(__dirname, 'hfc-key-store');
console.log('Store path:'+store_path);

// create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
Fabric_Client.newDefaultKeyValueStore({ path: store_path
}).then((state_store) => {
	// assign the store to the fabric client
	fabric_client.setStateStore(state_store);
	var crypto_suite = Fabric_Client.newCryptoSuite();
	// use the same location for the state store (where the users' certificate are kept)
	// and the crypto store (where the users' keys are kept)
	var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	crypto_suite.setCryptoKeyStore(crypto_store);
	fabric_client.setCryptoSuite(crypto_suite);

	// get the enrolled user from persistence, this user will sign all requests
	return fabric_client.getUserContext(username, true);
}).then((user_from_store) => {
	if (user_from_store && user_from_store.isEnrolled()) {
		console.log('Successfully loaded '+username+' from persistence');
	//	member_user = user_from_store;
	} else {
		throw new Error('Failed to get '+username+'.... run registerUser.js');
	}

	const request = {
		chaincodeId: data['chaincodeName'],
		fcn: data['functionName'],
		args: functionArguments
	};

	// send the query proposal to the peer
	return channel.queryByChaincode(request);
}).then((query_responses) => {
	console.log("Query has completed, checking results");
	// query_responses could have more than one  results if there multiple peers were used as targets
	if (query_responses && query_responses.length == 1) {
		if (query_responses[0] instanceof Error) {
			console.error("error from query = ", query_responses[0]);
		} else {
			console.log("Response is ", query_responses[0].toString());
		}
	} else {
		console.log("No payloads were returned from query");
	}
}).catch((err) => {
	console.error('Failed to query successfully :: ' + err);
});
