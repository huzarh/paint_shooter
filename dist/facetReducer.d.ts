import { RGB } from "./common";
import { FacetResult } from "./facetmanagement";
import { Uint8Array2D } from "./structs/typedarrays";
export declare class FacetReducer {
    /**
     *  Remove all facets that have a pointCount smaller than the given number.
     */
    static reduceFacets(smallerThan: number, removeFacetsFromLargeToSmall: boolean, maximumNumberOfFacets: number, colorsByIndex: RGB[], facetResult: FacetResult, imgColorIndices: Uint8Array2D, onUpdate?: ((progress: number) => void) | null): Promise<void>;
    /**
     * Deletes a facet. All points belonging to the facet are moved to the nearest neighbour facet
     * based on the distance of the neighbour border points. This results in a voronoi like filling in of the
     * void the deletion made
     */
    private static deleteFacet;
    private static rebuildForFacetChange;
    /**
     * Determines the closest neighbour for a given pixel of a facet, based on the closest distance to the neighbour AND the when tied, the closest color
     */
    private static getClosestNeighbourForPixel;
    /**
     *  Rebuilds the given changed facets
     */
    private static rebuildChangedNeighbourFacets;
}
