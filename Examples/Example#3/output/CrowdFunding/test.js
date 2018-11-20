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


class CrowdFunding {
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

  
 let numCampaigns = 0;
    await stub.putState('numCampaigns', Buffer.from(numCampaigns.toString()));
let campaigns = {};
      await stub.putState('campaigns', Buffer.from(JSON.stringify(campaigns)));

 } 
async newCampaign(stub, args, thisClass) {
if (args.length != 3 ){
            throw new Error('Incorrect number of arguments. Expecting 3');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let beneficiary = args[1];

let goal = parseFloat(args[2]);
let campaignID = 0;
let temp0 = await stub.getState('numCampaigns');
      let numCampaigns = parseFloat(temp0);
let tempMapping1 = await stub.getState('campaigns');
      let campaigns = JSON.parse(tempMapping1);

  campaignID=numCampaigns++;
  
let method2 = thisClass['Mappingcampaigns'];
await method2 (campaigns,campaignID);
campaigns[campaignID]={beneficiary:beneficiary,fundingGoal:goal,numFunders:0,amount:0};
  
  await stub.putState('numCampaigns', Buffer.from(numCampaigns.toString()));
let tempJSON3 = JSON.stringify(campaigns);
    await stub.putState('campaigns', Buffer.from(tempJSON3));
return Buffer.from(campaignID.toString());

}
async contribute(stub, args, thisClass) {
if (args.length != 2 ){
            throw new Error('Incorrect number of arguments. Expecting 2');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let campaignID = parseFloat(args[1]);
let temp0 = await stub.getState('numCampaigns');
      let numCampaigns = parseFloat(temp0);
let tempMapping1 = await stub.getState('campaigns');
      let campaigns = JSON.parse(tempMapping1);

  
let method2 = thisClass['Mappingcampaigns'];
await method2 (campaigns,campaignID);
let c=campaigns[campaignID];
        
  c.funders[c.numFunders++]={addr:msg.sender,amount:msg.value};
  c.amount+=msg.value;
  campaigns[campaignID] = c;
      
  let tempJSON3 = JSON.stringify(campaigns);
    await stub.putState('campaigns', Buffer.from(tempJSON3));

}
async checkGoalReached(stub, args, thisClass) {
if (args.length != 2 ){
            throw new Error('Incorrect number of arguments. Expecting 2');
          }

          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address

let campaignID = parseFloat(args[1]);
let reached = false;
let temp0 = await stub.getState('numCampaigns');
      let numCampaigns = parseFloat(temp0);
let tempMapping1 = await stub.getState('campaigns');
      let campaigns = JSON.parse(tempMapping1);

  
let method2 = thisClass['Mappingcampaigns'];
await method2 (campaigns,campaignID);
let c=campaigns[campaignID];
        
  
 if(c.amount<c.fundingGoal)
{

  
 let returnTemp = false;

  
  
 return Buffer.from(returnTemp.toString());
 
}

  let amount=c.amount;
        
  c.amount=0;
let result3 = await  ConstantClass.transfer(stub , msg ,c.beneficiary,amount);
  ;
  
 let returnTemp = true;

  campaigns[campaignID] = c;
      
  let tempJSON4 = JSON.stringify(campaigns);
    await stub.putState('campaigns', Buffer.from(tempJSON4));

 return Buffer.from(returnTemp.toString());
 
  campaigns[campaignID] = c;
      
  let tempJSON5 = JSON.stringify(campaigns);
    await stub.putState('campaigns', Buffer.from(tempJSON5));
return Buffer.from(reached.toString());

}
async Mappingcampaigns(campaigns,arg1){
if(campaigns[arg1] == undefined)
{campaigns[arg1] = { 
beneficiary: '',
fundingGoal: 0,
numFunders: 0,
amount: 0,
funders: {}
}; 
}}

 } 

 shim.start(new CrowdFunding());