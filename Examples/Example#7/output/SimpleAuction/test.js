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


class SimpleAuction {async beneficiary(stub, args, thisClass) { 
let returnTemp = await stub.getState('beneficiary');
      return Buffer.from(returnTemp.toString());
     
      }
      async auctionEnd(stub, args, thisClass) { 
let returnTemp = await stub.getState('auctionEnd');
      return Buffer.from(returnTemp.toString());
     
      }
      async highestBidder(stub, args, thisClass) { 
let returnTemp = await stub.getState('highestBidder');
      return Buffer.from(returnTemp.toString());
     
      }
      async highestBid(stub, args, thisClass) { 
let returnTemp = await stub.getState('highestBid');
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

  
 let beneficiary = '';
    await stub.putState('beneficiary', Buffer.from(beneficiary.toString()));
 let auctionEnd = 0;
    await stub.putState('auctionEnd', Buffer.from(auctionEnd.toString()));
 let highestBidder = '';
    await stub.putState('highestBidder', Buffer.from(highestBidder.toString()));
 let highestBid = 0;
    await stub.putState('highestBid', Buffer.from(highestBid.toString()));
let pendingReturns = {};
      await stub.putState('pendingReturns', Buffer.from(JSON.stringify(pendingReturns)));
 let ended = false;
    await stub.putState('ended', Buffer.from(ended.toString()));

if (args.length != 3 ){
            throw new Error('Incorrect number of arguments. Expecting 3');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let _biddingTime = parseFloat(args[1]);

let _beneficiary = args[2];

  beneficiary=_beneficiary;
  auctionEnd=now+_biddingTime;
  
  await stub.putState('beneficiary', Buffer.from(beneficiary.toString()));
await stub.putState('auctionEnd', Buffer.from(auctionEnd.toString()));

 } 
async bid(stub, args, thisClass) {
if (args.length != 1 ){
            throw new Error('Incorrect number of arguments. Expecting 1');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address
let temp0 = await stub.getState('beneficiary');
      let beneficiary = temp0.toString();
let temp1 = await stub.getState('auctionEnd');
      let auctionEnd = parseFloat(temp1);
let temp2 = await stub.getState('highestBidder');
      let highestBidder = temp2.toString();
let temp3 = await stub.getState('highestBid');
      let highestBid = parseFloat(temp3);
let tempMapping4 = await stub.getState('pendingReturns');
      let pendingReturns = JSON.parse(tempMapping4);
let temp5 = await stub.getState('ended');
      let ended = JSON.parse(temp5);

  if(!(now<=auctionEnd)){
throw new Error("Auction already ended.");
};
  if(!(msg.value>highestBid)){
throw new Error("There already is a higher bid.");
};
  
 if(highestBid!=0)
{

  
let method6 = thisClass['MappingpendingReturns'];
await method6 (pendingReturns,highestBidder);
pendingReturns[highestBidder]+=highestBid;
  
}

  highestBidder=msg.sender;
  highestBid=msg.value;
  let payload7 = {
bidder: msg.sender,
amount: msg.value
}
payload7  = JSON.stringify(payload7 );
 stub.setEvent('HighestBidIncreased', payload7 );
  
  let tempJSON8 = JSON.stringify(pendingReturns);
    await stub.putState('pendingReturns', Buffer.from(tempJSON8));
await stub.putState('highestBidder', Buffer.from(highestBidder.toString()));
await stub.putState('highestBid', Buffer.from(highestBid.toString()));

}
async withdraw(stub, args, thisClass) {
if (args.length != 1 ){
            throw new Error('Incorrect number of arguments. Expecting 1');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address
let temp0 = await stub.getState('beneficiary');
      let beneficiary = temp0.toString();
let temp1 = await stub.getState('auctionEnd');
      let auctionEnd = parseFloat(temp1);
let temp2 = await stub.getState('highestBidder');
      let highestBidder = temp2.toString();
let temp3 = await stub.getState('highestBid');
      let highestBid = parseFloat(temp3);
let tempMapping4 = await stub.getState('pendingReturns');
      let pendingReturns = JSON.parse(tempMapping4);
let temp5 = await stub.getState('ended');
      let ended = JSON.parse(temp5);

  
let method6 = thisClass['MappingpendingReturns'];
await method6 (pendingReturns,msg.sender);
let amount=pendingReturns[msg.sender];
        
  
 if(amount>0)
{

  
let method7 = thisClass['MappingpendingReturns'];
await method7 (pendingReturns,msg.sender);
pendingReturns[msg.sender]=0;
let result8 = await  ConstantClass.send(stub , msg ,msg.sender,amount);
  
 if(!JSON.parse(result8))
{

  
let method9 = thisClass['MappingpendingReturns'];
await method9 (pendingReturns,msg.sender);
pendingReturns[msg.sender]=amount;
  
 let returnTemp = false;

  
  let tempJSON10 = JSON.stringify(pendingReturns);
    await stub.putState('pendingReturns', Buffer.from(tempJSON10));

 return Buffer.from(returnTemp.toString());
 
  
}

  
}

  
 let returnTemp = true;

  
  let tempJSON11 = JSON.stringify(pendingReturns);
    await stub.putState('pendingReturns', Buffer.from(tempJSON11));

 return Buffer.from(returnTemp.toString());
 
  
  let tempJSON12 = JSON.stringify(pendingReturns);
    await stub.putState('pendingReturns', Buffer.from(tempJSON12));

}
async auctionEnd(stub, args, thisClass) {
if (args.length != 1 ){
            throw new Error('Incorrect number of arguments. Expecting 1');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address
let temp0 = await stub.getState('beneficiary');
      let beneficiary = temp0.toString();
let temp1 = await stub.getState('auctionEnd');
      let auctionEnd = parseFloat(temp1);
let temp2 = await stub.getState('highestBidder');
      let highestBidder = temp2.toString();
let temp3 = await stub.getState('highestBid');
      let highestBid = parseFloat(temp3);
let tempMapping4 = await stub.getState('pendingReturns');
      let pendingReturns = JSON.parse(tempMapping4);
let temp5 = await stub.getState('ended');
      let ended = JSON.parse(temp5);

  if(!(now>=auctionEnd)){
throw new Error("Auction not yet ended.");
};
  if(!(!ended)){
throw new Error("auctionEnd has already been called.");
};
  ended=true;
  let payload6 = {
winner: highestBidder,
amount: highestBid
}
payload6  = JSON.stringify(payload6 );
 stub.setEvent('AuctionEnded', payload6 );
let result7 = await  ConstantClass.transfer(stub , msg ,beneficiary,highestBid);
  ;
  
  await stub.putState('ended', Buffer.from(ended.toString()));

}
async MappingpendingReturns(pendingReturns,arg1){
if(pendingReturns[arg1] == undefined)
{pendingReturns[arg1] =0;
}
}

 } 

 shim.start(new SimpleAuction());