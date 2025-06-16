import { RGB } from "./common";
export declare enum ClusteringColorSpace {
    RGB = 0,
    HSL = 1,
    LAB = 2
}
export declare class Settings {
    kMeansNrOfClusters: number;
    kMeansMinDeltaDifference: number;
    kMeansClusteringColorSpace: ClusteringColorSpace;
    kMeansColorRestrictions: Array<RGB | string>;
    colorAliases: {
        [key: string]: RGB;
    };
    narrowPixelStripCleanupRuns: number;
    removeFacetsSmallerThanNrOfPoints: number;
    removeFacetsFromLargeToSmall: boolean;
    maximumNumberOfFacets: number;
    nrOfTimesToHalveBorderSegments: number;
    resizeImageIfTooLarge: boolean;
    resizeImageWidth: number;
    resizeImageHeight: number;
    randomSeed: number;
}
