"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jbean_1 = require("jbean");
const utils_1 = require("../../utils");
const tester = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
function Email(message, options) {
    return jbean_1.annotationHelper(arguments, callback);
}
exports.default = Email;
const callback = function (annoType, target, field, message) {
    jbean_1.BeanFactory.addBeanMeta(annoType, target, field, Email, [message]);
};
Email.validate = function (field, val, params, val0, fieldType) {
    let [message] = params;
    let err = null;
    if (!val || typeof val !== 'string' || val.length > 254 || !tester.test(val)) {
        err = getMessage(field, val, params);
    }
    return {
        err: err,
        val: val
    };
};
const getMessage = function (field, val, params) {
    let [message] = params;
    if (!message) {
        message = '$val is not a valid email';
    }
    return utils_1.format(message, { val });
};
