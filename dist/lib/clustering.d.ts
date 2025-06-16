import { Random } from "../random";
export declare class Vector {
    values: number[];
    weight: number;
    tag: any;
    constructor(values: number[], weight?: number);
    distanceTo(p: Vector): number;
    /**
     *  Calculates the weighted average of the given points
     */
    static average(pts: Vector[]): Vector;
}
export declare class KMeans {
    private points;
    k: number;
    private random;
    currentIteration: number;
    pointsPerCategory: Vector[][];
    centroids: Vector[];
    currentDeltaDistanceDifference: number;
    constructor(points: Vector[], k: number, random: Random, centroids?: Vector[] | null);
    private initCentroids;
    step(): void;
}
