"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityQueue = exports.Map = void 0;
class Map {
    constructor() {
        this.obj = {};
    }
    containsKey(key) {
        return key in this.obj;
    }
    getKeys() {
        const keys = [];
        for (const el in this.obj) {
            if (this.obj.hasOwnProperty(el)) {
                keys.push(el);
            }
        }
        return keys;
    }
    get(key) {
        const o = this.obj[key];
        if (typeof o === "undefined") {
            return null;
        }
        else {
            return o;
        }
    }
    put(key, value) {
        this.obj[key] = value;
    }
    remove(key) {
        delete this.obj[key];
    }
    clone() {
        const m = new Map();
        m.obj = {};
        for (const p in this.obj) {
            m.obj[p] = this.obj[p];
        }
        return m;
    }
}
exports.Map = Map;
class Heap {
    constructor() {
        this.array = [];
        this.keyMap = new Map();
    }
    add(obj) {
        if (this.keyMap.containsKey(obj.getKey())) {
            throw new Error("Item with key " + obj.getKey() + " already exists in the heap");
        }
        this.array.push(obj);
        this.keyMap.put(obj.getKey(), this.array.length - 1);
        this.checkParentRequirement(this.array.length - 1);
    }
    replaceAt(idx, newobj) {
        this.array[idx] = newobj;
        this.keyMap.put(newobj.getKey(), idx);
        this.checkParentRequirement(idx);
        this.checkChildrenRequirement(idx);
    }
    shift() {
        return this.removeAt(0);
    }
    remove(obj) {
        const idx = this.keyMap.get(obj.getKey());
        if (idx === -1) {
            return;
        }
        this.removeAt(idx);
    }
    removeWhere(predicate) {
        const itemsToRemove = [];
        for (let i = this.array.length - 1; i >= 0; i--) {
            if (predicate(this.array[i])) {
                itemsToRemove.push(this.array[i]);
            }
        }
        for (const el of itemsToRemove) {
            this.remove(el);
        }
        for (const el of this.array) {
            if (predicate(el)) {
                console.log("Idx of element not removed: " + this.keyMap.get(el.getKey()));
                throw new Error("element not removed: " + el.getKey());
            }
        }
    }
    removeAt(idx) {
        const obj = this.array[idx];
        this.keyMap.remove(obj.getKey());
        const isLastElement = idx === this.array.length - 1;
        if (this.array.length > 0) {
            const newobj = this.array.pop();
            if (!isLastElement && this.array.length > 0) {
                this.replaceAt(idx, newobj);
            }
        }
        return obj;
    }
    foreach(func) {
        const arr = this.array.sort((e, e2) => e.compareTo(e2));
        for (const el of arr) {
            func(el);
        }
    }
    peek() {
        return this.array[0];
    }
    contains(key) {
        return this.keyMap.containsKey(key);
    }
    at(key) {
        const obj = this.keyMap.get(key);
        if (typeof obj === "undefined") {
            return null;
        }
        else {
            return this.array[obj];
        }
    }
    size() {
        return this.array.length;
    }
    checkHeapRequirement(item) {
        const idx = this.keyMap.get(item.getKey());
        if (idx != null) {
            this.checkParentRequirement(idx);
            this.checkChildrenRequirement(idx);
        }
    }
    checkChildrenRequirement(idx) {
        let stop = false;
        while (!stop) {
            const left = this.getLeftChildIndex(idx);
            let right = left === -1 ? -1 : left + 1;
            if (left === -1) {
                return;
            }
            if (right >= this.size()) {
                right = -1;
            }
            let minIdx;
            if (right === -1) {
                minIdx = left;
            }
            else {
                minIdx = (this.array[left].compareTo(this.array[right]) < 0) ? left : right;
            }
            if (this.array[idx].compareTo(this.array[minIdx]) > 0) {
                this.swap(idx, minIdx);
                idx = minIdx; // iteratively instead of recursion for this.checkChildrenRequirement(minIdx);
            }
            else {
                stop = true;
            }
        }
    }
    checkParentRequirement(idx) {
        let curIdx = idx;
        let parentIdx = Heap.getParentIndex(curIdx);
        while (parentIdx >= 0 && this.array[parentIdx].compareTo(this.array[curIdx]) > 0) {
            this.swap(curIdx, parentIdx);
            curIdx = parentIdx;
            parentIdx = Heap.getParentIndex(curIdx);
        }
    }
    dump() {
        if (this.size() === 0) {
            return;
        }
        const idx = 0;
        const leftIdx = this.getLeftChildIndex(idx);
        const rightIdx = leftIdx + 1;
        console.log(this.array);
        console.log("--- keymap ---");
        console.log(this.keyMap);
    }
    swap(i, j) {
        this.keyMap.put(this.array[i].getKey(), j);
        this.keyMap.put(this.array[j].getKey(), i);
        const tmp = this.array[i];
        this.array[i] = this.array[j];
        this.array[j] = tmp;
    }
    getLeftChildIndex(curIdx) {
        const idx = ((curIdx + 1) * 2) - 1;
        if (idx >= this.array.length) {
            return -1;
        }
        else {
            return idx;
        }
    }
    static getParentIndex(curIdx) {
        if (curIdx === 0) {
            return -1;
        }
        return Math.floor((curIdx + 1) / 2) - 1;
    }
    clone() {
        const h = new Heap();
        h.array = this.array.slice(0);
        h.keyMap = this.keyMap.clone();
        return h;
    }
}
class PriorityQueue {
    constructor() {
        this.heap = new Heap();
    }
    enqueue(obj) {
        this.heap.add(obj);
    }
    peek() {
        return this.heap.peek();
    }
    updatePriority(key) {
        this.heap.checkHeapRequirement(key);
    }
    get(key) {
        return this.heap.at(key);
    }
    get size() {
        return this.heap.size();
    }
    dequeue() {
        return this.heap.shift();
    }
    dump() {
        this.heap.dump();
    }
    contains(key) {
        return this.heap.contains(key);
    }
    removeWhere(predicate) {
        this.heap.removeWhere(predicate);
    }
    foreach(func) {
        this.heap.foreach(func);
    }
    clone() {
        const p = new PriorityQueue();
        p.heap = this.heap.clone();
        return p;
    }
}
exports.PriorityQueue = PriorityQueue;
