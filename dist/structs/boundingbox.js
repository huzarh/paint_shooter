"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoundingBox = void 0;
class BoundingBox {
    constructor() {
        this.minX = Number.MAX_VALUE;
        this.minY = Number.MAX_VALUE;
        this.maxX = Number.MIN_VALUE;
        this.maxY = Number.MIN_VALUE;
    }
    get width() {
        return this.maxX - this.minX + 1;
    }
    get height() {
        return this.maxY - this.minY + 1;
    }
}
exports.BoundingBox = BoundingBox;
