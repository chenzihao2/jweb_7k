"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const QUEUE_START = Symbol.for('QUEUE_START');
class DoubleLinkedNode {
    constructor(val, pre = null, next = null) {
        this.val = val;
        this.next = next;
        this.pre = pre;
    }
}
exports.DoubleLinkedNode = DoubleLinkedNode;
class DoubleLinkedQueue {
    constructor() {
        // aim to reduce judgement when push and pop
        this.$head = new DoubleLinkedNode(QUEUE_START, null);
        this.$tail = this.$head;
        this.$length = 0;
    }
    // push a node to the tail
    push(n) {
        let node = new DoubleLinkedNode(n, this.$tail);
        this.$tail.next = node;
        this.$tail = node;
        this.$length++;
        return node;
    }
    // pop a node from the head
    pop() {
        let temp = this.$head.next;
        this.$head.next = temp.next;
        this.$length--;
        if (temp === this.$tail) {
            this.$tail = this.$head;
        }
        else {
            temp.next.pre = this.$head;
        }
        return temp;
    }
    head() {
        return this.$head.next;
    }
    tail() {
        return this.$tail;
    }
    length() {
        return this.$length;
    }
    erase(node) {
        let preNode = node.pre;
        preNode.next = node.next;
        node.next.pre = preNode;
        this.$length--;
    }
    empty() {
        return (this.$tail.val === Symbol.for('QUEUE_START'));
    }
    forEach(fn) {
        let temp = this.$head.next;
        while (temp !== null) {
            fn(temp.val);
            temp = temp.next;
        }
    }
}
exports.DoubleLinkedQueue = DoubleLinkedQueue;
