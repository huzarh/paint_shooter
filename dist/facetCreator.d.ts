import { BooleanArray2D, Uint8Array2D } from "./structs/typedarrays";
import { FacetResult, Facet } from "./facetmanagement";
export declare class FacetCreator {
    /**
     *  Constructs the facets with its border points for each area of pixels of the same color
     */
    static getFacets(width: number, height: number, imgColorIndices: Uint8Array2D, onUpdate?: ((progress: number) => void) | null): Promise<FacetResult>;
    /**
     *  Builds a facet at given x,y using depth first search to visit all pixels of the same color
     */
    static buildFacet(facetIndex: number, facetColorIndex: number, x: number, y: number, visited: BooleanArray2D, imgColorIndices: Uint8Array2D, facetResult: FacetResult): Facet;
    /**
     * Check which neighbour facets the given facet has by checking the neighbour facets at each border point
     */
    static buildFacetNeighbour(facet: Facet, facetResult: FacetResult): void;
}
