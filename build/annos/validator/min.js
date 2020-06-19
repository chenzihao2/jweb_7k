"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jbean_1 = require("jbean");
const utils_1 = require("../../utils");
function Min(min, message) {
    return jbean_1.annotationHelper(arguments, callback);
}
exports.default = Min;
const callback = function (annoType, target, field, min, message) {
    jbean_1.BeanFactory.addBeanMeta(annoType, target, field, Min, [min, message]);
};
Min.validate = function (field, val, params, val0, fieldType) {
    let [min, message] = params;
    let err = null;
    if (val < min) {
        err = getMessage(field, val, params);
    }
    return {
        err,
        val: val
    };
};
const getMessage = function (field, val, params) {
    let [min, message] = params;
    if (!message) {
        message = 'the value of $field must be greater than $min';
    }
    return utils_1.format(message, { field, min, val });
};
