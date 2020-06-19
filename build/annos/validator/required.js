"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jbean_1 = require("jbean");
const utils_1 = require("../../utils");
function Required(message, options) {
    return jbean_1.annotationHelper(arguments, callback);
}
exports.default = Required;
const callback = function (annoType, target, field, message) {
    jbean_1.BeanFactory.addBeanMeta(annoType, target, field, Required, [message]);
};
Required.validate = function (field, val, params, val0, fieldType) {
    let err = null;
    if (val === null || val === undefined || val === '') {
        err = getMessage(field, val, params);
    }
    return {
        err,
        val: val
    };
};
const getMessage = function (field, val, params) {
    let [message] = params;
    if (!message) {
        message = 'key $field is required';
    }
    return utils_1.format(message, { field, val });
};
