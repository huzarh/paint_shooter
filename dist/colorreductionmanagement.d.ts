/**
 * Color reduction management of the process: clustering to reduce colors & creating color map
 */
import { IMap, RGB } from "./common";
import { KMeans } from "./lib/clustering";
import { Settings } from "./settings";
import { Uint8Array2D } from "./structs/typedarrays";
export declare class ColorMapResult {
    imgColorIndices: Uint8Array2D;
    colorsByIndex: RGB[];
    width: number;
    height: number;
}
export declare class ColorReducer {
    /**
     *  Creates a map of the various colors used
     */
    static createColorMap(kmeansImgData: ImageData): ColorMapResult;
    /**
     *  Applies K-means clustering on the imgData to reduce the colors to
     *  k clusters and then output the result to the given outputImgData
     */
    static applyKMeansClustering(imgData: ImageData, outputImgData: ImageData, ctx: CanvasRenderingContext2D, settings: Settings, onUpdate?: ((kmeans: KMeans) => void) | null): Promise<void>;
    /**
     *  Updates the image data from the current kmeans centroids and their respective associated colors (vectors)
     */
    static updateKmeansOutputImageData(kmeans: KMeans, settings: Settings, pointsByColor: IMap<number[]>, imgData: ImageData, outputImgData: ImageData, restrictToSpecifiedColors: boolean): void;
    /**
     *  Builds a distance matrix for each color to each other
     */
    static buildColorDistanceMatrix(colorsByIndex: RGB[]): number[][];
    static processNarrowPixelStripCleanup(colormapResult: ColorMapResult): Promise<void>;
}
