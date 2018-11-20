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


class ERC223Interface {async totalSupply(stub, args, thisClass) { 
let returnTemp = await stub.getState('totalSupply');
      return Buffer.from(returnTemp.toString());
     
      }
      
 } 
class SafeMath {static async mul(a,b) {

  let c=a*b;
        
  if(!(a==0||c/a==b)){
throw new Error( "Condition Failed" );
};
  
 let returnTemp = c;

  
  
 return returnTemp;
 
  
  
}
static async div(a,b) {

  let c=a/b;
        
  
 let returnTemp = c;

  
  
 return returnTemp;
 
  
  
}
static async sub(a,b) {

  if(!(b<=a)){
throw new Error( "Condition Failed" );
};
  
 let returnTemp = a-b;

  
  
 return returnTemp;
 
  
  
}
static async add(a,b) {

  let c=a+b;
        
  if(!(c>=a)){
throw new Error( "Condition Failed" );
};
  
 let returnTemp = c;

  
  
 return returnTemp;
 
  
  
}
static async max64(a,b) {

  
 let returnTemp = a>=b?a : b;

  
  
 return returnTemp;
 
  
  
}
static async min64(a,b) {

  
 let returnTemp = a<b?a : b;

  
  
 return returnTemp;
 
  
  
}
static async max256(a,b) {

  
 let returnTemp = a>=b?a : b;

  
  
 return returnTemp;
 
  
  
}
static async min256(a,b) {

  
 let returnTemp = a<b?a : b;

  
  
 return returnTemp;
 
  
  
}
static async assert(assertion) {

  
 if(!assertion)
{
throw 'Error';
  
}

  
  
}

 } 
class ERC223ReceivingContract {
 } 
class ERC223Token extends ERC223Interface {
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

  
let balances = {};
      await stub.putState('balances', Buffer.from(JSON.stringify(balances)));
 let totalSupply = 0;
    await stub.putState('totalSupply', Buffer.from(totalSupply.toString()));

if (args.length != 2 ){
            throw new Error('Incorrect number of arguments. Expecting 2');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let _initialAmount = parseFloat(args[1]);

  
let method0 = thisClass['Mappingbalances'];
await method0 (balances,msg.sender);
balances[msg.sender]=_initialAmount;
  totalSupply=_initialAmount;
  
  let tempJSON1 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON1));
await stub.putState('totalSupply', Buffer.from(totalSupply.toString()));

 } 
async transfer(stub, args, thisClass) { 
 let method;
if (args.length == 4 ){
  method = thisClass['transfer_3']; 
return await method(stub, args, thisClass);
}if (args.length == 3 ){
  method = thisClass['transfer_2']; 
return await method(stub, args, thisClass);
}}
async transfer_3(stub, args, thisClass) {
if (args.length != 4 ){
            throw new Error('Incorrect number of arguments. Expecting 4');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let _to = args[1];

let _value = parseFloat(args[2]);

let _data = args[3];
let tempMapping0 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping0);
let temp1 = await stub.getState('totalSupply');
      let totalSupply = parseFloat(temp1);

  let codeLength;
        
  
let method2 = thisClass['Mappingbalances'];
await method2 (balances,msg.sender);
balances[msg.sender]=await SafeMath.sub(balances[msg.sender],_value);
  
let method3 = thisClass['Mappingbalances'];
await method3 (balances,_to);
balances[_to]=await SafeMath.add(balances[_to],_value);
  let receiver='';
        
   let arguments123 = ['tokenFallback',msg.value.toString(),msg.sender.toString(),_value.toString(),_data.toString()]
        await stub.invokeChaincode(_to, arguments123);;
  let payload4 = {
from: msg.sender,
to: _to,
value: _value,
data: _data
}
payload4  = JSON.stringify(payload4 );
 stub.setEvent('Transfer', payload4 );
  
  let tempJSON5 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON5));

}
async transfer_2(stub, args, thisClass) {
if (args.length != 3 ){
            throw new Error('Incorrect number of arguments. Expecting 3');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let _to = args[1];

let _value = parseFloat(args[2]);
let tempMapping0 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping0);
let temp1 = await stub.getState('totalSupply');
      let totalSupply = parseFloat(temp1);

  let codeLength;
        
  let empty;
        
  empty='0x0000000';
  
let method2 = thisClass['Mappingbalances'];
await method2 (balances,msg.sender);
balances[msg.sender]=await SafeMath.sub(balances[msg.sender],_value);
  
let method3 = thisClass['Mappingbalances'];
await method3 (balances,_to);
balances[_to]=await SafeMath.add(balances[_to],_value);
  let receiver='';
        
   let arguments123 = ['tokenFallback',msg.value.toString(),msg.sender.toString(),_value.toString(),empty.toString()]
        await stub.invokeChaincode(_to, arguments123);;
  let payload4 = {
from: msg.sender,
to: _to,
value: _value,
data: empty
}
payload4  = JSON.stringify(payload4 );
 stub.setEvent('Transfer', payload4 );
  
  let tempJSON5 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON5));

}
async balanceOf(stub, args, thisClass) {
if (args.length != 2 ){
            throw new Error('Incorrect number of arguments. Expecting 2');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let _owner = args[1];
let balance = 0;
let tempMapping0 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping0);
let temp1 = await stub.getState('totalSupply');
      let totalSupply = parseFloat(temp1);

  
let method2 = thisClass['Mappingbalances'];
await method2 (balances,_owner);

 let returnTemp = balances[_owner];

  
  
 return Buffer.from(returnTemp.toString());
 
  
  return Buffer.from(balance.toString());

}
async Mappingbalances(balances,arg1){
if(balances[arg1] == undefined)
{balances[arg1] =0;
}
}

 } 

 shim.start(new ERC223Token());