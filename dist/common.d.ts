export type RGB = number[];
export interface IMap<T> {
    [key: string]: T;
}
export declare function delay(ms: number): Promise<unknown>;
export declare class CancellationToken {
    isCancelled: boolean;
}
