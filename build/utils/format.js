"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jbean_1 = require("jbean");
const util = require("util");
function format(template, params, delimiter) {
    if (!params || !template) {
        return template;
    }
    let type = jbean_1.getObjectType(params);
    if (type === 'object') {
        delimiter = delimiter || '$';
        Object.keys(params).forEach(key => {
            template = template.replace(new RegExp('\\' + delimiter + key, "g"), params[key]);
        });
    }
    else if (type === 'array') {
        template = util.format(template, ...params);
    }
    else {
        template = util.format(template, params);
    }
    return template;
}
exports.format = format;
