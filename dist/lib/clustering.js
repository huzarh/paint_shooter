"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KMeans = exports.Vector = void 0;
class Vector {
    constructor(values, weight = 1) {
        this.values = values;
        this.weight = weight;
    }
    distanceTo(p) {
        let sumSquares = 0;
        for (let i = 0; i < this.values.length; i++) {
            sumSquares += (p.values[i] - this.values[i]) * (p.values[i] - this.values[i]);
        }
        return Math.sqrt(sumSquares);
    }
    /**
     *  Calculates the weighted average of the given points
     */
    static average(pts) {
        if (pts.length === 0) {
            throw Error("Can't average 0 elements");
        }
        const dims = pts[0].values.length;
        const values = [];
        for (let i = 0; i < dims; i++) {
            values.push(0);
        }
        let weightSum = 0;
        for (const p of pts) {
            weightSum += p.weight;
            for (let i = 0; i < dims; i++) {
                values[i] += p.weight * p.values[i];
            }
        }
        for (let i = 0; i < values.length; i++) {
            values[i] /= weightSum;
        }
        return new Vector(values);
    }
}
exports.Vector = Vector;
class KMeans {
    constructor(points, k, random, centroids = null) {
        this.points = points;
        this.k = k;
        this.random = random;
        this.currentIteration = 0;
        this.pointsPerCategory = [];
        this.centroids = [];
        this.currentDeltaDistanceDifference = 0;
        if (centroids != null) {
            this.centroids = centroids;
            for (let i = 0; i < this.k; i++) {
                this.pointsPerCategory.push([]);
            }
        }
        else {
            this.initCentroids();
        }
    }
    initCentroids() {
        for (let i = 0; i < this.k; i++) {
            this.centroids.push(this.points[Math.floor(this.points.length * this.random.next())]);
            this.pointsPerCategory.push([]);
        }
    }
    step() {
        // clear category
        for (let i = 0; i < this.k; i++) {
            this.pointsPerCategory[i] = [];
        }
        // calculate points per centroid
        for (const p of this.points) {
            let minDist = Number.MAX_VALUE;
            let centroidIndex = -1;
            for (let k = 0; k < this.k; k++) {
                const dist = this.centroids[k].distanceTo(p);
                if (dist < minDist) {
                    centroidIndex = k;
                    minDist = dist;
                }
            }
            this.pointsPerCategory[centroidIndex].push(p);
        }
        let totalDistanceDiff = 0;
        // adjust centroids
        for (let k = 0; k < this.pointsPerCategory.length; k++) {
            const cat = this.pointsPerCategory[k];
            if (cat.length > 0) {
                const avg = Vector.average(cat);
                const dist = this.centroids[k].distanceTo(avg);
                totalDistanceDiff += dist;
                this.centroids[k] = avg;
            }
        }
        this.currentDeltaDistanceDifference = totalDistanceDiff;
        this.currentIteration++;
    }
}
exports.KMeans = KMeans;
