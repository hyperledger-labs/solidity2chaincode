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


class EIP20Interface {async totalSupply(stub, args, thisClass) { 
let returnTemp = await stub.getState('totalSupply');
      return Buffer.from(returnTemp.toString());
     
      }
      
 } 
class EIP20 extends EIP20Interface {async balances(stub, args, thisClass) { 
 if (args.length != 2){
              
        throw new Error('Incorrect number of arguments. Expecting 2 ');
      }
let arg1 = args[1];
let temp = await stub.getState('balances');
      let balances = JSON.parse(temp); 
let method = thisClass['Mappingbalances'];
await method(balances,arg1);
return Buffer.from(balances[arg1].toString());
      }
      async allowed(stub, args, thisClass) { 
 if (args.length != 3){
              
        throw new Error('Incorrect number of arguments. Expecting 3 ');
      }
let arg1 = args[1];

let arg2 = args[2];
let temp = await stub.getState('allowed');
      let allowed = JSON.parse(temp); 
let method = thisClass['Mappingallowed'];
await method(allowed,arg1,arg2);
return Buffer.from(allowed[arg1][arg2].toString());
      }
      async name(stub, args, thisClass) { 
let returnTemp = await stub.getState('name');
      return Buffer.from(returnTemp.toString());
     
      }
      async decimals(stub, args, thisClass) { 
let returnTemp = await stub.getState('decimals');
      return Buffer.from(returnTemp.toString());
     
      }
      async symbol(stub, args, thisClass) { 
let returnTemp = await stub.getState('symbol');
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

  
 let MAX_UINT256 = 2**256-1;
    await stub.putState('MAX_UINT256', Buffer.from(MAX_UINT256.toString()));
let balances = {};
      await stub.putState('balances', Buffer.from(JSON.stringify(balances)));
let allowed = {};
      await stub.putState('allowed', Buffer.from(JSON.stringify(allowed)));
 let name = '';
    await stub.putState('name', Buffer.from(name.toString()));
 let decimals = 0;
    await stub.putState('decimals', Buffer.from(decimals.toString()));
 let symbol = '';
    await stub.putState('symbol', Buffer.from(symbol.toString()));
 let totalSupply = 0;
    await stub.putState('totalSupply', Buffer.from(totalSupply.toString()));

if (args.length != 5 ){
            throw new Error('Incorrect number of arguments. Expecting 5');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let _initialAmount = parseFloat(args[1]);

let _tokenName = args[2];

let _decimalUnits = parseFloat(args[3]);

let _tokenSymbol = args[4];

  
let method0 = thisClass['Mappingbalances'];
await method0 (balances,msg.sender);
balances[msg.sender]=_initialAmount;
  totalSupply=_initialAmount;
  name=_tokenName;
  decimals=_decimalUnits;
  symbol=_tokenSymbol;
  
  let tempJSON1 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON1));
await stub.putState('totalSupply', Buffer.from(totalSupply.toString()));
await stub.putState('name', Buffer.from(name.toString()));
await stub.putState('decimals', Buffer.from(decimals.toString()));
await stub.putState('symbol', Buffer.from(symbol.toString()));

 } 
async transfer(stub, args, thisClass) {
if (args.length != 3 ){
            throw new Error('Incorrect number of arguments. Expecting 3');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let _to = args[1];

let _value = parseFloat(args[2]);
let success = false;
let temp0 = await stub.getState('MAX_UINT256');
      let MAX_UINT256 = parseFloat(temp0);
let tempMapping1 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping1);
let tempMapping2 = await stub.getState('allowed');
      let allowed = JSON.parse(tempMapping2);
let temp3 = await stub.getState('name');
      let name = temp3.toString();
let temp4 = await stub.getState('decimals');
      let decimals = parseFloat(temp4);
let temp5 = await stub.getState('symbol');
      let symbol = temp5.toString();
let temp6 = await stub.getState('totalSupply');
      let totalSupply = parseFloat(temp6);

  
let method7 = thisClass['Mappingbalances'];
await method7 (balances,msg.sender);
if(!(balances[msg.sender]>=_value)){
throw new Error( "Condition Failed" );
};
  
let method8 = thisClass['Mappingbalances'];
await method8 (balances,msg.sender);
balances[msg.sender]-=_value;
  
let method9 = thisClass['Mappingbalances'];
await method9 (balances,_to);
balances[_to]+=_value;
  let payload10 = {
_from: msg.sender,
_to: _to,
_value: _value
}
payload10  = JSON.stringify(payload10 );
 stub.setEvent('Transfer', payload10 );
  
 let returnTemp = true;

  
  let tempJSON11 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON11));

 return Buffer.from(returnTemp.toString());
 
  
  let tempJSON12 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON12));
