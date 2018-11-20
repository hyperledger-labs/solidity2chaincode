'use strict';
const shim = require('fabric-shim');
const util = require('util');
const createKeccakHash = require('keccak');
var sha256 = require('js-sha256').sha256;

class ConstantClass {

  static async AddContract(stub, contractName, balance) { //tested

    let args = ['addContract', contractName, balance];
    let response = await stub.invokeChaincode('balance', args);
    await stub.putState('This', Buffer.from(contractName)); //using This as this is a keyword in javascript storing contract address
    await stub.putState('IsContractAlive', Buffer.from('true'));
  }

  static async getSenderAddress(stub) { //tested
    let address = await stub.getCreator();
    let detail = address.id_bytes.buffer.toString('utf8');
    let index = detail.indexOf('-----BEGIN CERTIFICATE-----');
    let endIndex = detail.indexOf('-----END CERTIFICATE-----') + 25;
    let certificate = detail.slice(index, endIndex);
    certificate += '\n'
    return certificate;
  }

  static async getChainCodeName(stub) { //tested

    let chaincodeName = await stub.getState('chaincodeName');
    return chaincodeName;
    // let signedProposal = stub.getSignedProposal();
    // let detail = signedProposal.proposal.payload.input.buffer.toString('utf8');
    // let array = detail.split("\n");
    // let chaincodeDetail = array[24].split("\b")[1];
    // let chainCodeName = chaincodeDetail.split('\u001a')[0].replace(/[\u00A0\u1680​\u180e\u2000-\u2009\u200a​\u200b​\u202f\u205f​\u3000\u000b]/g, '').replace('\t', '');
    // return chainCodeName;

  }

  static async send(stub, msg, addressTo, amount) { // tested
    if (msg.value > amount) {
      let args = ['send', msg.sender, addressTo, amount.toString()];
      await stub.invokeChaincode('balance', args);
      msg.value = msg.value - amount;
      return true;
    }
    return false;
  }

  static async transfer(stub, msg, addressTo, amount) { // tested

    if (msg.value > amount) {
      let args = ['send', msg.sender, addressTo, amount.toString()];
      await stub.invokeChaincode('balance', args);
      msg.value = msg.value - amount;
    }
    else {
      throw new Error('Exception during Transfer');
    }
  }

  static async balance(stub, address) { // not tested yet

    let args = ['getBalance', address];
    let balance = await stub.invokeChaincode('balance', args);
    return parseFloat(balance);
  }

  static async selfdestruct(stub, _this, owner) { // not tested yet
    let args = ['getBalance', _this];
    let balance = await stub.invokeChaincode('balance', args);
    args = ['transfer', _this, owner, balance];
    await stub.invokeChaincode('balance', args);
    await stub.putState('IsContractAlive', Buffer.from('false'));
    args = ['removeContract', _this];
    await stub.invokeChaincode('balance', args);
  }

  static async getNowValue() {
    return Math.round(new Date().getTime() / 1000.0);  //Not final we can use stub.GetTxTimestamp()
  }

  static async keccak256(value, fake, secret) {
    return createKeccakHash('keccak256').update(value + fake + secret).digest('hex');
  }

  static async sha256(document) {
    return sha256(document);
  }

};


class Ownable {
  async owner(stub, args, thisClass) {
    let returnTemp = await stub.getState('owner');
    return Buffer.from(returnTemp.toString());

  }

  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();

    let method = this[ret.fcn];
    if (!method) {
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {

      let IsContractAlive = await stub.getState('IsContractAlive');
      if (IsContractAlive == 'false') {
        throw new Error('Contract has been destroyed');
      }
      let payload = await method(stub, ret.params, this);
      return shim.success(payload);
    } catch (err) {
      return shim.error(err);
    }
  }



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

