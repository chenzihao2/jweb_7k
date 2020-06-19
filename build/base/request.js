"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reqres_1 = require("./reqres");
class Request extends reqres_1.default {
    // constructor (request: Hapi.Request, response: Hapi.ResponseToolkit, resolve: any, reject: any) {
    constructor(request, response) {
        super();
        this.url = request.url;
        this.path = request.path;
        this.payload = request.payload;
        this.query = request.query;
        this.params = request.params;
        this.paramsArray = request.paramsArray;
        this.headers = request.headers;
        this.cookies = request.state;
        this.request = request;
        this.response = response;
    }
    getParam(key, defaultValue) {
        if (this.params && typeof this.params[key] !== 'undefined') {
            return this.params[key];
        }
        if (this.query && typeof this.query[key] !== 'undefined') {
            return this.query[key];
        }
        if (this.payload && typeof this.payload[key] !== 'undefined') {
            return this.payload[key];
        }
        return defaultValue || null;
    }
    getNum(key, defaultValue) {
        const val = this.getParam(key, defaultValue);
        if (val === null) {
            return defaultValue || null;
        }
        if (!val) {
            return 0;
        }
        return val - 0;
    }
    getString(key, defaultValue) {
        const val = this.getParam(key, defaultValue);
        if (val === null) {
            return defaultValue || null;
        }
        return String(val);
    }
    getBool(key, defaultValue) {
        const val = this.getParam(key, defaultValue);
        if (val === null) {
            return defaultValue || null;
        }
        return Boolean(val);
    }
}
exports.default = Request;
