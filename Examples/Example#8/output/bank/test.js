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
    certificate+='\n'
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
    else
    {
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


class bank {
async Invoke(stub) {
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
}
  async Constructor(stub, args, thisClass) { 

  
 let owner = '';
    await stub.putState('owner', Buffer.from(owner.toString()));
 let fifth = 50000000000000000;
    await stub.putState('fifth', Buffer.from(fifth.toString()));
 let twenty = 200000000000000000;
    await stub.putState('twenty', Buffer.from(twenty.toString()));
 let fifty = 500000000000000000;
    await stub.putState('fifty', Buffer.from(fifty.toString()));
 let hundred = 1000000000000000000;
    await stub.putState('hundred', Buffer.from(hundred.toString()));
let balances = {};
      await stub.putState('balances', Buffer.from(JSON.stringify(balances)));

 } 
async mortal(stub, args, thisClass) {
if (args.length != 1 ){
            throw new Error('Incorrect number of arguments. Expecting 1');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address
let temp0 = await stub.getState('owner');
      let owner = temp0.toString();
let temp1 = await stub.getState('fifth');
      let fifth = parseFloat(temp1);
let temp2 = await stub.getState('twenty');
      let twenty = parseFloat(temp2);
let temp3 = await stub.getState('fifty');
      let fifty = parseFloat(temp3);
let temp4 = await stub.getState('hundred');
      let hundred = parseFloat(temp4);
let tempMapping5 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping5);

  owner=msg.sender;
  
  await stub.putState('owner', Buffer.from(owner.toString()));

}
async kill(stub, args, thisClass) {
if (args.length != 1 ){
            throw new Error('Incorrect number of arguments. Expecting 1');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address
let temp0 = await stub.getState('owner');
      let owner = temp0.toString();
let temp1 = await stub.getState('fifth');
      let fifth = parseFloat(temp1);
let temp2 = await stub.getState('twenty');
      let twenty = parseFloat(temp2);
let temp3 = await stub.getState('fifty');
      let fifty = parseFloat(temp3);
let temp4 = await stub.getState('hundred');
      let hundred = parseFloat(temp4);
let tempMapping5 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping5);

  
 if(msg.sender==owner)
{

let result6 = await  ConstantClass.selfdestruct(stub , _this, owner);
  JSON.parse(result6);
}

  
  
}
async cashOut(stub, args, thisClass) {
if (args.length != 1 ){
            throw new Error('Incorrect number of arguments. Expecting 1');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address
let temp0 = await stub.getState('owner');
      let owner = temp0.toString();
let temp1 = await stub.getState('fifth');
      let fifth = parseFloat(temp1);
let temp2 = await stub.getState('twenty');
      let twenty = parseFloat(temp2);
let temp3 = await stub.getState('fifty');
      let fifty = parseFloat(temp3);
let temp4 = await stub.getState('hundred');
      let hundred = parseFloat(temp4);
let tempMapping5 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping5);

let result6 = await  ConstantClass.balance(stub ,_this);
let result7 = await  ConstantClass.send(stub , msg ,owner,JSON.parse(result6)/2);
  JSON.parse(result7);
  
  
}
async deposit(stub, args, thisClass) {
if (args.length != 2 ){
            throw new Error('Incorrect number of arguments. Expecting 2');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let customer = args[1];
let temp0 = await stub.getState('owner');
      let owner = temp0.toString();
let temp1 = await stub.getState('fifth');
      let fifth = parseFloat(temp1);
let temp2 = await stub.getState('twenty');
      let twenty = parseFloat(temp2);
let temp3 = await stub.getState('fifty');
      let fifty = parseFloat(temp3);
let temp4 = await stub.getState('hundred');
      let hundred = parseFloat(temp4);
let tempMapping5 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping5);

  let value=msg.value;
        
  
let method6 = thisClass['Mappingbalances'];
await method6 (balances,customer);
balances[customer]+=value;
  
  let tempJSON7 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON7));

}
async getBalanceOf(stub, args, thisClass) {
if (args.length != 2 ){
            throw new Error('Incorrect number of arguments. Expecting 2');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let customer = args[1];
let temp0 = await stub.getState('owner');
      let owner = temp0.toString();
let temp1 = await stub.getState('fifth');
      let fifth = parseFloat(temp1);
let temp2 = await stub.getState('twenty');
      let twenty = parseFloat(temp2);
let temp3 = await stub.getState('fifty');
      let fifty = parseFloat(temp3);
let temp4 = await stub.getState('hundred');
      let hundred = parseFloat(temp4);
let tempMapping5 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping5);

  
let method6 = thisClass['Mappingbalances'];
await method6 (balances,customer);

 let returnTemp = balances[customer];

  
  
 return Buffer.from(returnTemp.toString());
 
  
  
}
async withdraw5(stub, args, thisClass) {
if (args.length != 2 ){
            throw new Error('Incorrect number of arguments. Expecting 2');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let customer = args[1];
let temp0 = await stub.getState('owner');
      let owner = temp0.toString();
let temp1 = await stub.getState('fifth');
      let fifth = parseFloat(temp1);
let temp2 = await stub.getState('twenty');
      let twenty = parseFloat(temp2);
let temp3 = await stub.getState('fifty');
      let fifty = parseFloat(temp3);
let temp4 = await stub.getState('hundred');
      let hundred = parseFloat(temp4);
let tempMapping5 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping5);

  
let method6 = thisClass['Mappingbalances'];
await method6 (balances,customer);

 if(balances[customer]>fifth)
{

let result7 = await  ConstantClass.send(stub , msg ,customer,fifth);
  JSON.parse(result7);
  
let method8 = thisClass['Mappingbalances'];
await method8 (balances,customer);
balances[customer]-=fifth;
  
}
else
{
  
  let tempJSON9 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON9));

