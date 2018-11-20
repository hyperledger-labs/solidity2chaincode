'use strict';
var BasicFunctions = require('../BasicFunctions/BasicFunctions');

function GetVariableNameFromSingleExpression(expression) {

  if (expression.type == 'Identifier') {
    return expression.name;
  }
  else if (expression.type == 'IndexAccess') {
    if(expression.base.type == 'IndexAccess')
    {
      return GetVariableNameFromSingleExpression(expression.base);
    }
    return expression.base.name;
  }
  else if (expression.type == 'MemberAccess') {
    if (expression.expression.type == 'Identifier') {
      return expression.expression.name;
    }
    else if (expression.expression.type == 'IndexAccess') {
      return expression.expression.base.name;
    }
  }
}

function TranslateArguments(argumentss, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList) {
  let output = '';

  for (let j = 0; j < argumentss.length; j++) {
    if (argumentss[j].type == 'FunctionCall') {
      output += '{';
      for (let i = 0; i < argumentss[j].arguments.length; i++) {
        output += argumentss[j].names[i] + ": " + TranslateExpression(argumentss[j].arguments[i], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,[]);
        if (i != argumentss[j].arguments.length - 1) { output += ','; }
      }
      output += '}'
    }
  }

  return output;
}

function TranslateType(_expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName) {

  let output = '';

  if (_expression.type == 'Identifier') {
    if (_expression.name == 'this') {
      return '_this';
    }
    return _expression.name;
  }
  else if (_expression.type == 'NumberLiteral') {
    return _expression.number;
  }
  else if (_expression.type == 'BooleanLiteral') {
    return _expression.value;
  }
  else if (_expression.type == 'StringLiteral') {
    return '\'' + _expression.value + '\'';
  }
  else if (_expression.type == 'MemberAccess') {

    if (_expression.expression.type == 'Identifier' && BasicFunctions.IsItemExistInList(_expression.expression.name, enumsList)) {
      let EnumVariable = BasicFunctions.GetItemDetail(_expression.expression.name, enumsList);
      return ' ' + BasicFunctions.GetItemDetail(_expression.memberName, EnumVariable.Members).index + ' /* use index of Enum Type */';
    }
    else if (_expression.memberName == 'balance') {
      let preFunction = TranslateType(_expression.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
      let VariableNameReplaced = 'functionVariable' + functionCallsList.length;
      functionCallsList.push({ PreFunction: preFunction, Name: _expression.memberName, VariableNameReplaced: VariableNameReplaced })
      return '#' + VariableNameReplaced + '#';
    }
    else {
      return TranslateType(_expression.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName) + '.' + _expression.memberName;
    }
  }
  else if (_expression.type == 'IndexAccess') {
    let baseName = TranslateExpression(_expression.base, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
    let index = TranslateExpression(_expression.index, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
    if (!BasicFunctions.IsItemExistInList(baseName + ' ' + index, mappingVariablesList)) // already exist check // it may be array or mapping type 
    {
      mappingVariablesList.push({ Name: baseName + ' ' + index, VariableName: baseName, Key: index });
    }
    return baseName + '[' + index + ']';
  }
  else if (_expression.type == 'FunctionCall') {

    if (_expression.expression.name == 'require' || _expression.expression.name == 'assert') {
      output += 'if(!(' + TranslateExpression(_expression.arguments[0], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName) + `)){\n`;

      if (_expression.arguments.length > 1) {
        output += 'throw new Error("' + _expression.arguments[1].value + '");\n}';
      }
      else {
        output += 'throw new Error( "Condition Failed" );\n}';
      }

    }
    else if (_expression.expression.name == 'revert') {
      output += 'throw "Error";';
    }
    else if (_expression.expression.type == 'ElementaryTypeNameExpression') { // type casting for the time being doing for some cases
      if (((_expression.expression.typeName.name).replace(/\'/g, '').split(/(\d+)/)[0] == 'uint' || (_expression.expression.typeName.name).replace(/\'/g, '').split(/(\d+)/)[0] == 'int' || _expression.expression.typeName.name == 'bytes4') && _expression.arguments[0].type == 'Identifier') {
        return _expression.arguments[0].name;
      }
      if (((_expression.expression.typeName.name).replace(/\'/g, '').split(/(\d+)/)[0] == 'uint' || (_expression.expression.typeName.name).replace(/\'/g, '').split(/(\d+)/)[0] == 'int') && _expression.arguments[0].type == 'IndexAccess') {
        return TranslateType(_expression.arguments[0], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
      }
      if (_expression.expression.typeName.name == 'address' && _expression.arguments[0].type == 'NumberLiteral' && _expression.arguments[0].number == 0) {
        return '\'\'';
      }
      if (_expression.expression.typeName.name == 'bytes32' && _expression.arguments[0].type == 'NumberLiteral' && _expression.arguments[0].number == 0) {
        return '\'0x0000000000000000000000000000000000000000000000000000000000000000\'';
      }
      if (_expression.expression.typeName.name == 'address' && _expression.arguments[0].type == 'Identifier' && _expression.arguments[0].name == 'this') {
        return '_this';
      }
    }
    else if (_expression.expression.type == 'Identifier') { // for handling Ballot a = Ballot(....);

      if (BasicFunctions.IsItemExistInList(_expression.expression.name, structsList)) {
        let structDetail = BasicFunctions.GetItemDetail(_expression.expression.name, structsList);

        let tempoutput = '{';
        for (let i = 0; i < _expression.arguments.length; i++) {
          tempoutput += structDetail.Members[i].Name + ':' + TranslateExpression(_expression.arguments[i], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
          if (i != _expression.arguments.length - 1) { tempoutput += ',' }
        }
        tempoutput += '}'
        return tempoutput;
      }
      else {
        let functionParameters = [];
        for (let i = 0; i < _expression.arguments.length; i++) {
          functionParameters.push(TranslateExpression(_expression.arguments[i], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName));
        }
        let VariableNameReplaced = 'functionVariable' + functionCallsList.length;
        functionCallsList.push({ Name: _expression.expression.name, VariableNameReplaced: VariableNameReplaced, Parameters: functionParameters })
        return '#' + VariableNameReplaced + '#';
      }
    }
    else if (_expression.expression.type == 'MemberAccess') {

      
      if (BasicFunctions.IsItemExistInList(_expression.expression.expression.name, interfaceContractVariableName)) {
        let interfacefunctiondetail = BasicFunctions.GetItemDetail(_expression.expression.expression.name, interfaceContractVariableName);
     
        let parameters = '';
        for (let i = 0; i < _expression.arguments.length; i++) {
          parameters += ",";
          parameters += TranslateExpression(_expression.arguments[i], _expression.expression.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList, interfaceContractVariableName);
          parameters +=".toString()";
        }

        output += ` let arguments123 = ['` + _expression.expression.memberName + `',msg.value.toString()` + parameters + `]
        await stub.invokeChaincode(`+ interfacefunctiondetail.Contractaddress + `, arguments123);`;

        return output;
      }
      else if (_expression.expression.memberName == 'push') {

        if (!changedVariables.includes(_expression.expression.expression.name)) { changedVariables.push(_expression.expression.expression.name) };
        return TranslateType(_expression.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName) + '(' + TranslateArguments(_expression.arguments, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList) + ')';
      }
      else if (_expression.expression.memberName == 'send' || _expression.expression.memberName == 'transfer') {

        let preFunction = TranslateType(_expression.expression.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);

        let functionParameters = [];
        for (let i = 0; i < _expression.arguments.length; i++) {
          functionParameters.push(TranslateExpression(_expression.arguments[i], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName));
        }

        let VariableNameReplaced = 'functionVariable' + functionCallsList.length;
        functionCallsList.push({ PreFunction: preFunction, Name: _expression.expression.memberName, VariableNameReplaced: VariableNameReplaced, Parameters: functionParameters })
        return '#' + VariableNameReplaced + '#';
      }
      else {
        let preFunction = TranslateType(_expression.expression.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
        let variablename = GetVariableNameFromSingleExpression(_expression.expression.expression);
       
        if (BasicFunctions.IsItemExistInList(variablename, stateVariablesList) /*|| IsItemExistInList(variablename,localVariablesList)*/) {
          let variableDetail = BasicFunctions.GetItemDetail(variablename, stateVariablesList);
          for (let i = 0; i < librarysList.length; i++) {
            if ((variableDetail.TypeName.type == 'Mapping' && variableDetail.TypeName.valueType.name == librarysList[i].TypeName.name) || variableDetail.TypeName.name == librarysList.TypeName[i].name) {
              
              let parameters = '';
              for (let i = 0; i < _expression.arguments.length; i++) {
                parameters += ",";
                parameters += TranslateExpression(_expression.arguments[i], _expression.expression.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
              }

              let functioncall = "await " + librarysList[i].Name + "." + _expression.expression.memberName + '(' + preFunction + parameters + ')';
              return functioncall;
            }
          }
        }
        else if (BasicFunctions.IsItemExistInList(variablename, librarysList)) {
          let parameters = '';
          for (let i = 0; i < _expression.arguments.length; i++) {
            parameters += TranslateExpression(_expression.arguments[i], _expression.expression.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
            if (i != _expression.arguments.length - 1) { parameters += ","; }
          }
          let functioncall = "await " + variablename + "." + _expression.expression.memberName + '(' + parameters + ')';
          return functioncall;
        }
        else {
          let parameters = '';
          for (let i = 0; i < _expression.arguments.length; i++) {
            parameters += ",";
            parameters += TranslateExpression(_expression.arguments[i], _expression.expression.expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
          }
          let functioncall = preFunction + "." + _expression.expression.memberName + '(stub,[ msg.value' + parameters + '],thisClass)';
          return functioncall;

        }
      }
    }
  }
  return output;
}

function TranslateOneVariableAndFunction(_expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList ,interfaceContractVariableName) {
  let output = ``;

  if (_expression.type == 'Conditional') {
    output += TranslateExpression(_expression.condition, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName) + '?' + TranslateExpression(_expression.trueExpression, mappingVariablesList, functionCallsList, changedVariables, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName) + ' : ' + TranslateExpression(_expression.falseExpression, mappingVariablesList, functionCallsList, changedVariables, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
  }
  else if (_expression.type == 'UnaryOperation' && _expression.isPrefix == false) {
    output += TranslateExpression(_expression.subExpression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
    output += _expression.operator;
    if (_expression.operator == '++' || _expression.operator == '--') {
      let variableName = GetVariableNameFromSingleExpression(_expression.subExpression);
      if (!changedVariables.includes(variableName)) { changedVariables.push(variableName); }
    }
  }
  else if (_expression.type == 'UnaryOperation' && _expression.isPrefix == true) {
    output += _expression.operator;
    output += TranslateExpression(_expression.subExpression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
    if (_expression.operator == '++' || _expression.operator == '--') {
      let variableName = GetVariableNameFromSingleExpression(_expression.subExpression);
      if (!changedVariables.includes(variableName)) { changedVariables.push(variableName); }
    }
  }
  else if (_expression.type == 'TupleExpression') {
    output += '(' + TranslateExpression(_expression.components[0], mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName) + ')';
  }
  else {
    output += TranslateType(_expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
  }
  return output;
}

function TranslateExpression(_expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName) {

  let output = '';

  if (_expression.type != 'BinaryOperation') {
    output += TranslateOneVariableAndFunction(_expression, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
  }
  else {
    let stack = new Array();

    while (_expression.type == 'BinaryOperation') {
      stack.push(_expression);
      _expression = _expression.left;
    }

    while (stack.length > 0) {
      _expression = stack.pop();

      if (_expression.left.type != 'BinaryOperation') {
        output += TranslateOneVariableAndFunction(_expression.left, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
      }

      output += _expression.operator;

      if (BasicFunctions.IsAssignmentOperator(_expression.operator)) {
        let variableName = GetVariableNameFromSingleExpression(_expression.left);

        if (!changedVariables.includes(variableName)) { changedVariables.push(variableName); }
      }

      if (_expression.right.type == 'BinaryOperation') {
        _expression = _expression.right;

        while (_expression.type == 'BinaryOperation') {
          stack.push(_expression);
          _expression = _expression.left;
        }
      }
      else {
        output += TranslateOneVariableAndFunction(_expression.right, mappingVariablesList, functionCallsList, changedVariables, localVariablesList, structsList, enumsList, eventsList, modifiersList, functionsList, stateVariablesList, mappingTypeList, librarysList,interfaceContractVariableName);
      }
    }
  }
  return output;
}

exports.TranslateExpression = TranslateExpression;