'use strict';

var TranslateExpression = require('./TranslateExpression');
var BasicFunctions = require('../BasicFunctions/BasicFunctions');
var TranslateStatements = require('./TranslateStatements');

String.prototype.replaceAll = function (search, replacement) { // For Replace All
  var target = this;
  return target.replace(new RegExp(search, 'g'), replacement);
};

function TranslateParameters(functionParameters) {

  let parameters = [];
  for (let i = 0; i < functionParameters.length; i++) {
    let typeName = functionParameters[i].typeName;
    let variablename = functionParameters[i].name;
    parameters.push({ Name: variablename, TypeName: typeName });
  }
  return parameters;
}

function TranslateStorageVariables(localVariablesList, changedVariables) {
  let output = `
  `;
  for (let i = 0; i < localVariablesList.length; i++) {
    if (localVariablesList[i].Type == 'storage') {
      if (!changedVariables.includes(localVariablesList[i].InitValue.split('[')[0]))
        changedVariables.push(localVariablesList[i].InitValue.split('[')[0]);
      output += localVariablesList[i].InitValue + ` = ` + localVariablesList[i].Name + `;
      `;
    }
  }
  return output;
}

function PutChangesInOneStateVariable(contractName, variableDetail, changedVariable, variableCounter, enumsList) {
  let output = '';
  if (variableDetail.TypeName.type == 'ElementaryTypeName' || (variableDetail.TypeName.type == 'UserDefinedTypeName' && BasicFunctions.IsItemExistInListWithContractName(variableDetail.TypeName.namePath, contractName, enumsList))) {
    output += `await stub.putState('` + changedVariable + `', Buffer.from(` + changedVariable + `.toString()));\n`;
  }
  else if (variableDetail.TypeName.type == 'ArrayTypeName' || variableDetail.TypeName.type == 'Mapping') {
    output += `let tempJSON` + variableCounter.count + ` = JSON.stringify(` + changedVariable + `);
    await stub.putState('`+ changedVariable + `', Buffer.from(tempJSON` + variableCounter.count++ + `));\n`;
  }
  return output;
}

function PutChangesInStateVariables(contractName, changedVariables, extendsClassesName, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList) {
  let output = `
  `;

  for (let i = 0; i < changedVariables.length; i++) {
    if (BasicFunctions.IsItemExistInListWithContractName(changedVariables[i], contractName, stateVariablesList)) {  //for derived class variables
      let variableDetail = BasicFunctions.GetItemDetailWithContractName(changedVariables[i], contractName, stateVariablesList);
      output += PutChangesInOneStateVariable(contractName, variableDetail, changedVariables[i], variableCounter, enumsList);
    }
    else {
      for (let j = 0; j < extendsClassesName.length; j++) {
        if (BasicFunctions.IsItemExistInListWithContractName(changedVariables[i], extendsClassesName[j], stateVariablesList)) {  //for base class variables
          let variableDetail = BasicFunctions.GetItemDetailWithContractName(changedVariables[i], extendsClassesName[j], stateVariablesList);
          output += PutChangesInOneStateVariable(extendsClassesName[j], variableDetail, changedVariables[i], variableCounter, enumsList);
        }
      }
    }
  }
  return output;
}

function TranslateReturnParameters(parameters, returnParametersList) {
  let output = ``;

  for (let i = 0; i < parameters.length; i++) {
    let variableName = '';
    let typeName = parameters[i].typeName;
    if (parameters[i].name != null) {
      variableName = parameters[i].name;
      output += `let ` + variableName + ` = ` + BasicFunctions.DefaultValue(typeName) + `;\n`;
    }
    returnParametersList.push({ Name: variableName, TypeName: typeName });
  }
  return output;
}

