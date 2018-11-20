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


class Ballot {async chairperson(stub, args, thisClass) { 
let returnTemp = await stub.getState('chairperson');
      return Buffer.from(returnTemp.toString());
     
      }
      async voters(stub, args, thisClass) { 
 if (args.length != 2){
              
        throw new Error('Incorrect number of arguments. Expecting 2 ');
      }
let arg1 = args[1];
let temp = await stub.getState('voters');
      let voters = JSON.parse(temp); 
let method = thisClass['Mappingvoters'];
await method(voters,arg1);
return Buffer.from(voters[arg1].toString());
      }
      async proposals(stub, args, thisClass) { 
 if (args.length != 2){
              
        throw new Error('Incorrect number of arguments. Expecting 2 ');
      }
let arg1 = parseFloat(args[1]);
let temp = await stub.getState('proposals');
      let proposals = JSON.parse(temp); return Buffer.from(proposals[arg1].toString());
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

  
 let chairperson = '';
    await stub.putState('chairperson', Buffer.from(chairperson.toString()));
let voters = {};
      await stub.putState('voters', Buffer.from(JSON.stringify(voters)));
let proposals = [];
      await stub.putState('proposals', Buffer.from(JSON.stringify(proposals)));

if (args.length != 2 ){
            throw new Error('Incorrect number of arguments. Expecting 2');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let proposalNames = JSON.parse(args[1]);

  chairperson=msg.sender;
  
let method0 = thisClass['Mappingvoters'];
await method0 (voters,chairperson);
voters[chairperson].weight=1;
  
 for ( let i = 0;i<proposalNames.length;i++)
{

  proposals.push({name: proposalNames[i],voteCount: 0});
  
 }
  
  await stub.putState('chairperson', Buffer.from(chairperson.toString()));
let tempJSON1 = JSON.stringify(voters);
    await stub.putState('voters', Buffer.from(tempJSON1));
let tempJSON2 = JSON.stringify(proposals);
    await stub.putState('proposals', Buffer.from(tempJSON2));

 } 
async giveRightToVote(stub, args, thisClass) {
if (args.length != 2 ){
            throw new Error('Incorrect number of arguments. Expecting 2');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let voter = args[1];
let temp0 = await stub.getState('chairperson');
      let chairperson = temp0.toString();
let tempMapping1 = await stub.getState('voters');
      let voters = JSON.parse(tempMapping1);
let tempMapping2 = await stub.getState('proposals');
      let proposals = JSON.parse(tempMapping2);

  if(!(msg.sender==chairperson)){
throw new Error("Only chairperson can give right to vote.");
};
  
let method3 = thisClass['Mappingvoters'];
await method3 (voters,voter);
if(!(!voters[voter].voted)){
throw new Error("The voter already voted.");
};
  
let method4 = thisClass['Mappingvoters'];
await method4 (voters,voter);
if(!(voters[voter].weight==0)){
throw new Error( "Condition Failed" );
};
  
let method5 = thisClass['Mappingvoters'];
await method5 (voters,voter);
voters[voter].weight=1;
  
  let tempJSON6 = JSON.stringify(voters);
    await stub.putState('voters', Buffer.from(tempJSON6));

}
async delegate(stub, args, thisClass) {
if (args.length != 2 ){
            throw new Error('Incorrect number of arguments. Expecting 2');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let to = args[1];
let temp0 = await stub.getState('chairperson');
      let chairperson = temp0.toString();
let tempMapping1 = await stub.getState('voters');
      let voters = JSON.parse(tempMapping1);
let tempMapping2 = await stub.getState('proposals');
      let proposals = JSON.parse(tempMapping2);

  
let method3 = thisClass['Mappingvoters'];
await method3 (voters,msg.sender);
let sender=voters[msg.sender];
        
  if(!(!sender.voted)){
throw new Error("You already voted.");
};
  if(!(to!=msg.sender)){
throw new Error("Self-delegation is disallowed.");
};
  
let method4 = thisClass['Mappingvoters'];
await method4 (voters,to);

while (voters[to].delegate!='')
{

  
let method5 = thisClass['Mappingvoters'];
await method5 (voters,to);
to=voters[to].delegate;
  if(!(to!=msg.sender)){
throw new Error("Found loop in delegation.");
};
  
}
  sender.voted=true;
  sender.delegate=to;
  
let method6 = thisClass['Mappingvoters'];
await method6 (voters,to);
let delegate_=voters[to];
        
  
 if(delegate_.voted)
{

  proposals[delegate_.vote].voteCount+=sender.weight;
  
}
else
{
  delegate_.weight+=sender.weight;
  
}

  voters[msg.sender] = sender;
      voters[to] = delegate_;
      
  let tempJSON7 = JSON.stringify(proposals);
    await stub.putState('proposals', Buffer.from(tempJSON7));
let tempJSON8 = JSON.stringify(voters);
    await stub.putState('voters', Buffer.from(tempJSON8));

}
async vote(stub, args, thisClass) {
if (args.length != 2 ){
            throw new Error('Incorrect number of arguments. Expecting 2');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let proposal = parseFloat(args[1]);
let temp0 = await stub.getState('chairperson');
      let chairperson = temp0.toString();
let tempMapping1 = await stub.getState('voters');
      let voters = JSON.parse(tempMapping1);
let tempMapping2 = await stub.getState('proposals');
      let proposals = JSON.parse(tempMapping2);

  
let method3 = thisClass['Mappingvoters'];
await method3 (voters,msg.sender);
let sender=voters[msg.sender];
        
  if(!(!sender.voted)){
throw new Error("Already voted.");
};
  sender.voted=true;
  sender.vote=proposal;
  proposals[proposal].voteCount+=sender.weight;
  voters[msg.sender] = sender;
      
  let tempJSON4 = JSON.stringify(proposals);
    await stub.putState('proposals', Buffer.from(tempJSON4));
let tempJSON5 = JSON.stringify(voters);
    await stub.putState('voters', Buffer.from(tempJSON5));

}
async winningProposal(stub, args, thisClass) {
if (args.length != 1 ){
            throw new Error('Incorrect number of arguments. Expecting 1');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address
let winningProposal_ = 0;
let temp0 = await stub.getState('chairperson');
      let chairperson = temp0.toString();
let tempMapping1 = await stub.getState('voters');
      let voters = JSON.parse(tempMapping1);
let tempMapping2 = await stub.getState('proposals');
      let proposals = JSON.parse(tempMapping2);

  let winningVoteCount=0;
        
  
 for ( let p = 0;p<proposals.length;p++)
{

  
 if(proposals[p].voteCount>winningVoteCount)
{

  winningVoteCount=proposals[p].voteCount;
  winningProposal_=p;
  
}

  
 }
  
  return Buffer.from(winningProposal_.toString());

}
async winnerName(stub, args, thisClass) {
if (args.length != 1 ){
            throw new Error('Incorrect number of arguments. Expecting 1');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address
let winnerName_ = undefined;
let temp0 = await stub.getState('chairperson');
      let chairperson = temp0.toString();
let tempMapping1 = await stub.getState('voters');
      let voters = JSON.parse(tempMapping1);
let tempMapping2 = await stub.getState('proposals');
      let proposals = JSON.parse(tempMapping2);

      let method3 = thisClass['winningProposal'];
let result3 = await method3(stub,[ msg.value ],thisClass);
  winnerName_=proposals[JSON.parse(result3)].name;
  
  return Buffer.from(winnerName_.toString());

}
async Mappingvoters(voters,arg1){
if(voters[arg1] == undefined)
{voters[arg1] = { 
weight: 0,
voted: false,
delegate: '',
vote: 0
}; 
}}

 } 

 shim.start(new Ballot());