  async Init1(stub, args, thisClass) {

    let isDeployed = await stub.getState('deployed');
    if (!isDeployed || !isDeployed.toString()) { // check already deployed
      await stub.putState('deployed', Buffer.from('true'));
      let chaincodeName = await ConstantClass.getChainCodeName(stub);
      await ConstantClass.AddContract(stub, chaincodeName, '0');
      let method = thisClass['Constructor'];
      await method(stub, args, thisClass);
    }
  }
  async Constructor(stub, args, thisClass) {


    let owner = '';
    await stub.putState('owner', Buffer.from(owner.toString()));

    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let now = await ConstantClass.getNowValue();
    let block = { timestamp: now }; //block.timestamp is alias for now 
    let msg = { value: parseFloat(args[0]), sender: await ConstantClass.getSenderAddress(stub) };
    let _this = await stub.getState('This');  // contract address

    owner = msg.sender;

    await stub.putState('owner', Buffer.from(owner.toString()));

  }
  async renounceOwnership(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let now = await ConstantClass.getNowValue();
    let block = { timestamp: now }; //block.timestamp is alias for now 
    let msg = { value: parseFloat(args[0]), sender: await ConstantClass.getSenderAddress(stub) };
    let _this = await stub.getState('This');  // contract address
    let temp0 = await stub.getState('owner');
    let owner = temp0.toString();

    if (!(msg.sender == owner)) {
      throw new Error("Condition Failed");
    };

    let payload1 = {
      previousOwner: owner
    }
    payload1 = JSON.stringify(payload1);
    stub.setEvent('OwnershipRenounced', payload1);
    owner = '';


    await stub.putState('owner', Buffer.from(owner.toString()));

  }
  async transferOwnership(stub, args, thisClass) {
    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let now = await ConstantClass.getNowValue();
    let block = { timestamp: now }; //block.timestamp is alias for now 
    let msg = { value: parseFloat(args[0]), sender: await ConstantClass.getSenderAddress(stub) };
    let _this = await stub.getState('This');  // contract address

    let _newOwner = args[1];
    let temp0 = await stub.getState('owner');
    let owner = temp0.toString();

    if (!(msg.sender == owner)) {
      throw new Error("Condition Failed");
    };

    let method1 = thisClass['_transferOwnership'];
    let result1 = await method1(stub, _newOwner);
    ;



  }
  async _transferOwnership(stub, _newOwner) {
    let temp0 = await stub.getState('owner');
    let owner = temp0.toString();

    if (!(_newOwner != '')) {
      throw new Error("Condition Failed");
    };
    let payload1 = {
      previousOwner: owner,
      newOwner: _newOwner
    }
    payload1 = JSON.stringify(payload1);
    stub.setEvent('OwnershipTransferred', payload1);
    owner = _newOwner;

    await stub.putState('owner', Buffer.from(owner.toString()));

  }

}
class Heritable extends Ownable {
  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();

    let method = this[ret.fcn];
    if (!method) {
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {

      let IsContractAlive = await stub.getState('IsContractAlive');
      if (IsContractAlive == 'false') {
        throw new Error('Contract has been destroyed');
      }
      let payload = await method(stub, ret.params, this);
      return shim.success(payload);
    } catch (err) {
      return shim.error(err);
    }
  }



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

