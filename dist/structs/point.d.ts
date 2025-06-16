export declare class Point {
    x: number;
    y: number;
    constructor(x: number, y: number);
    distanceTo(pt: Point): number;
    distanceToCoord(x: number, y: number): number;
}
