
var fs = require('fs');


let header = ` 'use strict';
const shim = require('fabric-shim');
const util = require('util');
const createKeccakHash = require('keccak');
var sha256 = require('js-sha256').sha256;

`;

let invokeFunction = `async Invoke(stub) {
  let ret = stub.getFunctionAndParameters();

  let method = this[ret.fcn];
  if (!method) {
    throw new Error('Received unknown function ' + ret.fcn + ' invocation');
  }
  try {

    let IsContractAlive = await stub.getState('IsContractAlive');
    if(IsContractAlive == 'false')
    {
      throw new Error('Contract has been destroyed');
    }
    let payload = await method(stub, ret.params, this);
    return shim.success(payload);
  } catch (err) {
    return shim.error(err);
  }
}
`;


let initFunction = `

async Init(stub) {

  let ret = stub.getFunctionAndParameters();
  let args = ret.params;
  if (args.length != 1) {
    throw new Error('Incorrect number of arguments. Expecting 1, chaincode name is required at the time of instantiate');
  }
  let chaincodeName = args[0];
  await stub.putState('chaincodeName', Buffer.from(chaincodeName.toString()));
  return shim.success();
}

async Init1(stub ,args,thisClass) {

  let isDeployed = await stub.getState('deployed');
  if (!isDeployed || !isDeployed.toString()) { // check already deployed
        await stub.putState('deployed', Buffer.from('true'));
        let chaincodeName = await ConstantClass.getChainCodeName(stub);
        await ConstantClass.AddContract(stub, chaincodeName, '0');
        let method = thisClass['Constructor'];
        await method(stub, args, thisClass);
    }
}`

let balancepackageJsonFile = `{
	"name": "balance",
	"version": "1.0.0",
	"description": "balance chaincode implemented in node.js",
	"engines": {
		"node": ">=8.4.0",
		"npm": ">=5.3.0"
	},
	"scripts": { "start" : "node balance.js" },
	"engine-strict": true,
	"license": "Apache-2.0",
	"dependencies": {
		"fabric-shim": "~1.1.0"
	}
}`;

let testpackageJsonFile = `{
	"name": "test",
	"version": "1.0.0",
	"description": "balance chaincode implemented in node.js",
	"engines": {
		"node": ">=8.4.0",
		"npm": ">=5.3.0"
	},
	"scripts": { "start" : "node test.js" },
	"engine-strict": true,
	"license": "Apache-2.0",
	"dependencies": {
		"fabric-shim": "^1.1.3",
		"js-sha256": "^0.9.0",
		"keccak": "^1.4.0",
		"util": "^0.11.0"
	  }
}`;

let constantClass = '';
let balanceChaincode = '';

try {
  constantClass = fs.readFileSync('./ConstantCode/constantClass.js', 'utf8');
  balanceChaincode = fs.readFileSync('./ConstantCode/balance.js', 'utf8');
}
catch (error) {
  console.log(error);
}

exports.header = header;
exports.invokeFunction = invokeFunction;
exports.constantClass = constantClass;
exports.initFunction = initFunction;
exports.balanceChaincode = balanceChaincode;
exports.balancepackageJsonFile = balancepackageJsonFile;
exports.testpackageJsonFile = testpackageJsonFile;