  async Init1(stub, args, thisClass) {

    let isDeployed = await stub.getState('deployed');
    if (!isDeployed || !isDeployed.toString()) { // check already deployed
      await stub.putState('deployed', Buffer.from('true'));
      let chaincodeName = await ConstantClass.getChainCodeName(stub);
      await ConstantClass.AddContract(stub, chaincodeName, '0');
      let method = thisClass['Constructor'];
      await method(stub, args, thisClass);
    }
  }
  async Constructor(stub, args, thisClass) {


    let heir_ = '';
    await stub.putState('heir_', Buffer.from(heir_.toString()));
    let heartbeatTimeout_ = 0;
    await stub.putState('heartbeatTimeout_', Buffer.from(heartbeatTimeout_.toString()));
    let timeOfDeath_ = 0;
    await stub.putState('timeOfDeath_', Buffer.from(timeOfDeath_.toString()));
    let owner = '';
    await stub.putState('owner', Buffer.from(owner.toString()));

    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let now = await ConstantClass.getNowValue();
    let block = { timestamp: now }; //block.timestamp is alias for now 
    let msg = { value: parseFloat(args[0]), sender: await ConstantClass.getSenderAddress(stub) };
    let _this = await stub.getState('This');  // contract address

    let _heartbeatTimeout = parseFloat(args[1]);
    super.Constructor(stub, [msg.value], thisClass);
    heartbeatTimeout_ = _heartbeatTimeout;

    await stub.putState('heartbeatTimeout_', Buffer.from(heartbeatTimeout_.toString()));

  }
  async setHeir(stub, args, thisClass) {
    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let now = await ConstantClass.getNowValue();
    let block = { timestamp: now }; //block.timestamp is alias for now 
    let msg = { value: parseFloat(args[0]), sender: await ConstantClass.getSenderAddress(stub) };
    let _this = await stub.getState('This');  // contract address

    let _newHeir = args[1];
    let temp0 = await stub.getState('heir_');
    let heir_ = temp0.toString();
    let temp1 = await stub.getState('heartbeatTimeout_');
    let heartbeatTimeout_ = parseFloat(temp1);
    let temp2 = await stub.getState('timeOfDeath_');
    let timeOfDeath_ = parseFloat(temp2);
    let temp3 = await stub.getState('owner');
    let owner = temp3.toString();

    if (!(msg.sender == owner)) {
      throw new Error("Condition Failed");
    };

    if (!(_newHeir != owner)) {
      throw new Error("Condition Failed");
    };
    let method4 = thisClass['heartbeat'];
    let result4 = await method4(stub, [msg.value], thisClass);
    ;
    let payload5 = {
      owner: owner,
      newHeir: _newHeir
    }
    payload5 = JSON.stringify(payload5);
    stub.setEvent('HeirChanged', payload5);
    heir_ = _newHeir;


    await stub.putState('heir_', Buffer.from(heir_.toString()));

  }
  async heir(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let now = await ConstantClass.getNowValue();
    let block = { timestamp: now }; //block.timestamp is alias for now 
    let msg = { value: parseFloat(args[0]), sender: await ConstantClass.getSenderAddress(stub) };
    let _this = await stub.getState('This');  // contract address
    let temp0 = await stub.getState('heir_');
    let heir_ = temp0.toString();
    let temp1 = await stub.getState('heartbeatTimeout_');
    let heartbeatTimeout_ = parseFloat(temp1);
    let temp2 = await stub.getState('timeOfDeath_');
    let timeOfDeath_ = parseFloat(temp2);
    let temp3 = await stub.getState('owner');
    let owner = temp3.toString();


    let returnTemp = heir_;



    return Buffer.from(returnTemp.toString());



  }
  async heartbeatTimeout(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let now = await ConstantClass.getNowValue();
    let block = { timestamp: now }; //block.timestamp is alias for now 
    let msg = { value: parseFloat(args[0]), sender: await ConstantClass.getSenderAddress(stub) };
    let _this = await stub.getState('This');  // contract address
    let temp0 = await stub.getState('heir_');
    let heir_ = temp0.toString();
    let temp1 = await stub.getState('heartbeatTimeout_');
    let heartbeatTimeout_ = parseFloat(temp1);
    let temp2 = await stub.getState('timeOfDeath_');
    let timeOfDeath_ = parseFloat(temp2);
    let temp3 = await stub.getState('owner');
    let owner = temp3.toString();


    let returnTemp = heartbeatTimeout_;



    return Buffer.from(returnTemp.toString());



  }
  async timeOfDeath(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let now = await ConstantClass.getNowValue();
    let block = { timestamp: now }; //block.timestamp is alias for now 
    let msg = { value: parseFloat(args[0]), sender: await ConstantClass.getSenderAddress(stub) };
    let _this = await stub.getState('This');  // contract address
    let temp0 = await stub.getState('heir_');
    let heir_ = temp0.toString();
    let temp1 = await stub.getState('heartbeatTimeout_');
    let heartbeatTimeout_ = parseFloat(temp1);
    let temp2 = await stub.getState('timeOfDeath_');
    let timeOfDeath_ = parseFloat(temp2);
    let temp3 = await stub.getState('owner');
    let owner = temp3.toString();


    let returnTemp = timeOfDeath_;



    return Buffer.from(returnTemp.toString());



  }
  async removeHeir(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let now = await ConstantClass.getNowValue();
    let block = { timestamp: now }; //block.timestamp is alias for now 
    let msg = { value: parseFloat(args[0]), sender: await ConstantClass.getSenderAddress(stub) };
    let _this = await stub.getState('This');  // contract address
    let temp0 = await stub.getState('heir_');
    let heir_ = temp0.toString();
    let temp1 = await stub.getState('heartbeatTimeout_');
    let heartbeatTimeout_ = parseFloat(temp1);
    let temp2 = await stub.getState('timeOfDeath_');
    let timeOfDeath_ = parseFloat(temp2);
    let temp3 = await stub.getState('owner');
    let owner = temp3.toString();

    if (!(msg.sender == owner)) {
      throw new Error("Condition Failed");
    };

    let method4 = thisClass['heartbeat'];
    let result4 = await method4(stub, [msg.value], thisClass);
    ;
    heir_ = '';


    await stub.putState('heir_', Buffer.from(heir_.toString()));

  }
  async proclaimDeath(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let now = await ConstantClass.getNowValue();
    let block = { timestamp: now }; //block.timestamp is alias for now 
    let msg = { value: parseFloat(args[0]), sender: await ConstantClass.getSenderAddress(stub) };
    let _this = await stub.getState('This');  // contract address
    let temp0 = await stub.getState('heir_');
    let heir_ = temp0.toString();
    let temp1 = await stub.getState('heartbeatTimeout_');
    let heartbeatTimeout_ = parseFloat(temp1);
    let temp2 = await stub.getState('timeOfDeath_');
    let timeOfDeath_ = parseFloat(temp2);
    let temp3 = await stub.getState('owner');
    let owner = temp3.toString();

    if (!(msg.sender == heir_)) {
      throw new Error("Condition Failed");
    };

    let method4 = thisClass['ownerLives'];
    let result4 = await method4(stub);
    if (!(JSON.parse(result4))) {
      throw new Error("Condition Failed");
    };
    let payload5 = {
      owner: owner,
      heir: heir_,
      timeOfDeath: timeOfDeath_
    }
    payload5 = JSON.stringify(payload5);
    stub.setEvent('OwnerProclaimedDead', payload5);
    timeOfDeath_ = block.timestamp;


    await stub.putState('timeOfDeath_', Buffer.from(timeOfDeath_.toString()));

  }
  async heartbeat(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let now = await ConstantClass.getNowValue();
    let block = { timestamp: now }; //block.timestamp is alias for now 
    let msg = { value: parseFloat(args[0]), sender: await ConstantClass.getSenderAddress(stub) };
    let _this = await stub.getState('This');  // contract address
    let temp0 = await stub.getState('heir_');
    let heir_ = temp0.toString();
    let temp1 = await stub.getState('heartbeatTimeout_');
    let heartbeatTimeout_ = parseFloat(temp1);
    let temp2 = await stub.getState('timeOfDeath_');
    let timeOfDeath_ = parseFloat(temp2);
    let temp3 = await stub.getState('owner');
    let owner = temp3.toString();

    if (!(msg.sender == owner)) {
      throw new Error("Condition Failed");
    };

    let payload4 = {
      owner: owner
    }
    payload4 = JSON.stringify(payload4);
    stub.setEvent('OwnerHeartbeated', payload4);
    timeOfDeath_ = 0;


    await stub.putState('timeOfDeath_', Buffer.from(timeOfDeath_.toString()));

  }
  async claimHeirOwnership(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting 1');
    }

