'use strict';
var parser = require('solidity-parser-antlr');
var fs = require('fs');
var constantCode = require('../ConstantCode/Constants');
var TranslatorSubParts = require('./TranslatorSubParts/TranslatorSubParts');
var BasicFunctions = require('./BasicFunctions/BasicFunctions');

///// Gloval Variables /////////

var contractsTranslatedCode = [];
var structsList = [];
var enumsList = [];
var eventsList = [];
var modifiersList = [];
var functionsList = [];
var stateVariablesList = [];
var mappingTypeList = [];
var librarysList = [];
var overloadedFunctionsList = [];

///////////// 13  /////////////////
function TranslateMappingUndefinedFunctions(contractName) {

  let output = ``;
  let contractMappingType = BasicFunctions.GetListWithGivenContractName(contractName, mappingTypeList);
  for (let i = 0; i < contractMappingType.length; i++) {

    output += `async Mapping` + contractMappingType[i].Name + `(` + contractMappingType[i].Name + `,arg1`;
    let typeName = contractMappingType[i].ValueType;
    let counter = 1;
    while (typeName.type == 'Mapping') {
      typeName = typeName.valueType;
      counter++;
      output += `,arg` + counter;
    }

    output += '){\n';


    typeName = contractMappingType[i].ValueType;
    let indexOutputString = '';

    counter = 1;
    do{
      indexOutputString += '[arg' + counter + ']';
      output += 'if(' + contractMappingType[i].Name + indexOutputString + ' == undefined)\n{';
      output += contractMappingType[i].Name + indexOutputString + ' =';

      if (typeName.type == 'UserDefinedTypeName' && !BasicFunctions.IsItemExistInList(typeName.namePath, enumsList)) {
        let structDetail = BasicFunctions.GetItemDetail(typeName.namePath, structsList);
        output += ` { \n`;
        for (let j = 0; j < structDetail.Members.length; j++) {
          output += structDetail.Members[j].Name + ": " + BasicFunctions.DefaultValue(structDetail.Members[j].TypeName);
          if (j != structDetail.Members.length - 1) { output += `,\n` }
        }
        output += `\n}; \n}`;
      }
      else {
        output += BasicFunctions.DefaultValue(typeName) + `;\n}\n`;
      }

      counter++;

      if(typeName.type != 'Mapping') { break;}
      typeName = typeName.valueType;
       
    }
    while (1);
    output += '}\n';
  }

  return output;
}
///////////// 12 ////////////////////////
function TranslateFunctions(contractParts, contractName, extendsClassesName, otherClassesName, isLibrary) {
  let output = ``;
  for (let i = 0; i < contractParts.length; i++) {
    if (contractParts[i].type == 'FunctionDefinition' && contractParts[i].name != contractName && contractParts[i].isConstructor == false && contractParts[i].body != null) {
      let isOverLoaded = BasicFunctions.GetItemDetailWithContractName(contractParts[i].name, contractName, overloadedFunctionsList);
      output += TranslatorSubParts.TranslateOneFunction(contractParts[i], contractName, extendsClassesName, otherClassesName, isLibrary, contractsTranslatedCode, isOverLoaded, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
    }
  }
  return output;
}
////////////// 11 /////////////////////
function TranslateOverloadedFunctions(contractName) {

  let output = '';
  let contractFunctionList = [];
  for (var i = 0; i < functionsList.length; i++) {
    if (functionsList[i].ContractName == contractName) {
      contractFunctionList.push(functionsList[i]);
    }
  }
  
  let overloadedFunctions = [];

  for (let i = 0; i < contractFunctionList.length; i++) {
    let functionName = contractFunctionList[i].Name;
    for (let j = i+1; j < contractFunctionList.length; j++) {
      if (contractFunctionList[j].Name == functionName) {
        if (!overloadedFunctions.includes(functionName)) {
          overloadedFunctions.push(functionName);
        }
      }
    }
  }

  for (let i = 0; i < overloadedFunctions.length; i++) {
    let name = overloadedFunctions[i];
    let list = [];
    for (let j = 0; j < contractFunctionList.length; j++) {
      if (name == contractFunctionList[j].Name) {
        list.push(contractFunctionList[j].Parameters.length);
      }
    }
    overloadedFunctionsList.push({ Name: name, List: list, ContractName: contractName });
  }

  for (let i = 0; i < overloadedFunctionsList.length; i++) {
    output += `async ` + overloadedFunctionsList[i].Name + `(stub, args, thisClass) { \n let method;\n`;

    for (let j = 0; j < overloadedFunctionsList[i].List.length; j++) {
      output += `if (args.length == ` + (overloadedFunctionsList[i].List[j] + 1) + ` ){\n  method = thisClass['` + overloadedFunctionsList[i].Name + `_` + overloadedFunctionsList[i].List[j] + `']; \nreturn await method(stub, args, thisClass);\n}`
    }
    output += '}\n';
  }

  return output;
}
///////////// 10  /////////////////
function TranslateConstructor(contractParts, contractName, extendsClassesName, otherClassesName) {

  // 3 type of constructor in solidity // a. With Constructor KeyWord  // b. With Function Name = contract Name  // c. No define any thing in solidity
  let output = `  async Constructor(stub, args, thisClass) { \n\n  `;
  output += TranslatorSubParts.ByDefaultSetStateVariables(contractName, extendsClassesName, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);

  for (let i = 0; i < contractParts.length; i++) {

    if (contractParts[i].isConstructor == true || (contractParts[i].type == 'FunctionDefinition' && contractParts[i].name == contractName)) {

      var parametersList = [];
      var returnParametersList = [];
      var changedVariables = []; //for checking state variables changes
      var localVariablesList = [];
      var variableCounter = { count: 0 };

      output += TranslatorSubParts.TranslateFunctionParameters(contractParts[i].parameters.parameters, parametersList);

      for (let j = 0; j < extendsClassesName.length; j++) {

        let contractDetail = BasicFunctions.GetItemDetail(extendsClassesName[j], contractsTranslatedCode);
        if (contractDetail.IsAbstractClass == false) {
          output += 'super.Constructor(stub , [msg.value';

          if (contractParts[i].modifiers.length > 0) { // assume only extend single inheritance
            for (let k = 0; k < contractParts[i].modifiers[0].arguments.length; k++) {
              output += ',' + contractParts[i].modifiers[0].arguments[k].name;
            }
          }
          output += ',thisClass]);'
        }
      }

      output += TranslatorSubParts.TranslateBody(contractParts[i].body, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
      output += TranslatorSubParts.PutChangesInStateVariables(contractName, changedVariables, extendsClassesName, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
      break;
    }
  }
  output += `\n } \n`;
  return output;
}
//////////// 9 ///////////////
function IsAbstractContract(contractName) {

  var _functionsList = BasicFunctions.GetListWithGivenContractName(contractName, functionsList);
  for (let i = 0; i < _functionsList.length; i++) {
    if (_functionsList[i].IsImplementationExist == false) {
      return true;
    }
  }
  return false;
}
///////////// 8 /////////////////
function TranslateStateVariableDeclaration(contractParts, contractName) {

  let output = '';
  var gettersList = [];
  for (let i = 0; i < contractParts.length; i++) {
    if (contractParts[i].type == 'StateVariableDeclaration') {
      stateVariablesList.push(TranslatorSubParts.TranslateOneStateVariableDeclaration(contractParts[i], contractName, gettersList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList));
    }
  }

  for (let i = 0; i < gettersList.length; i++) {
    output += TranslatorSubParts.TranslateOneGetter(contractName, gettersList[i], structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
  }
  return output;
}
///////////// 7 /////////////////
function TranslateUsingForDeclarations(contractParts, contractName, otherClassesName) {

  for (let i = 0; i < contractParts.length; i++) {
    if (contractParts[i].type == 'UsingForDeclaration') {
      librarysList.push(TranslatorSubParts.TranslateOneUsingForDeclaration(contractParts[i], contractName));
      otherClassesName.push(contractParts[i].libraryName);
    }
  }
}
///////////// 6 /////////////////
function TranslateFunctionDefinitions(contractParts, contractName) {

  for (let i = 0; i < contractParts.length; i++) {
    if (contractParts[i].type == 'FunctionDefinition') {
      functionsList.push(TranslatorSubParts.TranslateOneFunctionDefinition(contractParts[i], contractName));
    }
  }
}
///////////// 5 /////////////////
function TranslateModifiers(contractParts, contractName) {

  for (let i = 0; i < contractParts.length; i++) {
    if (contractParts[i].type == 'ModifierDefinition') {
      modifiersList.push(TranslatorSubParts.TranslateOneModifier(contractParts[i], contractName));
    }
  }
}
///////////// 4  /////////////////
function TranslateEventDeclarations(contractParts, contractName) {

  for (let i = 0; i < contractParts.length; i++) {
    if (contractParts[i].type == 'EventDefinition') {
      eventsList.push(TranslatorSubParts.TranslateOneEventDefinition(contractParts[i], contractName));
    }
  }
}
////////////// 3 /////////////////
function TranslateEnumDefinitions(contractParts, contractName) {

  for (let i = 0; i < contractParts.length; i++) {
    if (contractParts[i].type == 'EnumDefinition') {
      enumsList.push(TranslatorSubParts.TranslateOneEnumDefinition(contractParts[i], contractName));
    }
  }
}
//////////////// 2 /////////////////
function TranslateStructDefinitions(contractParts, contractName) {

  for (let i = 0; i < contractParts.length; i++) {
    if (contractParts[i].type == 'StructDefinition') {
      structsList.push(TranslatorSubParts.TranslateOneStructDefinition(contractParts[i], contractName));
    }
  }
}
////////////// 1 ///////////////
function TranslateBaseClassesName(contract, extendsClassesName) {

  let output = '';
  if (contract.baseContracts.length != 0) {
    output += ' extends ';
    for (let i = 0; i < contract.baseContracts.length; i++) {
      output += contract.baseContracts[i].baseName.namePath;
      extendsClassesName.push(contract.baseContracts[i].baseName.namePath);
      if (i != contract.baseContracts.length - 1) { output += ','; }
    }
  }
  return output;
}

function TranslateContract(contract, contractTypeDetail, extendsClassesName,otherClassesName) {

  let output = '';
  let contractName = contract.name;

  let extendsClassesString = TranslateBaseClassesName(contract, extendsClassesName); //1
  TranslateStructDefinitions(contract.subNodes, contractName); //2
  TranslateEnumDefinitions(contract.subNodes, contractName);  //3
  TranslateEventDeclarations(contract.subNodes, contractName); //4
  TranslateModifiers(contract.subNodes, contractName); //5
  TranslateFunctionDefinitions(contract.subNodes, contractName); //6
  TranslateUsingForDeclarations(contract.subNodes, contractName, otherClassesName); //7

  output += 'class ' + contractName + extendsClassesString + ' {';

  if (!contractTypeDetail.isInterfaceClass) {

    output += TranslateStateVariableDeclaration(contract.subNodes, contractName); //8  
    contractTypeDetail.isAbstractClass = IsAbstractContract(contractName, extendsClassesName); // 9
    if (!contractTypeDetail.isAbstractClass && !contractTypeDetail.isLibrary) {
      output += '\n' + constantCode.invokeFunction;
      output += '\n' + constantCode.initFunction + '\n';
      output += TranslateConstructor(contract.subNodes, contractName, extendsClassesName, otherClassesName); // 10 
      output += TranslateOverloadedFunctions(contractName);//11
    }
    output += TranslateFunctions(contract.subNodes, contractName, extendsClassesName, otherClassesName, contractTypeDetail.isLibrary); // 12
    output += TranslateMappingUndefinedFunctions(contractName); //13 
  }

  output += `\n } \n`;
  return output;
}


function TranslateOneContractDefination(contract) {
  var otherContractsNames = [];
  var extendsClassesName = [];
  var otherClassesName = [];   //other classes name if use in contract for example using new or some other methods
  var contractTypeDetail =
  {
    isAbstractClass: false,
    isInterfaceClass: false,
    isLibrary: false
  }

  if (contract.kind == 'interface') {
    contractTypeDetail.isInterfaceClass = true;
    contractTypeDetail.isAbstractClass = true;
  }
  else if (contract.kind == 'library') {
    contractTypeDetail.isLibrary = true;
  }
  let dataInContractFile = TranslateContract(contract, contractTypeDetail, extendsClassesName,otherClassesName); //assume all classes either extend or otherclasses must be declared above the current contract in the input file

  otherContractsNames = extendsClassesName.concat(otherClassesName); // merge two arrays;

  let classesAdded = [];
  let code = '';
  for (let i = 0; i < otherContractsNames.length; i++) {
    if (BasicFunctions.IsItemExistInList(otherContractsNames[i], contractsTranslatedCode) && !classesAdded.includes(otherContractsNames[i])) {
      classesAdded.push(otherContractsNames[i]);
      let contractDetail = BasicFunctions.GetItemDetail(otherContractsNames[i], contractsTranslatedCode)
      code += contractDetail.Code;
    }
  }
  code += dataInContractFile;
  contractsTranslatedCode.push({ Name: contract.name, Code: code, IsAbstractClass: contractTypeDetail.isAbstractClass, IsInterfaceClass: contractTypeDetail.isInterfaceClass, IsLibrary: contractTypeDetail.isLibrary });
}

function Translate(ast, inputDirectory) {

  for (let i = 0; i < ast.children.length; i++) {
    if (ast.children[i].type == 'ImportDirective') {
      let path = ast.children[i].path;
      let input = fs.readFileSync(inputDirectory + '/' + path, 'utf8');
      let ast1 = parser.parse(input);
      Translate(ast1, inputDirectory);
    }
  }
  for (let i = 0; i < ast.children.length; i++) {
    if (ast.children[i].type == 'ContractDefinition') {
      TranslateOneContractDefination(ast.children[i]);
    }
  }
}

exports.Translate = Translate;
exports.contractsTranslatedCode = contractsTranslatedCode;