"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jbean_1 = require("jbean");
const utils_1 = require("../../utils");
function Max(max, message) {
    return jbean_1.annotationHelper(arguments, callback);
}
exports.default = Max;
const callback = function (annoType, target, field, max, message) {
    jbean_1.BeanFactory.addBeanMeta(annoType, target, field, Max, [max, message]);
};
Max.validate = function (field, val, params, val0, fieldType) {
    let [max, message] = params;
    let err = null;
    if (val > max) {
        err = getMessage(field, val, params);
    }
    return {
        err,
        val: val
    };
};
const getMessage = function (field, val, params) {
    let [max, message] = params;
    if (!message) {
        message = 'the value of $field must be smaller than $max';
    }
    return utils_1.format(message, { field, max, val });
};
