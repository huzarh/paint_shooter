/**
 * Facet management from the process, anything from construction, reduction and border tracing etc.
 */
import { FacetBoundarySegment } from "./facetBorderSegmenter";
import { BoundingBox } from "./structs/boundingbox";
import { Point } from "./structs/point";
import { Uint32Array2D } from "./structs/typedarrays";
export declare enum OrientationEnum {
    Left = 0,
    Top = 1,
    Right = 2,
    Bottom = 3
}
/**
 * PathPoint is a point with an orientation that indicates which wall border is set
 */
export declare class PathPoint extends Point {
    orientation: OrientationEnum;
    constructor(pt: Point, orientation: OrientationEnum);
    getWallX(): number;
    getWallY(): number;
    getNeighbour(facetResult: FacetResult): number;
    toString(): string;
}
/**
 *  A facet that represents an area of pixels of the same color
 */
export declare class Facet {
    /**
     *  The id of the facet, is always the same as the actual index of the facet in the facet array
     */
    id: number;
    color: number;
    pointCount: number;
    borderPoints: Point[];
    neighbourFacets: number[] | null;
    /**
     * Flag indicating if the neighbourfacets array is dirty. If it is, the neighbourfacets *have* to be rebuild
     * Before it can be used. This is useful to defer the rebuilding of the array until it's actually needed
     * and can remove a lot of duplicate building of the array because multiple facets were hitting the same neighbour
     * (over 50% on test images)
     */
    neighbourFacetsIsDirty: boolean;
    bbox: BoundingBox;
    borderPath: PathPoint[];
    borderSegments: FacetBoundarySegment[];
    labelBounds: BoundingBox;
    getFullPathFromBorderSegments(useWalls: boolean): Point[];
}
/**
 *  Result of the facet construction, both as a map and as an array.
 *  Facets in the array can be null when they've been deleted
 */
export declare class FacetResult {
    facetMap: Uint32Array2D;
    facets: Array<Facet | null>;
    width: number;
    height: number;
}