function GetStateOneVariable(variableDetail, variableCounter) {
  let output = '';

  if (variableDetail.TypeName.type == 'ElementaryTypeName' && (variableDetail.TypeName.name.replace(/\'/g, '').split(/(\d+)/)[0] == 'uint' || variableDetail.TypeName.name.replace(/\'/g, '').split(/(\d+)/)[0] == 'int')) {
    output += `let temp` + variableCounter.count + ` = await stub.getState('` + variableDetail.Name + `');
      let ` + variableDetail.Name + ` = parseFloat(temp` + variableCounter.count++ + `);\n`;
  }
  else if (variableDetail.TypeName.type == 'ElementaryTypeName' && (variableDetail.TypeName.name == 'bool')) {
    output += `let temp` + variableCounter.count + ` = await stub.getState('` + variableDetail.Name + `');
      let ` + variableDetail.Name + ` = JSON.parse(temp` + variableCounter.count++ + `);\n`;
  }
  else if (variableDetail.TypeName.type == 'ElementaryTypeName' && (variableDetail.TypeName.name == 'address' || variableDetail.TypeName.name == 'string')) {
    output += `let temp` + variableCounter.count + ` = await stub.getState('` + variableDetail.Name + `');
      let ` + variableDetail.Name + ` = temp` + variableCounter.count++ + `.toString();\n`;
  }
  else if (variableDetail.TypeName.type == 'UserDefinedTypeName') {
    output += `let temp` + variableCounter.count + ` = await stub.getState('` + variableDetail.Name + `');
      let ` + variableDetail.Name + ` = temp` + variableCounter.count++ + `.toString();\n`;
  }
  else if (variableDetail.TypeName.type == 'Mapping' || variableDetail.TypeName.type == 'ArrayTypeName') {
    output += `let tempMapping` + variableCounter.count + ` = await stub.getState('` + variableDetail.Name + `');
      let `+ variableDetail.Name + ` = JSON.parse(tempMapping` + variableCounter.count++ + `);\n`;
  }
  return output;
}

function GetStateVariables(contractName, extendsClassesName, variableCounter, stateVariablesList) {
  let output = ``;

  let derivedClassStateVariableList = BasicFunctions.GetListWithGivenContractName(contractName, stateVariablesList);

  for (let i = 0; i < derivedClassStateVariableList.length; i++) { // for derived class
    output += GetStateOneVariable(derivedClassStateVariableList[i], variableCounter);
  }

  for (let i = 0; i < extendsClassesName.length; i++) { // for base classes
    let basedClassStateVariableList = BasicFunctions.GetListWithGivenContractName(extendsClassesName[i], stateVariablesList);
    for (let j = 0; j < basedClassStateVariableList.length; j++) {
      output += GetStateOneVariable(basedClassStateVariableList[j], variableCounter)
    }
  }
  return output;
}

function ReturnParameters(returnParametersList,isLibrary) // for the time being only one variable return
{
  let output = ``;
  if (returnParametersList.length > 0 && returnParametersList[0].Name != "") {
    if(isLibrary)
    {
      output += `return ` + returnParametersList[0].Name + `;\n`;
    }
    else
    {
      output += `return Buffer.from(` + returnParametersList[0].Name + `.toString());\n`;
    }
  }
  return output;
}
function TranslateModifiersCode(contractName, functionModifiers, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, isBefore, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName,isLibrary) {


  let oneModifier = '';

  for (let i = 0; i < functionModifiers.length; i++) {

    if (BasicFunctions.IsItemExistInList(functionModifiers[i].name, modifiersList)) {
      let modifierDetail = BasicFunctions.GetItemDetail(functionModifiers[i].name, modifiersList)

      var localVariablesList = [];
      localVariablesList.push({ Scope: 0, ListofVariables: [] });

      if (isBefore == true) {
        for (let k = 0; k < modifierDetail.BeforeStatements.length; k++) {
          oneModifier += TranslateOneStatement(modifierDetail.BeforeStatements[k], contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName,isLibrary);
       }
      }
      else {
        for (let k = 0; k < modifierDetail.AfterStatements.length; k++) {
          oneModifier += TranslateOneStatement(modifierDetail.AfterStatements[k], contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName,isLibrary)
        }
      }

      oneModifier += TranslateStorageVariables(localVariablesList.pop().ListofVariables, changedVariables);

      for (let k = 0; k < functionModifiers[i].arguments.length; k++) {
        if (functionModifiers[i].arguments[k].type == 'BinaryOperation') {

          var mappingVariablesList = [];
          var functionCallsList = [];
          let expressionStatement = TranslateExpression.TranslateExpression(functionModifiers[i].arguments[k], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
          oneModifier = oneModifier.replaceAll(modifierDetail.Parameters[k].Name, ' ' + expressionStatement + ' ');
        }
        else if (functionModifiers[i].arguments[k].type == 'MemberAccess' && BasicFunctions.IsItemExistInList(functionModifiers[i].arguments[k].expression.name, enumsList)) {
          let EnumType = functionModifiers[i].arguments[k].expression.name;
          let enumDetail = BasicFunctions.GetItemDetail(EnumType, enumsList);
          let EnumValue = enumDetail.Index;
          oneModifier = oneModifier.replaceAll(modifierDetail.Parameters[k].Name, ' ' + EnumValue + ' ');
        }
        else {
          oneModifier = oneModifier.replaceAll(modifierDetail.Parameters[k].Name, ' ' + functionModifiers[i].arguments[k].name + ' ');
        }

      }
    }
  }
  return oneModifier;
}

function TranslateOneStructDefinition(structDefinition, contractName) {
  let name = structDefinition.name;
  let members = [];

  for (let i = 0; i < structDefinition.members.length; i++) {
    let variablename = structDefinition.members[i].name;
    let typeName = structDefinition.members[i].typeName;
    members.push({ Name: variablename, TypeName: typeName });
  }

  var struct = { Name: name, Members: members, ContractName: contractName }
  return struct;
}

function TranslateOneEnumDefinition(enumDefinition, contractName) {
  let name = enumDefinition.name;
  let members = [];
  for (let i = 0; i < enumDefinition.members.length; i++) {
    let value = enumDefinition.members[i].name;
    let index = i;
    members.push({ Name: value, Index: index });
  }

  var _enum = { Name: name, Members: members, ContractName: contractName }
  return _enum;
}

function TranslateOneEventDefinition(eventDefinition, contractName) {

  let name = eventDefinition.name;
  let parameters = TranslateParameters(eventDefinition.parameters.parameters);
  var event = { Name: name, Parameters: parameters, ContractName: contractName }
  return event;
}

function TranslateOneModifier(modifier, contractName) { // only handle Expression Satement (not handled if,while,for)

  let beforeStatements = [];
  let afterStatements = [];
  let name = modifier.name;
  let parameters = TranslateParameters(modifier.parameters.parameters);

  let body = modifier.body;
  let j = 0;
  for (j = 0; j < body.statements.length; j++) {
    if (body.statements[j].expression.type == 'Identifier' && body.statements[j].expression.name == '_') break;
    beforeStatements.push(body.statements[j]);
  }
  for (j = j + 1; j < body.statements.length; j++) {
    afterStatements.push(body.statements[j]);
  }

  var _modifier = { Name: name, Parameters: parameters, BeforeStatements: beforeStatements, AfterStatements: afterStatements, ContractName: contractName };
  return _modifier;
}

function TranslateOneFunctionDefinition(functionDefinition, contractName) {

  let name = '';
  let parameters = [];
  let returnParameters = [];
  let modifiers = [];
  let visibility = 'public';
  let stateMutability = '';
  let isConstructor = false;
  let isImplementationExist = false;

  if (functionDefinition.isConstructor == true || functionDefinition.name == contractName) {
    isConstructor = true;
  }
  else {
    name = functionDefinition.name;
  }

  if (functionDefinition.parameters != null) { parameters = TranslateParameters(functionDefinition.parameters.parameters); }

  modifiers = functionDefinition.modifiers;
  visibility = functionDefinition.visibility;
  if (visibility == 'default') { visibility = 'public'; }
  stateMutability = functionDefinition.stateMutability;
  if (functionDefinition.body != null) { isImplementationExist = true; }
  if (functionDefinition.returnParameters != null) { returnParameters = TranslateParameters(functionDefinition.returnParameters.parameters); }

  var functionDetail = { Name: name, Parameters: parameters, ReturnParameters: returnParameters, Modifiers: modifiers, Visibility: visibility, StateMutability: stateMutability, IsConstructor: isConstructor, IsImplementationExist: isImplementationExist, ContractName: contractName }
  return functionDetail;

}

function TranslateOneUsingForDeclaration(usingForStatement, contractName) {

  let name = usingForStatement.libraryName;
  let typeName = usingForStatement.typeName;
  var library = { Name: name, TypeName: typeName, ContractName: contractName }
  return library;
}

function TranslateOneStateVariableDeclaration(stateVariableDeclaration, contractName, gettersList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList) {
  let variables = stateVariableDeclaration.variables;
  for (let i = 0; i < variables.length; i++) {

    if (variables[i].visibility == 'public') { gettersList.push(variables[i].name); }

    let variableName = variables[i].name;
    let typeName = variables[i].typeName;
    if (typeName.type == 'Mapping') {
      mappingTypeList.push({ Name: variableName, KeyType: typeName.keyType, ValueType: typeName.valueType, ContractName:contractName });
    }
    let initialValue = null;
    if (stateVariableDeclaration.initialValue != null) { initialValue = TranslateExpression.TranslateExpression(stateVariableDeclaration.initialValue, [], [], [], [], structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,[]); }
    var stateVariable = { Name: variableName, TypeName: typeName, InitialValue: initialValue, ContractName: contractName };
    return stateVariable;
  }
}

function TranslateOneGetter(contractName, variableName, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList) {
  let output = ``;

  output += `async ` + variableName + `(stub, args, thisClass) { \n`;

  let variableDetail = BasicFunctions.GetItemDetailWithContractName(variableName, contractName, stateVariablesList);

  if (variableDetail.TypeName.type == 'ElementaryTypeName' || variableDetail.TypeName.type == 'UserDefinedTypeName' && BasicFunctions.IsItemExistInListWithContractName(variableDetail.TypeName.namePath, contractName, enumsList)) {
    output += `let returnTemp = await stub.getState('` + variableName + `');
      return Buffer.from(returnTemp.toString());
     `;
  }
  else if (variableDetail.TypeName.type == 'ArrayTypeName' || variableDetail.TypeName.type == 'Mapping') {
    let numberOfArguments = 0;
    let argumentsOutput = '';
    let indexOutput = '';
    let typeName = variableDetail.TypeName;

    do {
      numberOfArguments++;
      if (typeName.type == 'ArrayTypeName') {
        typeName = typeName.baseTypeName;
        argumentsOutput += '\nlet arg' + numberOfArguments + ' = parseFloat(args[' + (numberOfArguments) + ']);\n'
      }
      else if (typeName.type == 'Mapping') {
        typeName = typeName.valueType;
        argumentsOutput += '\nlet arg' + numberOfArguments + ' = args[' + (numberOfArguments) + '];\n'
      }
      indexOutput += `[arg` + numberOfArguments + `]`;
    }
    while (typeName.type == 'ArrayTypeName' || typeName.type == 'Mapping');

    output += ` if (args.length != ` + (numberOfArguments+1) + `){
              
        throw new Error('Incorrect number of arguments. Expecting `+ (numberOfArguments+1) + ` ');
      }`;

    output += argumentsOutput;
   
    output += `let temp = await stub.getState('` + variableName + `');
      let `+ variableName + ` = JSON.parse(temp); `

    if (variableDetail.TypeName.type == 'Mapping') {
      output += `\nlet method = thisClass['Mapping` + variableName + `'];\n`;
      output += 'await method(' + variableName;
      for (let i = 1; i <= numberOfArguments; i++) { output += ',arg' + i; }
      output += ');\n';
    }

    output += `return Buffer.from(` + variableName + `` + indexOutput + `.toString());`;

  }
  output += `
      }
      `;

  return output;
}

function ByDefaultSetStateOneVariable(stateVariable, contractName, enumsList) {

  let output = '';
  if (stateVariable.TypeName.type == 'ElementaryTypeName' || (stateVariable.TypeName.type == 'UserDefinedTypeName' && BasicFunctions.IsItemExistInListWithContractName(stateVariable.TypeName.namePath, contractName, enumsList))) {

    let initalValue = BasicFunctions.DefaultValue(stateVariable.TypeName);
    if (stateVariable.InitialValue != null) { initalValue = stateVariable.InitialValue; }
    output += ` let ` + stateVariable.Name + ` = ` + initalValue + `;
    await stub.putState('`+ stateVariable.Name + `', Buffer.from(` + stateVariable.Name + `.toString()));\n`;
  }
  else if (stateVariable.TypeName.type == 'Mapping') {
    output += `let ` + stateVariable.Name + ` = {};
      await stub.putState('`+ stateVariable.Name + `', Buffer.from(JSON.stringify(` + stateVariable.Name + `)));\n`;
  }
  else if (stateVariable.TypeName.type == 'ArrayTypeName') {
    output += `let ` + stateVariable.Name + ` = [];
      await stub.putState('`+ stateVariable.Name + `', Buffer.from(JSON.stringify(` + stateVariable.Name + `)));\n`;
  }
  return output;
}

function ByDefaultSetStateVariables(contractName, extendsClassesName, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList) {
  let output = `\n`;

  let derivedClassStateVariableList = BasicFunctions.GetListWithGivenContractName(contractName, stateVariablesList);

  for (let i = 0; i < derivedClassStateVariableList.length; i++) { // for derived class
    output += ByDefaultSetStateOneVariable(derivedClassStateVariableList[i], contractName, enumsList);
  }

  for (let i = 0; i < extendsClassesName.length; i++) { // for base classes
    let basedClassStateVariableList = BasicFunctions.GetListWithGivenContractName(extendsClassesName[i], stateVariablesList);
    for (let j = 0; j < basedClassStateVariableList.length; j++) {
      output += ByDefaultSetStateOneVariable(basedClassStateVariableList[j], extendsClassesName[i], enumsList)
    }
  }
  return output;
}

function TranslateFunctionParameters(parameters, parametersList) {

  let output = `\nif (args.length != ` + (parameters.length + 1) + ` ){
            throw new Error('Incorrect number of arguments. Expecting `+ (parameters.length + 1) + `');
          }\n
          let now = await ConstantClass.getNowValue(); 
          let block = { timestamp:now }; //block.timestamp is alias for now 
          let msg = { value:parseFloat(args[0]) , sender:await ConstantClass.getSenderAddress(stub)};
          let _this = await stub.getState('This');  // contract address\n`;

  for (let i = 1; i <= parameters.length; i++) {
    let variableName = parameters[i-1].name;
    let typeName = parameters[i-1].typeName;
    if (typeName.type == 'ElementaryTypeName') {
      if (typeName.name.replace(/\'/g, '').split(/(\d+)/)[0] == 'int' || typeName.name.replace(/\'/g, '').split(/(\d+)/)[0] == 'uint') {
        output += `\nlet ` + variableName + ` = parseFloat(args[` + i + `]);\n`;
      }
      else if (typeName.name == 'address' || typeName.name == 'bytes32' || typeName.name == 'string' || typeName.name == 'bytes') {
        output += `\nlet ` + variableName + ` = args[` + i + `];\n`;
      }
    }
    else if ((typeName.type == 'ArrayTypeName')) {
      output += `\nlet ` + variableName + ` = JSON.parse(args[` + i + `]);\n`;
    }

    parametersList.push({ Name: variableName, TypeName: typeName });
  }
  return output;
}

function TranslateOneStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName,isLibrary) {
  let output = '';
  if (statement.type == 'ExpressionStatement') {
    output += TranslateStatements.TranslateExpressionStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList ,interfaceContractVariableName);
  }
  if (statement.type == 'ReturnStatement') {
    output += TranslateStatements.TranslateReturnStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList ,interfaceContractVariableName,isLibrary);
  }
  if (statement.type == 'IfStatement') {
    output += TranslateStatements.TranslateIfStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList ,interfaceContractVariableName);
  }
  if (statement.type == 'ForStatement') {
    output += TranslateStatements.TranslateForStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList ,interfaceContractVariableName,isLibrary);
  }
  if (statement.type == 'WhileStatement') {
    output += TranslateStatements.TranslateWhileStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList ,interfaceContractVariableName,isLibrary);
  }
  if (statement.type == 'VariableDeclarationStatement') {
    output += TranslateStatements.TranslateVariableDeclarationStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList ,interfaceContractVariableName);
  }
  if (statement.type == 'EmitStatement') {
    output += TranslateStatements.TranslateEmitStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList ,interfaceContractVariableName);
  }
  if (statement.type == 'Block') {
    output += TranslateBody(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName,isLibrary);
  }
  if (statement.type == 'ContinueStatement') {
    output += `continue;`
  }
  if (statement.type == 'BreakStatement') {
    output += `break;`
  }
  if (statement.type == 'ThrowStatement') {
    output += `throw 'Error';`
  }
  return output;
}

