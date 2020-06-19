"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jbean_1 = require("jbean");
function xmlEncode(ret) {
    let xmlContent = [];
    switch (jbean_1.getObjectType(ret)) {
        case 'map':
            ret.forEach((value, key) => {
                if (jbean_1.getObjectType(value) === 'object') {
                    let res = xmlEncode(value);
                    xmlContent.push('<' + key + '>' + res + '</' + key + '>');
                }
                else {
                    xmlContent.push('<' + key + '>' + value + '</' + key + '>');
                }
            });
            break;
        case 'object':
            let key;
            for (key in ret) {
                if (jbean_1.getObjectType(ret[key]) === 'object') {
                    let res = xmlEncode(ret[key]);
                    xmlContent.push('<' + key + '>' + res + '</' + key + '>');
                }
                else {
                    xmlContent.push('<' + key + '>' + ret[key] + '</' + key + '>');
                }
            }
            break;
        default:
            xmlContent = ret;
    }
    return xmlContent.join('');
}
exports.xmlEncode = xmlEncode;
function jsonEncode(ret) {
    let type = jbean_1.getObjectType(ret);
    if (type === 'string') {
        return ret;
    }
    else if (type === 'map') {
        let obj = Object.create(null);
        for (let [k, v] of ret) {
            obj[k] = v;
        }
        ret = obj;
    }
    return JSON.stringify(ret);
}
exports.jsonEncode = jsonEncode;
