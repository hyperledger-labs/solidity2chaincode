'use strict';

var TranslateExpression = require('./TranslateExpression');
var TranslatorSubParts = require('./TranslatorSubParts');
var BasicFunctions = require('../BasicFunctions/BasicFunctions');

function GetCommasSeparatedListString(parameters) {
  let output = '';
  if (parameters != null) {
    for (let j = 0; j < parameters.length; j++) {
      output += parameters[j];
      if (j != parameters.length - 1) { output += ','; }
    }
  }
  return output;
}
function GetFunctionCalls(contractName, mappingVariablesList, functionCallsList, changedVariables, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList) {
  let output = '';

  for (let i = 0; i < functionCallsList.length; i++) {

    if (!BasicFunctions.IsItemExistInList(functionCallsList[i].Name, functionsList) && (functionCallsList[i].Name == 'send' || functionCallsList[i].Name == 'transfer')) {
      output += '\nlet result' + variableCounter.count + ' = await  ConstantClass.' + functionCallsList[i].Name + '(stub , msg ,' + functionCallsList[i].PreFunction + ',' + GetCommasSeparatedListString(functionCallsList[i].Parameters, mappingVariablesList, functionCallsList, enumsList, changedVariables) + `);`;
      functionCallsList[i].replaceVariable = variableCounter.count++;
    }
    else if (!BasicFunctions.IsItemExistInList(functionCallsList[i].Name, functionsList) && functionCallsList[i].Name == 'balance') {
      output += '\nlet result' + variableCounter.count + ' = await  ConstantClass.' + functionCallsList[i].Name + '(stub ,' + functionCallsList[i].PreFunction + `);`;
      functionCallsList[i].replaceVariable = variableCounter.count++;
    }
    else if (!BasicFunctions.IsItemExistInList(functionCallsList[i].Name, functionsList) && functionCallsList[i].Name == 'selfdestruct' || functionCallsList[i].Name == 'suicide') {
      output += '\nlet result' + variableCounter.count + ' = await  ConstantClass.' + 'selfdestruct' + '(stub , _this, ' + GetCommasSeparatedListString(functionCallsList[i].Parameters, mappingVariablesList, functionCallsList, enumsList, changedVariables) + `);`;
      functionCallsList[i].replaceVariable = variableCounter.count++;
    }
    else if (!BasicFunctions.IsItemExistInList(functionCallsList[i].Name, functionsList)) {
      output += '\nlet result' + variableCounter.count + ' = await  ConstantClass.' + functionCallsList[i].Name + '(' + GetCommasSeparatedListString(functionCallsList[i].Parameters, mappingVariablesList, functionCallsList, enumsList, changedVariables) + `);`;
      functionCallsList[i].replaceVariable = variableCounter.count++;
    }
    else if (BasicFunctions.IsItemExistInList(functionCallsList[i].Name, functionsList)) {
      output += `
      let method`+ variableCounter.count + ` = thisClass['` + functionCallsList[i].Name + `'];\n`;
      output += `let result` + variableCounter.count + ` = await method` + variableCounter.count + `(`;
      functionCallsList[i].replaceVariable = variableCounter.count++;
      let functionDetail = BasicFunctions.GetItemDetail(functionCallsList[i].Name, functionsList);
      if (functionDetail.Visibility == 'public') {
        output += 'stub,[ msg.value ';
        if (functionCallsList[i].Parameters != null && functionCallsList[i].Parameters.length > 0) {
          output += ',' + GetCommasSeparatedListString(functionCallsList[i].Parameters, mappingVariablesList, functionCallsList, enumsList, changedVariables);
        }
        output += '],thisClass' + `);`;
      }
      else {
        output += 'stub';
        if (functionCallsList[i].Parameters != null && functionCallsList[i].Parameters.length > 0) {
          output += ',' + GetCommasSeparatedListString(functionCallsList[i].Parameters, mappingVariablesList, functionCallsList, enumsList, changedVariables);
        }
        output += `);`;
      }
    }
  }
  return output;
}

function GetMappingUndefined(contractName, mappingVariablesList,variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList) {

  let output = `
  `;

  for (let i = 0; i < mappingVariablesList.length; i++) {
    if (BasicFunctions.IsItemExistInList(mappingVariablesList[i].VariableName, stateVariablesList)) {
      let variableDetail = BasicFunctions.GetItemDetail(mappingVariablesList[i].VariableName, stateVariablesList);

      if (variableDetail.TypeName.type == 'Mapping') {

        output += `\nlet method`+ variableCounter.count+` = thisClass['Mapping` + variableDetail.Name + `'];\n`;
        output += `await method`+ variableCounter.count++ +` (` + variableDetail.Name + ',' + mappingVariablesList[i].Key;
        let typeName = variableDetail.TypeName.valueType;
        while (typeName.type == 'Mapping') {
          i++;
          output += ',' + mappingVariablesList[i].Key;
          typeName = typeName.valueType;
        }
        output += ');\n';
      }
    }
  }
  return output;
}

