"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Random = void 0;
class Random {
    constructor(seed) {
        if (typeof seed === "undefined") {
            this.seed = new Date().getTime();
        }
        else {
            this.seed = seed;
        }
    }
    next() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
}
exports.Random = Random;
