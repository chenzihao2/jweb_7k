"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const querystring = require("querystring");
function httpParser(req, res, options) {
    const method = req.method.toLowerCase();
    const url = req.url || '/';
    const queryStartPos = url.indexOf('?');
    let path = url, queryParams = null;
    if (queryStartPos >= 0) {
        path = url.substr(0, queryStartPos);
        queryParams = querystring.decode(url.substr(queryStartPos + 1));
    }
    const host = req.headers.host;
    if (method === 'options') {
    }
}
exports.default = httpParser;
