"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jbean_1 = require("jbean");
const PrimaryTypes = ['boolean', 'number', 'string'];
class ReqRes {
    constructor() {
    }
    append(data) {
        if (data === null || data === undefined) {
            return;
        }
        if (this.data === null || this.data === undefined) {
            this.data = data;
        }
        else {
            let dataType = typeof data;
            if (Array.isArray(data)) {
                this.data = this.data.concat(data);
            }
            else if (PrimaryTypes.indexOf(dataType) >= 0) {
                this.data = data;
            }
            else {
                jbean_1.merge(this.data, data);
            }
        }
    }
    setData(data) {
        this.data = data;
    }
    getData(key) {
        if (key) {
            return this.data[key];
        }
        else {
            return this.data;
        }
    }
}
exports.default = ReqRes;
