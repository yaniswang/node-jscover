function BranchData() {
    this.position = -1;
    this.nodeLength = -1;
    this.src = null;
    this.evalFalse = 0;
    this.evalTrue = 0;

    this.init = function(position, nodeLength, src) {
        this.position = position;
        this.nodeLength = nodeLength;
        this.src = src;
        return this;
    }

    this.ranCondition = function(result) {
        if (result)
            this.evalTrue++;
        else
            this.evalFalse++;
    };

    this.pathsCovered = function() {
        var paths = 0;
        if (this.evalTrue > 0)
          paths++;
        if (this.evalFalse > 0)
          paths++;
        return paths;
    };

    this.covered = function() {
        return this.evalTrue > 0 && this.evalFalse > 0;
    };

    this.toJSON = function() {
        return '{"position":' + this.position
            + ',"nodeLength":' + this.nodeLength
            + ',"src":' + jscoverage_quote(this.src)
            + ',"evalFalse":' + this.evalFalse
            + ',"evalTrue":' + this.evalTrue + '}';
    };

    this.message = function() {
        if (this.evalTrue === 0 && this.evalFalse === 0)
            return 'Condition never evaluated         :\t' + this.src;
        else if (this.evalTrue === 0)
            return 'Condition never evaluated to true :\t' + this.src;
        else if (this.evalFalse === 0)
            return 'Condition never evaluated to false:\t' + this.src;
        else
            return 'Condition covered';
    };
}

BranchData.fromJson = function(jsonString) {
    var json = eval('(' + jsonString + ')');
    var branchData = new BranchData();
    branchData.init(json.position, json.nodeLength, json.src);
    branchData.evalFalse = json.evalFalse;
    branchData.evalTrue = json.evalTrue;
    return branchData;
};

BranchData.fromJsonObject = function(json) {
    var branchData = new BranchData();
    branchData.init(json.position, json.nodeLength, json.src);
    branchData.evalFalse = json.evalFalse;
    branchData.evalTrue = json.evalTrue;
    return branchData;
};

function buildBranchMessage(conditions) {
    var message = 'The following was not covered:';
    for (var i = 0; i < conditions.length; i++) {
        if (conditions[i] !== undefined && conditions[i] !== null && !conditions[i].covered())
          message += '\n- '+ conditions[i].message();
    }
    return message;
};

function convertBranchDataConditionArrayToJSON(branchDataConditionArray) {
    var array = [];
    var length = branchDataConditionArray.length;
    for (var condition = 0; condition < length; condition++) {
        var branchDataObject = branchDataConditionArray[condition];
        if (branchDataObject === undefined || branchDataObject === null) {
            value = 'null';
        } else {
            value = branchDataObject.toJSON();
        }
        array.push(value);
    }
    return '[' + array.join(',') + ']';
}

function convertBranchDataLinesToJSON(branchData) {
    if (branchData === undefined) {
        return '{}'
    }
    var json = '';
    for (var line in branchData) {
        if (isNaN(line))
            continue;
        if (json !== '')
            json += ','
        json += '"' + line + '":' + convertBranchDataConditionArrayToJSON(branchData[line]);
    }
    return '{' + json + '}';
}

function convertBranchDataLinesFromJSON(jsonObject) {
    if (jsonObject === undefined) {
        return {};
    }
    for (var line in jsonObject) {
        var branchDataJSON = jsonObject[line];
        if (branchDataJSON !== null) {
            for (var conditionIndex = 0; conditionIndex < branchDataJSON.length; conditionIndex ++) {
                var condition = branchDataJSON[conditionIndex];
                if (condition !== null) {
                    branchDataJSON[conditionIndex] = BranchData.fromJsonObject(condition);
                }
            }
        }
    }
    return jsonObject;
}
function jscoverage_quote(s) {
    return '"' + s.replace(/[\u0000-\u001f"\\\u007f-\uffff]/g, function (c) {
        switch (c) {
            case '\b':
                return '\\b';
            case '\f':
                return '\\f';
            case '\n':
                return '\\n';
            case '\r':
                return '\\r';
            case '\t':
                return '\\t';
            // IE doesn't support this
            /*
             case '\v':
             return '\\v';
             */
            case '"':
                return '\\"';
            case '\\':
                return '\\\\';
            default:
                return '\\u' + jscoverage_pad(c.charCodeAt(0).toString(16));
        }
    }) + '"';
}

function getArrayJSON(coverage) {
    var array = [];
    if (coverage === undefined)
        return array;

    var length = coverage.length;
    for (var line = 0; line < length; line++) {
        var value = coverage[line];
        if (value === undefined || value === null) {
            value = 'null';
        }
        array.push(value);
    }
    return array;
}

function jscoverage_serializeCoverageToJSON() {
    var json = [];
    for (var file in _$jscoverage) {
        var lineArray = getArrayJSON(_$jscoverage[file].lineData);
        var fnArray = getArrayJSON(_$jscoverage[file].functionData);

        json.push(jscoverage_quote(file) + ':{"lineData":[' + lineArray.join(',') + '],"functionData":[' + fnArray.join(',') + '],"branchData":' + convertBranchDataLinesToJSON(_$jscoverage[file].branchData) + '}');
    }
    return '{' + json.join(',') + '}';
}

