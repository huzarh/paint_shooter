"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BooleanArray2D = exports.Uint8Array2D = exports.Uint32Array2D = void 0;
class Uint32Array2D {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.arr = new Uint32Array(width * height);
    }
    get(x, y) {
        return this.arr[y * this.width + x];
    }
    set(x, y, value) {
        this.arr[y * this.width + x] = value;
    }
}
exports.Uint32Array2D = Uint32Array2D;
class Uint8Array2D {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.arr = new Uint8Array(width * height);
    }
    get(x, y) {
        return this.arr[y * this.width + x];
    }
    set(x, y, value) {
        this.arr[y * this.width + x] = value;
    }
    matchAllAround(x, y, value) {
        const idx = y * this.width + x;
        return (x - 1 >= 0 && this.arr[idx - 1] === value) &&
            (y - 1 >= 0 && this.arr[idx - this.width] === value) &&
            (x + 1 < this.width && this.arr[idx + 1] === value) &&
            (y + 1 < this.height && this.arr[idx + this.width] === value);
    }
}
exports.Uint8Array2D = Uint8Array2D;
class BooleanArray2D {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.arr = new Uint8Array(width * height);
    }
    get(x, y) {
        return this.arr[y * this.width + x] !== 0;
    }
    set(x, y, value) {
        this.arr[y * this.width + x] = value ? 1 : 0;
    }
}
exports.BooleanArray2D = BooleanArray2D;
