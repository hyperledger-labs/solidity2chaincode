/*# Licensed under the Apache License, Version 2.0 (the "License"); you may
# not use this file except in compliance with the License. You may obtain
# a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
# License for the specific language governing permissions and limitations
# under the License. */

'use strict';
var parser = require('solidity-parser-antlr');
var parsePath = require('parse-filepath');
var readline = require('readline-sync');
var fs = require('fs');
var constantCode = require('./ConstantCode/Constants');
var Translator = require('./TranslatorCode/Translator');


function WriteContractInFiles(directory) {

  let outputPath = directory +'/output';
  for (let i = 0; i < Translator.contractsTranslatedCode.length; i++) {
    let contractDetail = Translator.contractsTranslatedCode[i];
    if (contractDetail.IsAbstractClass == false && contractDetail.IsLibrary == false) {
      let output = constantCode.header + constantCode.constantClass + '\n\n';
      let contractFileName = contractDetail.Name;
      output += contractDetail.Code + '\n shim.start(new ' + contractDetail.Name + '());';
      if (!fs.existsSync(outputPath)){
        fs.mkdirSync(outputPath);
      }
      if (!fs.existsSync(outputPath+'/'+contractFileName)){
        fs.mkdirSync(outputPath+'/'+contractFileName);
      }
      fs.writeFile(outputPath +'/' + contractFileName +'/test.js', output, function (err) { if (err) throw err; });
      fs.writeFile(outputPath +'/' + contractFileName +'/package.json', constantCode.testpackageJsonFile, function (err) { if (err) throw err; });
    
    }
  }
  
  if (!fs.existsSync(outputPath+'/balance')){
    fs.mkdirSync(outputPath+'/balance');
  }
  fs.writeFile(outputPath +'/balance/balance.js', constantCode.balanceChaincode, function (err) { if (err) throw err; });
  fs.writeFile(outputPath +'/balance/package.json', constantCode.balancepackageJsonFile, function (err) { if (err) throw err; });
 
  fs.writeFile(outputPath +'/README.md', 'Make sure balance.js chaincode is already running on Fabric', function (err) { if (err) throw err; });

}

function main(directory, fileName) {
  try {
    let input = fs.readFileSync(directory + "/" + fileName, 'utf8');
    let ast = parser.parse(input); // Abstract Syntax Tree
    //console.log(JSON.stringify(ast));
    Translator.Translate(ast, directory);
    WriteContractInFiles(directory);
    console.log("Successfully Translated Output Files are in " + directory + " Folder");
  }
  catch (error) {
    console.log(error);
  }
}

let filepath = process.argv[2];

if(filepath == undefined)
{
  filepath = readline.question("Enter Solidity File Name with Complete Path (e.g ../Examples/Example#1/SimpleStorage.sol   or '/Users/ahmad/Desktop//Examples/Example#1/SimpleStorage.sol')  : ");
}
//console.log(filepath);

let directory = parsePath(filepath).dir;
let fileName = parsePath(filepath).basename;
main(directory, fileName);
