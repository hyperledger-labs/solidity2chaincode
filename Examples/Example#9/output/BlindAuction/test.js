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


class BlindAuction {async beneficiary(stub, args, thisClass) { 
let returnTemp = await stub.getState('beneficiary');
      return Buffer.from(returnTemp.toString());
     
      }
      async biddingEnd(stub, args, thisClass) { 
let returnTemp = await stub.getState('biddingEnd');
      return Buffer.from(returnTemp.toString());
     
      }
      async revealEnd(stub, args, thisClass) { 
let returnTemp = await stub.getState('revealEnd');
      return Buffer.from(returnTemp.toString());
     
      }
      async ended(stub, args, thisClass) { 
let returnTemp = await stub.getState('ended');
      return Buffer.from(returnTemp.toString());
     
      }
      async bids(stub, args, thisClass) { 
 if (args.length != 3){
              
        throw new Error('Incorrect number of arguments. Expecting 3 ');
      }
let arg1 = args[1];

let arg2 = parseFloat(args[2]);
let temp = await stub.getState('bids');
      let bids = JSON.parse(temp); 
let method = thisClass['Mappingbids'];
await method(bids,arg1,arg2);
return Buffer.from(bids[arg1][arg2].toString());
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
 let biddingEnd = 0;
    await stub.putState('biddingEnd', Buffer.from(biddingEnd.toString()));
 let revealEnd = 0;
    await stub.putState('revealEnd', Buffer.from(revealEnd.toString()));
 let ended = false;
    await stub.putState('ended', Buffer.from(ended.toString()));
let bids = {};
      await stub.putState('bids', Buffer.from(JSON.stringify(bids)));
 let highestBidder = '';
    await stub.putState('highestBidder', Buffer.from(highestBidder.toString()));
 let highestBid = 0;
    await stub.putState('highestBid', Buffer.from(highestBid.toString()));
let pendingReturns = {};
      await stub.putState('pendingReturns', Buffer.from(JSON.stringify(pendingReturns)));

if (args.length != 4 ){
            throw new Error('Incorrect number of arguments. Expecting 4');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let _biddingTime = parseFloat(args[1]);

let _revealTime = parseFloat(args[2]);

let _beneficiary = args[3];

  beneficiary=_beneficiary;
  biddingEnd=now+_biddingTime;
  revealEnd=biddingEnd+_revealTime;
  
  await stub.putState('beneficiary', Buffer.from(beneficiary.toString()));
await stub.putState('biddingEnd', Buffer.from(biddingEnd.toString()));
await stub.putState('revealEnd', Buffer.from(revealEnd.toString()));

 } 
async bid(stub, args, thisClass) {
if (args.length != 2 ){
            throw new Error('Incorrect number of arguments. Expecting 2');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let _blindedBid = args[1];
let temp0 = await stub.getState('beneficiary');
      let beneficiary = temp0.toString();
let temp1 = await stub.getState('biddingEnd');
      let biddingEnd = parseFloat(temp1);
let temp2 = await stub.getState('revealEnd');
      let revealEnd = parseFloat(temp2);
let temp3 = await stub.getState('ended');
      let ended = JSON.parse(temp3);
let tempMapping4 = await stub.getState('bids');
      let bids = JSON.parse(tempMapping4);
let temp5 = await stub.getState('highestBidder');
      let highestBidder = temp5.toString();
let temp6 = await stub.getState('highestBid');
      let highestBid = parseFloat(temp6);
let tempMapping7 = await stub.getState('pendingReturns');
      let pendingReturns = JSON.parse(tempMapping7);

  if(!(now< biddingEnd )){
throw new Error( "Condition Failed" );
};
  
  
let method8 = thisClass['Mappingbids'];
await method8 (bids,msg.sender);
bids[msg.sender].push({blindedBid: _blindedBid,deposit: msg.value});
  
  
  
}
async reveal(stub, args, thisClass) {
if (args.length != 4 ){
            throw new Error('Incorrect number of arguments. Expecting 4');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let _values = JSON.parse(args[1]);

let _fake = JSON.parse(args[2]);

let _secret = JSON.parse(args[3]);
let temp0 = await stub.getState('beneficiary');
      let beneficiary = temp0.toString();
let temp1 = await stub.getState('biddingEnd');
      let biddingEnd = parseFloat(temp1);
let temp2 = await stub.getState('revealEnd');
      let revealEnd = parseFloat(temp2);
let temp3 = await stub.getState('ended');
      let ended = JSON.parse(temp3);
let tempMapping4 = await stub.getState('bids');
      let bids = JSON.parse(tempMapping4);
let temp5 = await stub.getState('highestBidder');
      let highestBidder = temp5.toString();
let temp6 = await stub.getState('highestBid');
      let highestBid = parseFloat(temp6);
let tempMapping7 = await stub.getState('pendingReturns');
      let pendingReturns = JSON.parse(tempMapping7);

  if(!(now> biddingEnd )){
throw new Error( "Condition Failed" );
};
  
  if(!(now< revealEnd )){
throw new Error( "Condition Failed" );
};
  
  
let method8 = thisClass['Mappingbids'];
await method8 (bids,msg.sender);
let length=bids[msg.sender].length;
        
  if(!(_values.length==length)){
throw new Error( "Condition Failed" );
};
  if(!(_fake.length==length)){
throw new Error( "Condition Failed" );
};
  if(!(_secret.length==length)){
throw new Error( "Condition Failed" );
};
  let refund;
        
  
 for ( let i = 0;i<length;i++)
{

  
let method9 = thisClass['Mappingbids'];
await method9 (bids,msg.sender);
let bid=bids[msg.sender][i];
        
  let value=_values[i];
        let fake=_fake[i];
        let secret=_secret[i];
        
let result10 = await  ConstantClass.keccak256(value,fake,secret);
  
 if(bid.blindedBid!=JSON.parse(result10))
{
continue;
  
}

  refund+=bid.deposit;
  
 if(!fake&&bid.deposit>=value)
{

      let method11 = thisClass['placeBid'];
let result11 = await method11(stub,msg.sender,value);
  
 if(JSON.parse(result11))
{

  refund-=value;
}

  
}

  bid.blindedBid='0x0000000000000000000000000000000000000000000000000000000000000000';
  bids[msg.sender][i] = bid;
      
 }
let result12 = await  ConstantClass.transfer(stub , msg ,msg.sender,refund);
  ;
  
  
  
  let tempJSON13 = JSON.stringify(bids);
    await stub.putState('bids', Buffer.from(tempJSON13));

}
async placeBid(stub ,bidder,value) {
let success = false;
let temp0 = await stub.getState('beneficiary');
      let beneficiary = temp0.toString();
let temp1 = await stub.getState('biddingEnd');
      let biddingEnd = parseFloat(temp1);
let temp2 = await stub.getState('revealEnd');
      let revealEnd = parseFloat(temp2);
let temp3 = await stub.getState('ended');
      let ended = JSON.parse(temp3);
let tempMapping4 = await stub.getState('bids');
      let bids = JSON.parse(tempMapping4);
let temp5 = await stub.getState('highestBidder');
      let highestBidder = temp5.toString();
let temp6 = await stub.getState('highestBid');
      let highestBid = parseFloat(temp6);
let tempMapping7 = await stub.getState('pendingReturns');
      let pendingReturns = JSON.parse(tempMapping7);

  
 if(value<=highestBid)
{

  
 let returnTemp = false;

  
  
 return Buffer.from(returnTemp.toString());
 
  
}

  
 if(highestBidder!=0)
{

  
let method8 = thisClass['MappingpendingReturns'];
await method8 (pendingReturns,highestBidder);
pendingReturns[highestBidder]+=highestBid;
  
}

  highestBid=value;
  highestBidder=bidder;
  
 let returnTemp = true;

  
  let tempJSON9 = JSON.stringify(pendingReturns);
    await stub.putState('pendingReturns', Buffer.from(tempJSON9));
await stub.putState('highestBid', Buffer.from(highestBid.toString()));
await stub.putState('highestBidder', Buffer.from(highestBidder.toString()));

 return Buffer.from(returnTemp.toString());
 
  
  let tempJSON10 = JSON.stringify(pendingReturns);
    await stub.putState('pendingReturns', Buffer.from(tempJSON10));
await stub.putState('highestBid', Buffer.from(highestBid.toString()));
await stub.putState('highestBidder', Buffer.from(highestBidder.toString()));
return Buffer.from(success.toString());

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
let temp1 = await stub.getState('biddingEnd');
      let biddingEnd = parseFloat(temp1);
let temp2 = await stub.getState('revealEnd');
      let revealEnd = parseFloat(temp2);
let temp3 = await stub.getState('ended');
      let ended = JSON.parse(temp3);
let tempMapping4 = await stub.getState('bids');
      let bids = JSON.parse(tempMapping4);
let temp5 = await stub.getState('highestBidder');
      let highestBidder = temp5.toString();
let temp6 = await stub.getState('highestBid');
      let highestBid = parseFloat(temp6);
let tempMapping7 = await stub.getState('pendingReturns');
      let pendingReturns = JSON.parse(tempMapping7);

  
let method8 = thisClass['MappingpendingReturns'];
await method8 (pendingReturns,msg.sender);
let amount=pendingReturns[msg.sender];
        
  
 if(amount>0)
{

  
let method9 = thisClass['MappingpendingReturns'];
await method9 (pendingReturns,msg.sender);
pendingReturns[msg.sender]=0;
let result10 = await  ConstantClass.transfer(stub , msg ,msg.sender,amount);
  ;
  
}

  
  let tempJSON11 = JSON.stringify(pendingReturns);
    await stub.putState('pendingReturns', Buffer.from(tempJSON11));

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
let temp1 = await stub.getState('biddingEnd');
      let biddingEnd = parseFloat(temp1);
let temp2 = await stub.getState('revealEnd');
      let revealEnd = parseFloat(temp2);
let temp3 = await stub.getState('ended');
      let ended = JSON.parse(temp3);
let tempMapping4 = await stub.getState('bids');
      let bids = JSON.parse(tempMapping4);
let temp5 = await stub.getState('highestBidder');
      let highestBidder = temp5.toString();
let temp6 = await stub.getState('highestBid');
      let highestBid = parseFloat(temp6);
let tempMapping7 = await stub.getState('pendingReturns');
      let pendingReturns = JSON.parse(tempMapping7);

  if(!(now> revealEnd )){
throw new Error( "Condition Failed" );
};
  
  if(!(!ended)){
throw new Error( "Condition Failed" );
};
  let payload8 = {
winner: highestBidder,
highestBid: highestBid
}
payload8  = JSON.stringify(payload8 );
 stub.setEvent('AuctionEnded', payload8 );
  ended=true;
let result9 = await  ConstantClass.transfer(stub , msg ,beneficiary,highestBid);
  ;
  
  
  await stub.putState('ended', Buffer.from(ended.toString()));

}
async Mappingbids(bids,arg1){
if(bids[arg1] == undefined)
{bids[arg1] =[];
}
}
async MappingpendingReturns(pendingReturns,arg1){
if(pendingReturns[arg1] == undefined)
{pendingReturns[arg1] =0;
}
}

 } 

 shim.start(new BlindAuction());