"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./encoder"));
__export(require("./linked_queue"));
__export(require("./format"));
__export(require("./exec"));
function msleep(n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}
exports.msleep = msleep;
function sleep(n) {
    msleep(n * 1000);
}
exports.sleep = sleep;