function jscoverage_parseCoverageJSON(data) {
    var result = {};
    var json = eval('(' + data + ')');
    var file;
    for (file in json) {
        var fileCoverage = json[file];
        result[file] = {};
        result[file].lineData = fileCoverage.lineData;
        result[file].functionData = fileCoverage.functionData;
        result[file].branchData = convertBranchDataLinesFromJSON(fileCoverage.branchData);
    }
    return result;
}

function jscoverage_pad(s) {
    return '0000'.substr(s.length) + s;
}

function jscoverage_html_escape(s) {
    return s.replace(/[<>\&\"\']/g, function (c) {
        return '&#' + c.charCodeAt(0) + ';';
    });
}
try {
  if (typeof top === 'object' && top !== null && typeof top.opener === 'object' && top.opener !== null) {
    // this is a browser window that was opened from another window

    if (! top.opener._$jscoverage) {
      top.opener._$jscoverage = {};
    }
  }
}
catch (e) {}

try {
  if (typeof top === 'object' && top !== null) {
    // this is a browser window

    try {
      if (typeof top.opener === 'object' && top.opener !== null && top.opener._$jscoverage) {
        top._$jscoverage = top.opener._$jscoverage;
      }
    }
    catch (e) {}

    if (! top._$jscoverage) {
      top._$jscoverage = {};
    }
  }
}
catch (e) {}

try {
  if (typeof top === 'object' && top !== null && top._$jscoverage) {
    this._$jscoverage = top._$jscoverage;
  }
}
catch (e) {}
if (! this._$jscoverage) {
  this._$jscoverage = {};
}
if (! _$jscoverage['/sequence-expression.js']) {
  _$jscoverage['/sequence-expression.js'] = {};
  _$jscoverage['/sequence-expression.js'].lineData = [];
  _$jscoverage['/sequence-expression.js'].lineData[1] = 0;
  _$jscoverage['/sequence-expression.js'].lineData[2] = 0;
}
if (! _$jscoverage['/sequence-expression.js'].functionData) {
  _$jscoverage['/sequence-expression.js'].functionData = [];
}
if (! _$jscoverage['/sequence-expression.js'].branchData) {
  _$jscoverage['/sequence-expression.js'].branchData = {};
  _$jscoverage['/sequence-expression.js'].branchData['1'] = [];
  _$jscoverage['/sequence-expression.js'].branchData['1'][1] = new BranchData();
  _$jscoverage['/sequence-expression.js'].branchData['2'] = [];
  _$jscoverage['/sequence-expression.js'].branchData['2'][1] = new BranchData();
  _$jscoverage['/sequence-expression.js'].branchData['2'][2] = new BranchData();
  _$jscoverage['/sequence-expression.js'].branchData['2'][3] = new BranchData();
  _$jscoverage['/sequence-expression.js'].branchData['2'][4] = new BranchData();
  _$jscoverage['/sequence-expression.js'].branchData['2'][5] = new BranchData();
  _$jscoverage['/sequence-expression.js'].branchData['2'][6] = new BranchData();
}
_$jscoverage['/sequence-expression.js'].branchData['2'][6].init(5, 7, 'l !== f');
function visit29_2_6(result) {
  _$jscoverage['/sequence-expression.js'].branchData['2'][6].ranCondition(result);
  return result;
}_$jscoverage['/sequence-expression.js'].branchData['2'][5].init(12, 12, 'visit26_2_3(l !== f) && l');
function visit28_2_5(result) {
  _$jscoverage['/sequence-expression.js'].branchData['2'][5].ranCondition(result);
  return result;
}_$jscoverage['/sequence-expression.js'].branchData['2'][4].init(16, 28, 'w && (u = visit25_2_2(visit26_2_3(l !== f) && l) , i = n)');
function visit27_2_4(result) {
  _$jscoverage['/sequence-expression.js'].branchData['2'][4].ranCondition(result);
  return result;
}_$jscoverage['/sequence-expression.js'].branchData['2'][3].init(24, 7, 'l !== f');
function visit26_2_3(result) {
  _$jscoverage['/sequence-expression.js'].branchData['2'][3].ranCondition(result);
  return result;
}_$jscoverage['/sequence-expression.js'].branchData['2'][2].init(24, 12, 'l !== f && l');
function visit25_2_2(result) {
  _$jscoverage['/sequence-expression.js'].branchData['2'][2].ranCondition(result);
  return result;
}_$jscoverage['/sequence-expression.js'].branchData['2'][1].init(16, 28, 'w && (u = l !== f && l , i = n)');
function visit24_2_1(result) {
  _$jscoverage['/sequence-expression.js'].branchData['2'][1].ranCondition(result);
  return result;
}_$jscoverage['/sequence-expression.js'].branchData['1'][1].init(2, 6, 'i = 1 , !u');
function visit23_1_1(result) {
  _$jscoverage['/sequence-expression.js'].branchData['1'][1].ranCondition(result);
  return result;
}_$jscoverage['/sequence-expression.js'].lineData[1]++;
if (visit23_1_1((i = 1 , !u))) {
}
_$jscoverage['/sequence-expression.js'].lineData[2]++;
for (w && (u = visit25_2_2(visit28_2_5(visit26_2_3(visit29_2_6(l !== f)) && l)) , i = n); visit24_2_1(visit27_2_4(w && (u = visit25_2_2(visit28_2_5(visit26_2_3(visit29_2_6(l !== f)) && l)) , i = n))); i++) {
}
