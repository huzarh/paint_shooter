/**
 * Module that provides function the GUI uses and updates the DOM accordingly
 */
import { Settings } from "./settings";
export declare function time(name: string): void;
export declare function timeEnd(name: string): void;
export declare function log(str: string): void;
export declare function parseSettings(): Settings;
export declare function process(): Promise<void>;
export declare function updateOutput(): Promise<void>;
export declare function downloadPalettePng(): void;
export declare function downloadPNG(): void;
export declare function downloadSVG(): void;
export declare function loadExample(imgId: string): void;