return ; 

}

  
  let tempJSON10 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON10));

}
async withdraw20(stub, args, thisClass) {
if (args.length != 2 ){
            throw new Error('Incorrect number of arguments. Expecting 2');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let customer = args[1];
let temp0 = await stub.getState('owner');
      let owner = temp0.toString();
let temp1 = await stub.getState('fifth');
      let fifth = parseFloat(temp1);
let temp2 = await stub.getState('twenty');
      let twenty = parseFloat(temp2);
let temp3 = await stub.getState('fifty');
      let fifty = parseFloat(temp3);
let temp4 = await stub.getState('hundred');
      let hundred = parseFloat(temp4);
let tempMapping5 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping5);

  
let method6 = thisClass['Mappingbalances'];
await method6 (balances,customer);

 if(balances[customer]>twenty)
{

let result7 = await  ConstantClass.send(stub , msg ,customer,twenty);
  JSON.parse(result7);
  
let method8 = thisClass['Mappingbalances'];
await method8 (balances,customer);
balances[customer]-=twenty;
  
}
else
{
  
  let tempJSON9 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON9));

return ; 

}

  
  let tempJSON10 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON10));

}
async withdraw50(stub, args, thisClass) {
if (args.length != 2 ){
            throw new Error('Incorrect number of arguments. Expecting 2');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let customer = args[1];
let temp0 = await stub.getState('owner');
      let owner = temp0.toString();
let temp1 = await stub.getState('fifth');
      let fifth = parseFloat(temp1);
let temp2 = await stub.getState('twenty');
      let twenty = parseFloat(temp2);
let temp3 = await stub.getState('fifty');
      let fifty = parseFloat(temp3);
let temp4 = await stub.getState('hundred');
      let hundred = parseFloat(temp4);
let tempMapping5 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping5);

  
let method6 = thisClass['Mappingbalances'];
await method6 (balances,customer);

 if(balances[customer]>fifty)
{

let result7 = await  ConstantClass.send(stub , msg ,customer,fifty);
  JSON.parse(result7);
  
let method8 = thisClass['Mappingbalances'];
await method8 (balances,customer);
balances[customer]-=fifty;
  
}
else
{
  
  let tempJSON9 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON9));

return ; 

}

  
  let tempJSON10 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON10));

}
async withdraw100(stub, args, thisClass) {
if (args.length != 2 ){
            throw new Error('Incorrect number of arguments. Expecting 2');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let customer = args[1];
let temp0 = await stub.getState('owner');
      let owner = temp0.toString();
let temp1 = await stub.getState('fifth');
      let fifth = parseFloat(temp1);
let temp2 = await stub.getState('twenty');
      let twenty = parseFloat(temp2);
let temp3 = await stub.getState('fifty');
      let fifty = parseFloat(temp3);
let temp4 = await stub.getState('hundred');
      let hundred = parseFloat(temp4);
let tempMapping5 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping5);

  
let method6 = thisClass['Mappingbalances'];
await method6 (balances,customer);

 if(balances[customer]>hundred)
{

let result7 = await  ConstantClass.send(stub , msg ,customer,hundred);
  JSON.parse(result7);
  
let method8 = thisClass['Mappingbalances'];
await method8 (balances,customer);
balances[customer]-=hundred;
  
}
else
{
  
  let tempJSON9 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON9));

return ; 

}

  
  let tempJSON10 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON10));

}
async refund(stub, args, thisClass) {
if (args.length != 3 ){
            throw new Error('Incorrect number of arguments. Expecting 3');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let recipient = args[1];

let amount = parseFloat(args[2]);
let temp0 = await stub.getState('owner');
      let owner = temp0.toString();
let temp1 = await stub.getState('fifth');
      let fifth = parseFloat(temp1);
let temp2 = await stub.getState('twenty');
      let twenty = parseFloat(temp2);
let temp3 = await stub.getState('fifty');
      let fifty = parseFloat(temp3);
let temp4 = await stub.getState('hundred');
      let hundred = parseFloat(temp4);
let tempMapping5 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping5);

let result6 = await  ConstantClass.balance(stub ,_this);
  
 if(amount<JSON.parse(result6))
{

let result7 = await  ConstantClass.send(stub , msg ,recipient,amount);
  JSON.parse(result7);
  
 let returnTemp = 'refund processed';

  
  
 return Buffer.from(returnTemp.toString());
 
  
}
else
{
  
 let returnTemp = 'Refund amount too large';

  
  
 return Buffer.from(returnTemp.toString());
 
}

  
  
}
async Mappingbalances(balances,arg1){
if(balances[arg1] == undefined)
{balances[arg1] =0;
}
}

 } 

 shim.start(new bank());