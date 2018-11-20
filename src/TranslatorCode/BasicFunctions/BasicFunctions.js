'use strict';

function GetItemDetail(name, list) {
  for (var i = 0; i < list.length; i++) {
    if (list[i].Name == name) {
      return list[i];
    }
  }
}

function IsItemExistInList(name, list) {
  
 if(list == undefined) return false;

  for (var i = 0; i < list.length; i++) {
    if (list[i].Name == name) {
      return true;
    }
  }
  return false;
}

function GetItemDetailWithContractName(name, contractName, list) {
  for (var i = 0; i < list.length; i++) {
    if (list[i].Name == name && list[i].ContractName == contractName) {
      return list[i];
    }
  }
}

function IsItemExistInListWithContractName(name, contractName, list) {
  for (var i = 0; i < list.length; i++) {
    if (list[i].Name == name && list[i].ContractName == contractName) {
      return true;
    }
  }
  return false;
}

function GetListWithGivenContractName(contractName, list) {
  var returnList = [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].ContractName == contractName) {
      returnList.push(list[i]);
    }
  }
  return returnList;
}

function DefaultValue(TypeName) {

  if (TypeName.type == 'ElementaryTypeName') {
    if (TypeName.name.replace(/\'/g, '').split(/(\d+)/)[0] == 'uint' || TypeName.name.replace(/\'/g, '').split(/(\d+)/)[0] == 'int') {
      return '0';
    }
    else if (TypeName.name == 'bool') {
      return 'false';
    }
    else if (TypeName.name == 'address' || TypeName.name == 'string') {
      return '\'\'';
    }
  }
  else if (TypeName.type == 'UserDefinedTypeName') // not struct yet
  {
    return '0'; // for enumType
  }
  else if (TypeName.type == 'ArrayTypeName') {
    return '[]';
  }
  else if (TypeName.type == 'Mapping') {
    return '{}';
  }
}

function IsAssignmentOperator(operator) {
  if (operator == '=' || operator == '+=' || operator == '-=' || operator == '*=' || operator == '/=' || operator == '%=' || operator == '|=' || operator == '&=' || operator == '^=' || operator == '<<=' || operator == '>>=') {
    return true;
  }
  return false;
}

function isEquivalent(a, b) {

  if(a == undefined || b== undefined)
  {
    return false;
  }
 
  // Create arrays of property names
  var aProps = Object.getOwnPropertyNames(a);
  var bProps = Object.getOwnPropertyNames(b);

  if (aProps.length != bProps.length) {
      return false;
  }

  for (var i = 0; i < aProps.length; i++) {
      var propName = aProps[i];

      if (a[propName] !== b[propName]) {
          return false;
      }
  }

  return true;
}

exports.GetItemDetail = GetItemDetail;
exports.IsItemExistInList = IsItemExistInList;
exports.GetItemDetailWithContractName = GetItemDetailWithContractName;
exports.IsItemExistInListWithContractName = IsItemExistInListWithContractName;
exports.DefaultValue = DefaultValue;
exports.IsAssignmentOperator = IsAssignmentOperator;
exports.GetListWithGivenContractName = GetListWithGivenContractName;
exports.isEquivalent = isEquivalent;