import { FacetResult } from "./facetmanagement";
export declare class FacetLabelPlacer {
    /**
     *  Determines where to place the labels for each facet. This is done by calculating where
     *  in the polygon the largest circle can be contained, also called the pole of inaccessibility
     *  That's the spot where there will be the most room for the label.
     *  One tricky gotcha: neighbour facets can lay completely inside other facets and can overlap the label
     *  if only the outer border of the facet is taken in account. This is solved by adding the neighbours facet polygon that fall
     *  within the facet as additional polygon rings (why does everything look so easy to do yet never is under the hood :/)
     */
    static buildFacetLabelBounds(facetResult: FacetResult, onUpdate?: ((progress: number) => void) | null): Promise<void>;
    /**
     *  Checks whether a neighbour border path is fully within the current facet border path
     */
    private static doesNeighbourFallInsideInCurrentFacet;
}