function TranslateBody(body, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName,isLibrary) {

  localVariablesList.push({ Scope: localVariablesList.length, ListofVariables: [] });
  let output = ``;
  for (var i = 0; i < body.statements.length; i++) {
    output += TranslateOneStatement(body.statements[i], contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName,isLibrary);
  }
  output += TranslateStorageVariables(localVariablesList.pop().ListofVariables, changedVariables); //2.h
  return output;
}

function TranslateOneFunction(functionDetail, contractName, extendsClassesName, otherClassesName, isLibrary, contractsTranslatedCode, isOverloaded ,structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList) {

  let output = ``;
  let functionModifiers = functionDetail.modifiers;
  var parametersList = [];
  var returnParametersList = [];
  var localVariablesList = [];
  var changedVariables = [];
  var variableCounter = { count: 0 };
  var interfaceContractVariableName = [];

  if (isLibrary) {
    output += 'static async ' + functionDetail.name + '(';
    for (let i = 0; i < functionDetail.parameters.parameters.length; i++) {
      output += functionDetail.parameters.parameters[i].name;
      if (i != functionDetail.parameters.parameters.length - 1) { output += ','; }
    }
    output += `) {\n`;
  }
  else if ((functionDetail.visibility == 'private' || functionDetail.visibility == 'internal') && functionDetail.name != '') {
    output += `async ` + functionDetail.name + `(stub `;
    for (let i = 0; i < functionDetail.parameters.parameters.length; i++) {
      output += ',' + functionDetail.parameters.parameters[i].name;
    }
    output += `) {\n`;
  }
  else if ((functionDetail.visibility == 'public' || functionDetail.visibility == 'default') && functionDetail.name != '') {
    if (isOverloaded) {
      output += `async ` + functionDetail.name + `_` + functionDetail.parameters.parameters.length + `(stub, args, thisClass) {`;
    }
    else {
      output += `async ` + functionDetail.name + `(stub, args, thisClass) {`;
    }
    output += TranslateFunctionParameters(functionDetail.parameters.parameters, parametersList);
  }
  else {
    output += `async ` + 'FallbackFunction' + `(stub, args, thisClass) { //for the time being we are translating fall back function. But not using it yet. How we will use it, it is pending?\n`; // for the time being will change 
  }

  if (functionDetail.returnParameters != null) {
    output += TranslateReturnParameters(functionDetail.returnParameters.parameters, returnParametersList);
  }

  output += GetStateVariables(contractName, extendsClassesName, variableCounter, stateVariablesList);
  output += TranslateModifiersCode(contractName, functionModifiers, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, true, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName,isLibrary);
  output += TranslateBody(functionDetail.body, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName,isLibrary);
  output += TranslateModifiersCode(contractName, functionModifiers, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, false, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName,isLibrary);
  output += PutChangesInStateVariables(contractName, changedVariables, extendsClassesName, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
  output += ReturnParameters(returnParametersList,isLibrary);
  output += `\n}\n`;

  return output;
}

exports.TranslateOneStructDefinition = TranslateOneStructDefinition;
exports.TranslateOneEnumDefinition = TranslateOneEnumDefinition;
exports.TranslateOneEventDefinition = TranslateOneEventDefinition;
exports.TranslateOneModifier = TranslateOneModifier;
exports.TranslateOneFunctionDefinition = TranslateOneFunctionDefinition;
exports.TranslateOneUsingForDeclaration = TranslateOneUsingForDeclaration;
exports.TranslateOneStateVariableDeclaration = TranslateOneStateVariableDeclaration;
exports.TranslateOneGetter = TranslateOneGetter;
exports.ByDefaultSetStateVariables = ByDefaultSetStateVariables;
exports.TranslateFunctionParameters = TranslateFunctionParameters;
exports.TranslateBody = TranslateBody;
exports.PutChangesInStateVariables = PutChangesInStateVariables;
exports.TranslateStorageVariables = TranslateStorageVariables;
exports.TranslateOneStatement = TranslateOneStatement;
exports.TranslateOneFunction = TranslateOneFunction;