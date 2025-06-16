"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacetLabelPlacer = void 0;
const common_1 = require("./common");
const polylabel_1 = require("./lib/polylabel");
const boundingbox_1 = require("./structs/boundingbox");
const facetCreator_1 = require("./facetCreator");
class FacetLabelPlacer {
    /**
     *  Determines where to place the labels for each facet. This is done by calculating where
     *  in the polygon the largest circle can be contained, also called the pole of inaccessibility
     *  That's the spot where there will be the most room for the label.
     *  One tricky gotcha: neighbour facets can lay completely inside other facets and can overlap the label
     *  if only the outer border of the facet is taken in account. This is solved by adding the neighbours facet polygon that fall
     *  within the facet as additional polygon rings (why does everything look so easy to do yet never is under the hood :/)
     */
    static buildFacetLabelBounds(facetResult_1) {
        return __awaiter(this, arguments, void 0, function* (facetResult, onUpdate = null) {
            let count = 0;
            for (const f of facetResult.facets) {
                if (f != null) {
                    const polyRings = [];
                    // get the border path from the segments (that can have been reduced compared to facet actual border path)
                    const borderPath = f.getFullPathFromBorderSegments(true);
                    // outer path must be first ring
                    polyRings.push(borderPath);
                    const onlyOuterRing = [borderPath];
                    // now add all the neighbours of the facet as "inner" rings,
                    // regardless if they are inner or not. These are seen as areas where the label
                    // cannot be placed
                    if (f.neighbourFacetsIsDirty) {
                        facetCreator_1.FacetCreator.buildFacetNeighbour(f, facetResult);
                    }
                    for (const neighbourIdx of f.neighbourFacets) {
                        const neighbourPath = facetResult.facets[neighbourIdx].getFullPathFromBorderSegments(true);
                        const fallsInside = FacetLabelPlacer.doesNeighbourFallInsideInCurrentFacet(neighbourPath, f, onlyOuterRing);
                        if (fallsInside) {
                            polyRings.push(neighbourPath);
                        }
                    }
                    const result = (0, polylabel_1.polylabel)(polyRings);
                    f.labelBounds = new boundingbox_1.BoundingBox();
                    // determine inner square within the circle
                    const innerPadding = 2 * Math.sqrt(2 * result.distance);
                    f.labelBounds.minX = result.pt.x - innerPadding;
                    f.labelBounds.maxX = result.pt.x + innerPadding;
                    f.labelBounds.minY = result.pt.y - innerPadding;
                    f.labelBounds.maxY = result.pt.y + innerPadding;
                    if (count % 100 === 0) {
                        yield (0, common_1.delay)(0);
                        if (onUpdate != null) {
                            onUpdate(f.id / facetResult.facets.length);
                        }
                    }
                }
                count++;
            }
            if (onUpdate != null) {
                onUpdate(1);
            }
        });
    }
    /**
     *  Checks whether a neighbour border path is fully within the current facet border path
     */
    static doesNeighbourFallInsideInCurrentFacet(neighbourPath, f, onlyOuterRing) {
        let fallsInside = true;
        // fast test to see if the neighbour falls inside the bbox of the facet
        for (let i = 0; i < neighbourPath.length && fallsInside; i++) {
            if (neighbourPath[i].x >= f.bbox.minX && neighbourPath[i].x <= f.bbox.maxX &&
                neighbourPath[i].y >= f.bbox.minY && neighbourPath[i].y <= f.bbox.maxY) {
                // ok
            }
            else {
                fallsInside = false;
            }
        }
        if (fallsInside) {
            // do a more fine grained but more expensive check to see if each of the points fall within the polygon
            for (let i = 0; i < neighbourPath.length && fallsInside; i++) {
                const distance = (0, polylabel_1.pointToPolygonDist)(neighbourPath[i].x, neighbourPath[i].y, onlyOuterRing);
                if (distance < 0) {
                    // falls outside
                    fallsInside = false;
                }
            }
        }
        return fallsInside;
    }
}
exports.FacetLabelPlacer = FacetLabelPlacer;
