function $each(map, func) {
  for (var key in map) {
    func(key, map[key]);
  }
};




// Parse takes a string representing a selector and returns a selector
// object, or an error. The input will cause an error if it does not follow
// this form:
//
//     <selector-syntax> ::= <requirement> | <requirement> "," <selector-syntax>
//         <requirement> ::= WHITESPACE_OPT KEY <set-restriction>
//     <set-restriction> ::= "" | <inclusion-exclusion> <value-set>
// <inclusion-exclusion> ::= <inclusion> | <exclusion>
//           <exclusion> ::= WHITESPACE "not" <inclusion>
//           <inclusion> ::= WHITESPACE "in" WHITESPACE
//           <value-set> ::= "(" <values> ")"
//              <values> ::= VALUE | VALUE "," <values>
//
// KEY is a sequence of one or more characters that does not contain ',' or ' '
//      [^, ]+
// VALUE is a sequence of zero or more characters that does not contain ',', ' ' or ')'
//      [^, )]*
// WHITESPACE_OPT is a sequence of zero or more whitespace characters
//      \s*
// WHITESPACE is a sequence of one or more whitespace characters
//      \s+
//
// Example of valid syntax:
//  "x in (foo,,baz),y,z not in ()"
//
// Note:
//  (1) Inclusion - " in " - denotes that the KEY is equal to any of the
//      VALUEs in its requirement
//  (2) Exclusion - " not in " - denotes that the KEY is not equal to any
//      of the VALUEs in its requirement
//  (3) The empty string is a valid VALUE
//  (4) A requirement with just a KEY - as in "y" above - denotes that
//      the KEY exists and can be any VALUE.
//
// TODO: value validation possibly including duplicate value check, restricting certain characters
// Returns an array of Requirements
// Requirement contains
//    key - the label key
//    operator - one of KubernetesLabelSelector.OPERATORS (EXISTS, IN, NOT_IN)
//    values - an array of string label values.  For the EXISTS operator this will be null.
KubernetesLabelSelector = {};
KubernetesLabelSelector.OPERATORS = {
  EXISTS: "exists",
  IN: "in",
  NOT_IN: "not_in"
};
KubernetesLabelSelector.Parse = function(selector) {
  var keyRegex = new RegExp("^[^, ]+");
  var inRegex = new RegExp("^\\s*in\\s+\\(");
  var notInRegex = new RegExp("^\\s*not\\s+in\\s+\\(");
  var nextRegex = new RegExp("^\\s*(,\\s*|$)");
  var valueRegex = new RegExp("^\\s*([^, )]*)\\s*(,|$)");
  var cursor = 0;
  var requirements = [];

  while (cursor < selector.length) {
    var keyMatch = keyRegex.exec(selector.substr(cursor));
    if (!keyMatch) {
      throw "No key found";
    }     
    var key = keyMatch[0];
    cursor += key.length;
    
    var existsMatch = nextRegex.exec(selector.substr(cursor));
    if (existsMatch || cursor == selector.length) {
      cursor += existsMatch[0].length;
      requirements.push({
        key: key,
        operator: KubernetesLabelSelector.OPERATORS.EXISTS,
        values: null
      });
      continue;
    }
    
    var inMatch = inRegex.exec(selector.substr(cursor));
    var notInMatch = notInRegex.exec(selector.substr(cursor));
    if (inMatch || notInMatch) {
      cursor += inMatch ? inMatch[0].length : notInMatch[0].length;
      var end = selector.indexOf(")", cursor);
      if (end < cursor) {
        throw "Missing closing ) on value set for key " + key + ".";
      }
      var valueString = selector.substring(cursor, end);
      var values = [];
      var valCursor = 0;
      while (valCursor < valueString.length) {
        var valMatch = valueRegex.exec(valueString.substr(valCursor));
        if (!valMatch) {
          throw "Could not parse value list for key " + key + ". Found " + values.length + " values.";
        }
        valCursor += valMatch[0].length;
        values.push(valMatch[1]);
      }
      if (inMatch) {
        requirements.push({
          key: key,
          operator: KubernetesLabelSelector.OPERATORS.IN,
          values: values
        });
      }
      else {
        requirements.push({
          key: key,
          operator: KubernetesLabelSelector.OPERATORS.NOT_IN,
          values: values
        });
      }
      cursor = end + 1;
      var nextMatch = nextRegex.exec(selector.substr(cursor));
      if (!nextMatch) {
        throw "Unable to find start of next key after the value list for key " + key + ".";   
      }
      cursor += nextMatch[0].length;
      continue;
    }
    throw "Invalid selector syntax. Could not find valid operator for key " + key + ".";
  }
    
  return requirements;
}
