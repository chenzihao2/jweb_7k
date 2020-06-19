"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const linked_queue_1 = require("../utils/linked_queue");
class Entry {
    constructor(node, value, length, now, maxAge) {
        this.node = node;
        this.value = value;
        this.length = length;
        this.now = now;
        this.maxAge = maxAge;
    }
}
class LRUCache {
    constructor(options) {
        this.cacheQueue = new linked_queue_1.DoubleLinkedQueue();
        this.cacheMap = {};
        this.MAX_CACHE_SIZE = 1024 * 1024 * 300;
        this.tempCacheSize = 0;
        this.MAX_CACHE_SIZE = options.max_cache_size || 1024 * 1024 * 300;
        this.EXPIRE_TIME = options.expire || 1000 * 60;
    }
    static create(options) {
        if (!LRUCache.ins) {
            LRUCache.ins = new LRUCache(options);
            return LRUCache.ins;
        }
        return LRUCache.ins;
    }
    static getIns() {
        return LRUCache.ins;
    }
    set(key, val, expire) {
        // console.log('insert %s => %s', key, val)
        let expire_time = expire || this.EXPIRE_TIME;
        let buffer = Buffer.from(val);
        this.tempCacheSize += buffer.length;
        if (this.tempCacheSize >= this.MAX_CACHE_SIZE) {
            this.del();
            while (this.tempCacheSize >= this.MAX_CACHE_SIZE) {
                this.del();
            }
        }
        let node = this.cacheQueue.push(key);
        let entry = new Entry(node, buffer, buffer.length, Date.now(), expire_time);
        this.cacheMap[key] = entry;
    }
    /**
     * release the least recently used cache entry
     */
    del() {
        let key = this.cacheQueue.pop().val;
        // console.log('del', key)
        let cacheEntry = this.cacheMap[key];
        if (!cacheEntry) {
            return false;
        }
        this.tempCacheSize -= cacheEntry.length;
        delete this.cacheMap[key];
        return true;
    }
    get(key) {
        if (this.isStale(key)) {
            this.releaseBeforeKey(key);
            return '';
        }
        else {
            let entry = this.cacheMap[key];
            // move the entry to the tail of the queue, which means the latest
            if (entry.node !== this.cacheQueue.tail()) {
                this.cacheQueue.erase(entry.node);
                entry.node = this.cacheQueue.push(key);
            }
            return entry.value.toString();
        }
    }
    reset() {
        while (!this.cacheQueue.empty()) {
            this.del();
        }
    }
    isStale(key) {
        let cacheEntry = this.cacheMap[key];
        if (!cacheEntry) {
            return true;
        }
        let diff = Date.now() - cacheEntry.now;
        if (diff > cacheEntry.maxAge) {
            return true;
        }
        return false;
    }
    releaseBeforeKey(key) {
        if (!this.cacheMap[key]) {
            return;
        }
        while (this.cacheQueue.head().val !== key) {
            let k = this.cacheQueue.pop().val;
            this.tempCacheSize -= this.cacheMap[k].length;
            delete this.cacheMap[k];
        }
        let k = this.cacheQueue.pop().val;
        this.tempCacheSize -= this.cacheMap[k].length;
        delete this.cacheMap[k];
    }
}
exports.default = LRUCache;
LRUCache.ins = null;