    let now = await ConstantClass.getNowValue();
    let block = { timestamp: now }; //block.timestamp is alias for now 
    let msg = { value: parseFloat(args[0]), sender: await ConstantClass.getSenderAddress(stub) };
    let _this = await stub.getState('This');  // contract address
    let temp0 = await stub.getState('heir_');
    let heir_ = temp0.toString();
    let temp1 = await stub.getState('heartbeatTimeout_');
    let heartbeatTimeout_ = parseFloat(temp1);
    let temp2 = await stub.getState('timeOfDeath_');
    let timeOfDeath_ = parseFloat(temp2);
    let temp3 = await stub.getState('owner');
    let owner = temp3.toString();

    if (!(msg.sender == heir_)) {
      throw new Error("Condition Failed");
    };

    let method4 = thisClass['ownerLives'];
    let result4 = await method4(stub);
    if (!(!JSON.parse(result4))) {
      throw new Error("Condition Failed");
    };
    if (!(block.timestamp >= timeOfDeath_ + heartbeatTimeout_)) {
      throw new Error("Condition Failed");
    };
    let payload5 = {
      previousOwner: owner,
      newOwner: heir_
    }
    payload5 = JSON.stringify(payload5);
    stub.setEvent('OwnershipTransferred', payload5);
    let payload6 = {
      previousOwner: owner,
      newOwner: heir_
    }
    payload6 = JSON.stringify(payload6);
    stub.setEvent('HeirOwnershipClaimed', payload6);
    owner = heir_;
    timeOfDeath_ = 0;


