export declare class Uint32Array2D {
    private width;
    private height;
    private arr;
    constructor(width: number, height: number);
    get(x: number, y: number): number;
    set(x: number, y: number, value: number): void;
}
export declare class Uint8Array2D {
    private width;
    private height;
    private arr;
    constructor(width: number, height: number);
    get(x: number, y: number): number;
    set(x: number, y: number, value: number): void;
    matchAllAround(x: number, y: number, value: number): boolean;
}
export declare class BooleanArray2D {
    private width;
    private height;
    private arr;
    constructor(width: number, height: number);
    get(x: number, y: number): boolean;
    set(x: number, y: number, value: boolean): void;
}
