"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jbean_1 = require("jbean");
const LRUCache_1 = require("../cache/LRUCache");
const application_1 = require("../application");
function Cache(expire) {
    return jbean_1.annotationHelper(arguments, callback);
}
exports.default = Cache;
const callback = function (annoType, ctor, field, descriptor, expire) {
    jbean_1.BeanFactory.addBeanMeta(annoType, ctor, field, Cache, [expire], null, retHook);
};
jbean_1.BeanFactory.registerStartBean(() => {
    let application = application_1.default.getIns();
    const configNS = application.configNS;
    const applicationConfigs = application.applicationConfigs;
    if (!applicationConfigs ||
        !applicationConfigs[configNS] ||
        !applicationConfigs[configNS].cache) {
        LRUCache_1.default.create({});
        return;
    }
    const cacheConfigs = applicationConfigs[configNS].cache;
    let max_cache_size = cacheConfigs.maxCacheSize || undefined;
    let expire = cacheConfigs.expire || undefined;
    if (max_cache_size) {
        max_cache_size = Number.parseInt(max_cache_size, 10);
    }
    if (expire) {
        expire = Number.parseInt(expire, 10);
    }
    LRUCache_1.default.create({
        max_cache_size,
        expire
    });
});
// function setCache(url: string, val: string, expire?: number) {
//   LRUCache.getIns().set(url, val, expire)
// }
// function getCache(url: string):string {
//   return LRUCache.getIns().get(url)
// }
function retHook(ret, expire, request, response) {
    if (ret.err) {
        return;
    }
    let lruCache = LRUCache_1.default.getIns();
    lruCache.set(request.url.href, ret.data, expire);
}
Cache.preCall = function (ret, expire, request, response) {
    if (ret.err) {
        return ret;
    }
    let cache = LRUCache_1.default.getIns().get(request.url.href);
    if (cache) {
        response.writeAndFlush(cache);
        return null;
    }
};
