"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pathToRegexp = require("path-to-regexp");
const staticPaths = {};
class Route {
    static dispatch(req, res) {
    }
    static add(method, path, handler, options) {
        console.log(path, method);
        pathToRegexp(path, []);
    }
}
exports.default = Route;