return Buffer.from(success.toString());

}
async transferFrom(stub, args, thisClass) {
if (args.length != 4 ){
            throw new Error('Incorrect number of arguments. Expecting 4');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let _from = args[1];

let _to = args[2];

let _value = parseFloat(args[3]);
let success = false;
let temp0 = await stub.getState('MAX_UINT256');
      let MAX_UINT256 = parseFloat(temp0);
let tempMapping1 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping1);
let tempMapping2 = await stub.getState('allowed');
      let allowed = JSON.parse(tempMapping2);
let temp3 = await stub.getState('name');
      let name = temp3.toString();
let temp4 = await stub.getState('decimals');
      let decimals = parseFloat(temp4);
let temp5 = await stub.getState('symbol');
      let symbol = temp5.toString();
let temp6 = await stub.getState('totalSupply');
      let totalSupply = parseFloat(temp6);

  
let method7 = thisClass['Mappingallowed'];
await method7 (allowed,_from,msg.sender);
let allowance=allowed[_from][msg.sender];
        
  
let method8 = thisClass['Mappingbalances'];
await method8 (balances,_from);
if(!(balances[_from]>=_value&&allowance>=_value)){
throw new Error( "Condition Failed" );
};
  
let method9 = thisClass['Mappingbalances'];
await method9 (balances,_to);
balances[_to]+=_value;
  
let method10 = thisClass['Mappingbalances'];
await method10 (balances,_from);
balances[_from]-=_value;
  
 if(allowance<MAX_UINT256)
{

  
let method11 = thisClass['Mappingallowed'];
await method11 (allowed,_from,msg.sender);
allowed[_from][msg.sender]-=_value;
  
}

  let payload12 = {
_from: _from,
_to: _to,
_value: _value
}
payload12  = JSON.stringify(payload12 );
 stub.setEvent('Transfer', payload12 );
  
 let returnTemp = true;

  
  let tempJSON13 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON13));
let tempJSON14 = JSON.stringify(allowed);
    await stub.putState('allowed', Buffer.from(tempJSON14));

 return Buffer.from(returnTemp.toString());
 
  
  let tempJSON15 = JSON.stringify(balances);
    await stub.putState('balances', Buffer.from(tempJSON15));
let tempJSON16 = JSON.stringify(allowed);
    await stub.putState('allowed', Buffer.from(tempJSON16));
return Buffer.from(success.toString());

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
let temp0 = await stub.getState('MAX_UINT256');
      let MAX_UINT256 = parseFloat(temp0);
let tempMapping1 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping1);
let tempMapping2 = await stub.getState('allowed');
      let allowed = JSON.parse(tempMapping2);
let temp3 = await stub.getState('name');
      let name = temp3.toString();
let temp4 = await stub.getState('decimals');
      let decimals = parseFloat(temp4);
let temp5 = await stub.getState('symbol');
      let symbol = temp5.toString();
let temp6 = await stub.getState('totalSupply');
      let totalSupply = parseFloat(temp6);

  
let method7 = thisClass['Mappingbalances'];
await method7 (balances,_owner);

 let returnTemp = balances[_owner];

  
  
 return Buffer.from(returnTemp.toString());
 
  
  return Buffer.from(balance.toString());

}
async approve(stub, args, thisClass) {
if (args.length != 3 ){
            throw new Error('Incorrect number of arguments. Expecting 3');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let _spender = args[1];

let _value = parseFloat(args[2]);
let success = false;
let temp0 = await stub.getState('MAX_UINT256');
      let MAX_UINT256 = parseFloat(temp0);
let tempMapping1 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping1);
let tempMapping2 = await stub.getState('allowed');
      let allowed = JSON.parse(tempMapping2);
let temp3 = await stub.getState('name');
      let name = temp3.toString();
let temp4 = await stub.getState('decimals');
      let decimals = parseFloat(temp4);
let temp5 = await stub.getState('symbol');
      let symbol = temp5.toString();
let temp6 = await stub.getState('totalSupply');
      let totalSupply = parseFloat(temp6);

  
let method7 = thisClass['Mappingallowed'];
await method7 (allowed,msg.sender,_spender);
allowed[msg.sender][_spender]=_value;
  let payload8 = {
_owner: msg.sender,
_spender: _spender,
_value: _value
}
payload8  = JSON.stringify(payload8 );
 stub.setEvent('Approval', payload8 );
  
 let returnTemp = true;

  
  let tempJSON9 = JSON.stringify(allowed);
    await stub.putState('allowed', Buffer.from(tempJSON9));

 return Buffer.from(returnTemp.toString());
 
  
  let tempJSON10 = JSON.stringify(allowed);
    await stub.putState('allowed', Buffer.from(tempJSON10));
return Buffer.from(success.toString());

}
async allowance(stub, args, thisClass) {
if (args.length != 3 ){
            throw new Error('Incorrect number of arguments. Expecting 3');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let _owner = args[1];

let _spender = args[2];
let remaining = 0;
let temp0 = await stub.getState('MAX_UINT256');
      let MAX_UINT256 = parseFloat(temp0);
let tempMapping1 = await stub.getState('balances');
      let balances = JSON.parse(tempMapping1);
let tempMapping2 = await stub.getState('allowed');
      let allowed = JSON.parse(tempMapping2);
let temp3 = await stub.getState('name');
      let name = temp3.toString();
let temp4 = await stub.getState('decimals');
      let decimals = parseFloat(temp4);
let temp5 = await stub.getState('symbol');
      let symbol = temp5.toString();
let temp6 = await stub.getState('totalSupply');
      let totalSupply = parseFloat(temp6);

  
let method7 = thisClass['Mappingallowed'];
await method7 (allowed,_owner,_spender);

 let returnTemp = allowed[_owner][_spender];

  
  
 return Buffer.from(returnTemp.toString());
 
  
  return Buffer.from(remaining.toString());

}
async Mappingbalances(balances,arg1){
if(balances[arg1] == undefined)
{balances[arg1] =0;
}
}
async Mappingallowed(allowed,arg1,arg2){
if(allowed[arg1] == undefined)
{allowed[arg1] ={};
}
if(allowed[arg1][arg2] == undefined)
{allowed[arg1][arg2] =0;
}
}

 } 

 shim.start(new EIP20());