function ReplaceWithFunctionResult(string, functionCallsList, functionsList) {

  for (let i = 0; i < functionCallsList.length; i++) {
    let functionDetail = BasicFunctions.GetItemDetail(functionCallsList[i].Name, functionsList);
    if ((BasicFunctions.IsItemExistInList(functionCallsList[i].Name, functionsList) && functionDetail.ReturnParameters.length == 0) || (!BasicFunctions.IsItemExistInList(functionCallsList[i].Name, functionsList) && functionCallsList[i].Name == 'transfer')) {
      string = string.replace('#' + functionCallsList[i].VariableNameReplaced + '#', '');
    }
    else {
      string = string.replace('#' + functionCallsList[i].VariableNameReplaced + '#', 'JSON.parse(result' + functionCallsList[i].replaceVariable + ')');
    }
  }
  return string;
}

function TranslateVariableInitExpression(expression) {
  let output = ``;
  if (expression.variables.length > 0) {
    output += 'let ' + expression.variables[0].name + ' = ' + expression.initialValue.number;
  }
  return output;
}

function TranslateExpressionStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName) {

  let output = '';
  var mappingVariablesList = [];
  var functionCallsList = [];
  let expressionStatement = TranslateExpression.TranslateExpression(statement.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
  let functionCallsStatements = GetFunctionCalls(contractName, mappingVariablesList, functionCallsList, changedVariables, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
  let mappingStatements = GetMappingUndefined(contractName, mappingVariablesList,variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
  mappingStatements = ReplaceWithFunctionResult(mappingStatements, functionCallsList, functionsList);
  expressionStatement = ReplaceWithFunctionResult(expressionStatement, functionCallsList, functionsList);
  functionCallsStatements = ReplaceWithFunctionResult(functionCallsStatements, functionCallsList, functionsList);
  output = functionCallsStatements + mappingStatements + expressionStatement + ';';
  return output;
}

function TranslateReturnStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName ,isLibrary) {

  let output = ``;

  if (statement.expression == null) {
    let storageVarialbes = TranslatorSubParts.TranslateStorageVariables(localVariablesList[localVariablesList.length - 1].ListofVariables, changedVariables);
    let saveStateVariables = TranslatorSubParts.PutChangesInStateVariables(contractName, changedVariables, extendsClassesName, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
    output = storageVarialbes + saveStateVariables + `\nreturn ; \n`;
  }
  else {
    var mappingVariablesList = [];
    var functionCallsList = [];

    let expressionStatement = TranslateExpression.TranslateExpression(statement.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
    let functionCallsStatements = GetFunctionCalls(contractName, mappingVariablesList, functionCallsList, changedVariables, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
    let mappingStatements = GetMappingUndefined(contractName, mappingVariablesList,variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
    mappingStatements = ReplaceWithFunctionResult(mappingStatements, functionCallsList, functionsList);
    expressionStatement = ReplaceWithFunctionResult(expressionStatement, functionCallsList, functionsList);
    functionCallsStatements = ReplaceWithFunctionResult(functionCallsStatements, functionCallsList, functionsList);
    let storageVarialbes = TranslatorSubParts.TranslateStorageVariables(localVariablesList[localVariablesList.length - 1].ListofVariables, changedVariables);
    let saveStateVariables = TranslatorSubParts.PutChangesInStateVariables(contractName, changedVariables, extendsClassesName, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
    if(isLibrary)
    {
      output = functionCallsStatements + mappingStatements + `\n let returnTemp = ` + expressionStatement + `;\n` + storageVarialbes + saveStateVariables + `\n return returnTemp;\n `;
    }
    else
    {
      output = functionCallsStatements + mappingStatements + `\n let returnTemp = ` + expressionStatement + `;\n` + storageVarialbes + saveStateVariables + `\n return Buffer.from(returnTemp.toString());\n `;
    }
  }
  return output;
}

function TranslateForStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName,isLibrary) {

  let output = '';
  var mappingVariablesList = [];
  var functionCallsList = [];

  let initStatement = TranslateVariableInitExpression(statement.initExpression); // for the time being just handle one variable 
  let conditionStatement = TranslateExpression.TranslateExpression(statement.conditionExpression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
  let loopExpressionStatement = TranslateExpression.TranslateExpression(statement.loopExpression.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);

  let functionCallsStatements = GetFunctionCalls(contractName, mappingVariablesList, functionCallsList, changedVariables, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
  let mappingStatements = GetMappingUndefined(contractName, mappingVariablesList,variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
  mappingStatements = ReplaceWithFunctionResult(mappingStatements, functionCallsList, functionsList);
  conditionStatement = ReplaceWithFunctionResult(conditionStatement, functionCallsList, functionsList);
  loopExpressionStatement = ReplaceWithFunctionResult(loopExpressionStatement, functionCallsList, functionsList);
  functionCallsStatements = ReplaceWithFunctionResult(functionCallsStatements, functionCallsList, functionsList);
  output += functionCallsStatements + mappingStatements + `\n for ( ` + initStatement + `;` + conditionStatement + `;` + loopExpressionStatement + `)\n{\n`;
  output += TranslatorSubParts.TranslateBody(statement.body, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName,isLibrary);
  output += `\n }`;
  return output;
}

function TranslateIfStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName) {

  let output = '';
  var mappingVariablesList = [];
  var functionCallsList = [];

  let expressionStatement = TranslateExpression.TranslateExpression(statement.condition, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
  let functionCallsStatements = GetFunctionCalls(contractName, mappingVariablesList, functionCallsList, changedVariables, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
  let mappingStatements = GetMappingUndefined(contractName, mappingVariablesList,variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);

  mappingStatements = ReplaceWithFunctionResult(mappingStatements, functionCallsList, functionsList);
  expressionStatement = ReplaceWithFunctionResult(expressionStatement, functionCallsList, functionsList);
  functionCallsStatements = ReplaceWithFunctionResult(functionCallsStatements, functionCallsList, functionsList);

  localVariablesList.push({ Scope: localVariablesList.length, ListofVariables: [] });
  output = functionCallsStatements + mappingStatements + `\n if(` + expressionStatement + `)\n{\n` + TranslatorSubParts.TranslateOneStatement(statement.trueBody, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName) + `\n}\n`;
  if (statement.falseBody != null) { output += `else\n{` + TranslatorSubParts.TranslateOneStatement(statement.falseBody, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName) + `\n}\n`; }
  localVariablesList.pop();
  return output;

}

function TranslateEmitStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName) {

  let output = '';
  var mappingVariablesList = [];
  var functionCallsList = [];
  let eventDetail;

  let payload = `let payload` + variableCounter.count + ` = {\n`;
  let eventName = statement.eventCall.expression.name;


  if (BasicFunctions.IsItemExistInListWithContractName(eventName, contractName, eventsList)) {
    eventDetail = BasicFunctions.GetItemDetail(eventName, eventsList);
  }
  else {
    for (let i = 0; i < extendsClassesName.length; i++) {
      if (BasicFunctions.IsItemExistInListWithContractName(eventName, extendsClassesName[i], eventsList)) {
        eventDetail = BasicFunctions.GetItemDetailWithContractName(eventName, extendsClassesName[i], eventsList);
        break;
      }
    }
  }

  for (let i = 0; i < eventDetail.Parameters.length; i++) {
    payload += eventDetail.Parameters[i].Name + ': ' + TranslateExpression.TranslateExpression(statement.eventCall.arguments[i], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
    if (i != eventDetail.Parameters.length - 1) { payload += `,\n`; }
  }
  payload += `\n}\n`;
  payload += `payload`+variableCounter.count + `  = JSON.stringify(` + `payload`+variableCounter.count + ` );\n stub.setEvent('` + eventName + `', ` + `payload`+variableCounter.count++ + ` );`

  let functionCallsStatements = GetFunctionCalls(contractName, mappingVariablesList, functionCallsList, changedVariables, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
  let mappingStatements = GetMappingUndefined(contractName, mappingVariablesList,variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);

  mappingStatements = ReplaceWithFunctionResult(mappingStatements, functionCallsList, functionsList);
  functionCallsStatements = ReplaceWithFunctionResult(functionCallsStatements, functionCallsList, functionsList);
  payload = ReplaceWithFunctionResult(payload, functionCallsList, functionsList);
  output = functionCallsStatements + mappingStatements + payload;
  return output;
}

function TranslateVariableDeclarationStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList ,interfaceContractVariableName) {
  let output = '';
  var mappingVariablesList = [];
  var functionCallsList = [];
  let initValues = [];

  if (statement.initialValue != null) {
    if (statement.initialValue.type == 'TupleExpression') {
      for (let i = 0; i < statement.initialValue.elements.length; i++) {
        initValues.push(TranslateExpression.TranslateExpression(statement.initialValue.elements[i], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName));
      }
    }
    else if (statement.initialValue.type == 'FunctionCall' && statement.initialValue.expression.type == 'NewExpression' && statement.initialValue.expression.typeName.type == 'UserDefinedTypeName') {

      let newContract = 'new ' + statement.initialValue.expression.typeName.namePath + '()';
      otherClassesName.push(statement.initialValue.expression.typeName.namePath);
      initValues.push(newContract);
    }
    else if (statement.initialValue.type == 'FunctionCall' && statement.initialValue.expression.type == 'Identifier'  && statement.initialValue.arguments.length == 1)
    {
      initValues.push("\'\'");
      otherClassesName.push(statement.initialValue.expression.name);
      interfaceContractVariableName.push({Name: statement.variables[0].name, Contractaddress : statement.initialValue.arguments[0].name})
    }
    else {
      initValues.push(TranslateExpression.TranslateExpression(statement.initialValue, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName));
    }
  }

  let initStatement = '';

  for (let i = 0; i < statement.variables.length; i++) {
    if (statement.initialValue != null) {

      if (statement.variables[i].typeName.type == 'UserDefinedTypeName' && statement.initialValue.type == 'FunctionCall' && statement.initialValue.expression.type == 'NewExpression' && statement.initialValue.expression.typeName.type == 'UserDefinedTypeName') {
        initStatement += `let ` + statement.variables[i].name + `=` + initValues[i] + `;
        `;
        initStatement += 'await ' + statement.variables[i].name + '.Constructor(stub);';
      }
      else {
        initStatement += `let ` + statement.variables[i].name + `=` + initValues[i] + `;
        `;
      }
    }
    else {

      if (statement.variables[i].typeName.type == 'UserDefinedTypeName') {
        initStatement += `let ` + statement.variables[i].name + ` = {};
        `;
      }
      else {
        initStatement += `let ` + statement.variables[i].name + `;
        `;
      }
    }

    localVariablesList[localVariablesList.length - 1].ListofVariables.push({ Name: statement.variables[i].name, TypeName: statement.variables[i].typeName, Type: statement.variables[i].storageLocation, InitValue: initValues[i] });
  }

  let functionCallsStatements = GetFunctionCalls(contractName, mappingVariablesList, functionCallsList, changedVariables, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
  let mappingStatements = GetMappingUndefined(contractName, mappingVariablesList,variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
  
  mappingStatements = ReplaceWithFunctionResult(mappingStatements, functionCallsList, functionsList);
  functionCallsStatements = ReplaceWithFunctionResult(functionCallsStatements, functionCallsList, functionsList);
  initStatement = ReplaceWithFunctionResult(initStatement, functionCallsList, functionsList);

  output = functionCallsStatements + mappingStatements + initStatement;
  return output;
}

function TranslateWhileStatement(statement, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName,isLibrary) {

  let output = '';
  var mappingVariablesList = [];
  var functionCallsList = [];

  let conditionStatement = TranslateExpression.TranslateExpression(statement.condition, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
  let functionCallsStatements = GetFunctionCalls(contractName, mappingVariablesList, functionCallsList, changedVariables, variableCounter, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);
  let mappingStatements = GetMappingUndefined(contractName, mappingVariablesList, variableCounter,structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList);

  mappingStatements = ReplaceWithFunctionResult(mappingStatements, functionCallsList, functionsList);
  functionCallsStatements = ReplaceWithFunctionResult(functionCallsStatements, functionCallsList, functionsList);
  conditionStatement = ReplaceWithFunctionResult(conditionStatement, functionCallsList, functionsList);

  output = functionCallsStatements + mappingStatements + `\nwhile (` + conditionStatement + `)\n{\n`;
  output += TranslatorSubParts.TranslateBody(statement.body, contractName, parametersList, returnParametersList, changedVariables, localVariablesList, variableCounter, extendsClassesName, otherClassesName, contractsTranslatedCode, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName,isLibrary) + `\n}`;
  return output;
}

exports.TranslateExpressionStatement = TranslateExpressionStatement;
exports.TranslateReturnStatement = TranslateReturnStatement;
exports.TranslateForStatement = TranslateForStatement;
exports.TranslateIfStatement = TranslateIfStatement;
exports.TranslateEmitStatement = TranslateEmitStatement;
exports.TranslateVariableDeclarationStatement = TranslateVariableDeclarationStatement;
exports.TranslateWhileStatement = TranslateWhileStatement;


