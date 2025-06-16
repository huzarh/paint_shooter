import { FacetResult, PathPoint } from "./facetmanagement";
/**
 *  Path segment is a segment of a border path that is adjacent to a specific neighbour facet
 */
export declare class PathSegment {
    points: PathPoint[];
    neighbour: number;
    constructor(points: PathPoint[], neighbour: number);
}
/**
 * Facet boundary segment describes the matched segment that is shared between 2 facets
 * When 2 segments are matched, one will be the original segment and the other one is removed
 * This ensures that all facets share the same segments, but sometimes in reverse order to ensure
 * the correct continuity of its entire oborder path
 */
export declare class FacetBoundarySegment {
    originalSegment: PathSegment;
    neighbour: number;
    reverseOrder: boolean;
    constructor(originalSegment: PathSegment, neighbour: number, reverseOrder: boolean);
}
export declare class FacetBorderSegmenter {
    /**
     *  Builds border segments that are shared between facets
     *  While border paths are all nice and fancy, they are not linked to neighbour facets
     *  So any change in the paths makes a not so nice gap between the facets, which makes smoothing them out impossible
     */
    static buildFacetBorderSegments(facetResult: FacetResult, nrOfTimesToHalvePoints?: number, onUpdate?: ((progress: number) => void) | null): Promise<void>;
    /**
     *  Chops up the border paths per facet into segments adjacent tothe same neighbour
     */
    private static prepareSegmentsPerFacet;
    /**
     * Reduces each segment border path points
     */
    private static reduceSegmentComplexity;
    /**
     *  Remove the points by taking the average per pair and using that as a new point
     *  in the reduced segment. The delta values that create the Haar wavelet are not tracked
     *  because they are unneeded.
     */
    private static reduceSegmentHaarWavelet;
    private static isOutsideBorderPoint;
    private static calculateArea;
    /**
     *  Matches all segments with each other between facets and their neighbour
     *  A segment matches when the start and end match or the start matches with the end and vice versa
     *  (then the segment will need to be traversed in reverse order)
     */
    private static matchSegmentsWithNeighbours;
}
