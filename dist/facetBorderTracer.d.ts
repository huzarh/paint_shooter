import { FacetResult } from "./facetmanagement";
export declare class FacetBorderTracer {
    /**
     *  Traces the border path of the facet from the facet border points.
     *  Imagine placing walls around the outer side of the border points.
     */
    static buildFacetBorderPaths(facetResult: FacetResult, onUpdate?: ((progress: number) => void) | null): Promise<void>;
    /**
     * Returns a border path starting from the given point
     */
    private static getPath;
    /**
     * Add a point to the border path and ensure the correct xWall/yWalls is set
     */
    private static addPointToPath;
}
