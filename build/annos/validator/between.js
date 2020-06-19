"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jbean_1 = require("jbean");
const utils_1 = require("../../utils");
function Between(min, max, message) {
    return jbean_1.annotationHelper(arguments, callback);
}
exports.default = Between;
const callback = function (annoType, target, field, min, max, message) {
    jbean_1.BeanFactory.addBeanMeta(annoType, target, field, Between, [min, max, message]);
};
Between.validate = function (field, val, params, val0, fieldType) {
    let [min, max, message] = params;
    let err = null;
    if (val < min || val > max) {
        err = getMessage(field, val, params);
    }
    return {
        err: err,
        val: val
    };
};
const getMessage = function (field, val, params) {
    let [min, max, message] = params;
    if (!message) {
        message = 'the value of $field must between $min and $max';
    }
    return utils_1.format(message, { field, min, max, val });
};
