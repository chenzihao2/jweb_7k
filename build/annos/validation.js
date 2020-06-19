"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jbean_1 = require("jbean");
var ValidationMode;
(function (ValidationMode) {
    ValidationMode[ValidationMode["params"] = 0] = "params";
    ValidationMode[ValidationMode["entity"] = 1] = "entity"; // validation based on entity property
})(ValidationMode = exports.ValidationMode || (exports.ValidationMode = {}));
const validationMode4Entities = {};
function ValidationScene(...scenes) {
    return jbean_1.annotationHelper(arguments, sceneCallback);
}
exports.ValidationScene = ValidationScene;
const sceneCallback = function (annoType, target, field, ...scenes) {
    if (!scenes || scenes.length < 1) {
        return;
    }
    const ctorId = target.constructor[jbean_1.CTOR_ID];
    if (typeof validationMode4Entities[ctorId] === 'undefined') {
        validationMode4Entities[ctorId] = {};
    }
    scenes.forEach(scene => {
        scene = 's_' + scene;
        if (typeof validationMode4Entities[ctorId][scene] === 'undefined') {
            validationMode4Entities[ctorId][scene] = [];
        }
        validationMode4Entities[ctorId][scene].push(field);
    });
};
function Validation(entityClz, mode) {
    return jbean_1.annotationHelper(arguments, callback, true);
}
exports.default = Validation;
const callback = function (annoType, target, method, descriptor, entityClz, mode) {
    jbean_1.BeanFactory.addBeanMeta(jbean_1.AnnotationType.method, target, method, Validation, [entityClz, mode]);
};
Validation.preCall = function (ret, entityClz, mode, req, res) {
    if (ret && ret.err) {
        return ret;
    }
    const params = Object.assign({}, req.params, req.query, req.payload);
    const entity = new entityClz();
    let fields = Object.getOwnPropertyNames(entity);
    if (!fields || fields.length < 1) {
        return;
    }
    let sceneFields = null;
    if (mode === undefined || mode === ValidationMode.params) {
        sceneFields = Object.keys(params);
    }
    else if (mode === ValidationMode.entity) {
        sceneFields = fields;
    }
    else if (typeof mode === 'string') {
        const ctorId = entityClz[jbean_1.CTOR_ID];
        const scene = 's_' + mode;
        if (validationMode4Entities[ctorId] && validationMode4Entities[ctorId][scene]) {
            sceneFields = validationMode4Entities[ctorId][scene];
        }
    }
    if (!sceneFields || sceneFields.length < 1) {
        return {
            err: new jbean_1.BusinessException('validate field is empty', -1)
        };
    }
    if (mode !== ValidationMode.entity) {
        fields = fields.filter(field => {
            return sceneFields.indexOf(field) >= 0;
        });
    }
    let beanMeta = jbean_1.BeanFactory.getBeanMeta(entity.constructor);
    let fieldAnnos = beanMeta.fieldAnnos;
    let fieldType = beanMeta.fieldType;
    let err0 = null;
    let fieldLen = fields.length;
    for (let i = 0; i < fieldLen; i++) {
        const field = fields[i];
        if (typeof fieldAnnos[field] === 'undefined') {
            entity[field] = jbean_1.strTo(fieldType[field], params[field]);
            continue;
        }
        let val0 = jbean_1.strTo(fieldType[field], params[field]);
        let validators = fieldAnnos[field];
        let validatorLen = validators.length;
        for (let j = 0; j < validatorLen; j++) {
            let [validator, validatorParams] = validators[j];
            if (!validator.validate) {
                continue;
            }
            let { err, val } = validator.validate(field, val0, validatorParams, params[field], fieldType[field]);
            entity[field] = val;
            if (err) {
                err0 = err0 || {};
                err0[field] = err;
                break;
            }
        }
    }
    if (!err0) {
        req.entity = entity;
    }
    else {
        return {
            err: new jbean_1.BusinessException('validate failed', -2, err0)
        };
    }
};
