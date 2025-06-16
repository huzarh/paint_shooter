export interface IComparable {
    compareTo(other: IComparable): number;
}
export interface IHashable {
    getKey(): string;
}
export interface IHeapItem extends IComparable, IHashable {
}
export declare class Map<TValue> {
    private obj;
    constructor();
    containsKey(key: string): boolean;
    getKeys(): string[];
    get(key: string): TValue | null;
    put(key: string, value: TValue): void;
    remove(key: string): void;
    clone(): Map<TValue>;
}
export declare class PriorityQueue<T extends IHeapItem> {
    private heap;
    enqueue(obj: T): void;
    peek(): T;
    updatePriority(key: T): void;
    get(key: string): T | null;
    get size(): number;
    dequeue(): T;
    dump(): void;
    contains(key: string): boolean;
    removeWhere(predicate: (el: T) => boolean): void;
    foreach(func: (el: T) => void): void;
    clone(): PriorityQueue<T>;
}