    await stub.putState('owner', Buffer.from(owner.toString()));
    await stub.putState('timeOfDeath_', Buffer.from(timeOfDeath_.toString()));

  }
  async ownerLives(stub) {
    let temp0 = await stub.getState('heir_');
    let heir_ = temp0.toString();
    let temp1 = await stub.getState('heartbeatTimeout_');
    let heartbeatTimeout_ = parseFloat(temp1);
    let temp2 = await stub.getState('timeOfDeath_');
    let timeOfDeath_ = parseFloat(temp2);
    let temp3 = await stub.getState('owner');
    let owner = temp3.toString();


    let returnTemp = timeOfDeath_ == 0;



    return Buffer.from(returnTemp.toString());



  }

}
class SimpleSavingsWallet extends Heritable {
  async Invoke(stub) {
    let ret = stub.getFunctionAndParameters();

    let method = this[ret.fcn];
    if (!method) {
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {

      let IsContractAlive = await stub.getState('IsContractAlive');
      if (IsContractAlive == 'false') {
        throw new Error('Contract has been destroyed');
      }
      let payload = await method(stub, ret.params, this);
      return shim.success(payload);
    } catch (err) {
      return shim.error(err);
    }
  }



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

  async Init1(stub, args, thisClass) {

    let isDeployed = await stub.getState('deployed');
    if (!isDeployed || !isDeployed.toString()) { // check already deployed
      await stub.putState('deployed', Buffer.from('true'));
      let chaincodeName = await ConstantClass.getChainCodeName(stub);
      await ConstantClass.AddContract(stub, chaincodeName, '0');
      let method = thisClass['Constructor'];
      await method(stub, args, thisClass);
    }
  }
  async Constructor(stub, args, thisClass) {


    let heir_ = '';
    await stub.putState('heir_', Buffer.from(heir_.toString()));
    let heartbeatTimeout_ = 0;
    await stub.putState('heartbeatTimeout_', Buffer.from(heartbeatTimeout_.toString()));
    let timeOfDeath_ = 0;
    await stub.putState('timeOfDeath_', Buffer.from(timeOfDeath_.toString()));

    if (args.length != 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let now = await ConstantClass.getNowValue();
    let block = { timestamp: now }; //block.timestamp is alias for now 
    let msg = { value: parseFloat(args[0]), sender: await ConstantClass.getSenderAddress(stub) };
    let _this = await stub.getState('This');  // contract address

    let _heartbeatTimeout = parseFloat(args[1]);
    super.Constructor(stub, [msg.value, _heartbeatTimeout, thisClass]);


  }
  async(stub, args, thisClass) {
    let method;
    if (args.length == 2) {
      method = thisClass['_1'];
      return await method(stub, args, thisClass);
    } if (args.length == 1) {
      method = thisClass['_0'];
      return await method(stub, args, thisClass);
    }
  }
  async FallbackFunction(stub, args, thisClass) { //for the time being we are translating fall back function. But not using it yet. How we will use it, it is pending?
    let temp0 = await stub.getState('heir_');
    let heir_ = temp0.toString();
    let temp1 = await stub.getState('heartbeatTimeout_');
    let heartbeatTimeout_ = parseFloat(temp1);
    let temp2 = await stub.getState('timeOfDeath_');
    let timeOfDeath_ = parseFloat(temp2);

    let result4 = await ConstantClass.balance(stub, _this);
    let payload3 = {
      payer: msg.sender,
      amount: msg.value,
      balance: JSON.parse(result4)
    }
    payload3 = JSON.stringify(payload3);
    stub.setEvent('Received', payload3);


  }
  async sendTo(stub, args, thisClass) {
    if (args.length != 3) {
      throw new Error('Incorrect number of arguments. Expecting 3');
    }

    let now = await ConstantClass.getNowValue();
    let block = { timestamp: now }; //block.timestamp is alias for now 
    let msg = { value: parseFloat(args[0]), sender: await ConstantClass.getSenderAddress(stub) };
    let _this = await stub.getState('This');  // contract address

    let _payee = args[1];

    let _amount = parseFloat(args[2]);
    let temp0 = await stub.getState('heir_');
    let heir_ = temp0.toString();
    let temp1 = await stub.getState('heartbeatTimeout_');
    let heartbeatTimeout_ = parseFloat(temp1);
    let temp2 = await stub.getState('timeOfDeath_');
    let timeOfDeath_ = parseFloat(temp2);

    if (!(msg.sender == owner)) {
      throw new Error("Condition Failed");
    };

    if (!(_payee != '' && _payee != _this)) {
      throw new Error("Condition Failed");
    };
    if (!(_amount > 0)) {
      throw new Error("Condition Failed");
    };
    let result3 = await ConstantClass.transfer(stub, msg, _payee, _amount);
    ;
    let result5 = await ConstantClass.balance(stub, _this);
    let payload4 = {
      payee: _payee,
      amount: _amount,
      balance: JSON.parse(result5)
    }
    payload4 = JSON.stringify(payload4);
    stub.setEvent('Sent', payload4);



  }

}

shim.start(new SimpleSavingsWallet());