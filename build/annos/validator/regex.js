"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jbean_1 = require("jbean");
const utils_1 = require("../../utils");
function Regex(tester, message) {
    if (!tester) {
        throw new Error('the tester (' + tester + ') of Regex is not valid');
    }
    return jbean_1.annotationHelper(arguments, callback);
}
exports.default = Regex;
const callback = function (annoType, target, field, tester, message) {
    jbean_1.BeanFactory.addBeanMeta(annoType, target, field, Regex, [tester, message]);
};
Regex.validate = function (field, val, params, val0, fieldType) {
    let [tester, message] = params;
    let err = null;
    if (!val || typeof val !== 'string' || !val.match(new RegExp(tester))) {
        err = getMessage(field, val, params);
    }
    return {
        err: err,
        val: val
    };
};
const getMessage = function (field, val, params) {
    let [tester, message] = params;
    if (!message) {
        message = '$val is not valid';
    }
    return utils_1.format(message, { val });
};
