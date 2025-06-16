"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacetResult = exports.Facet = exports.PathPoint = exports.OrientationEnum = void 0;
const point_1 = require("./structs/point");
var OrientationEnum;
(function (OrientationEnum) {
    OrientationEnum[OrientationEnum["Left"] = 0] = "Left";
    OrientationEnum[OrientationEnum["Top"] = 1] = "Top";
    OrientationEnum[OrientationEnum["Right"] = 2] = "Right";
    OrientationEnum[OrientationEnum["Bottom"] = 3] = "Bottom";
})(OrientationEnum || (exports.OrientationEnum = OrientationEnum = {}));
/**
 * PathPoint is a point with an orientation that indicates which wall border is set
 */
class PathPoint extends point_1.Point {
    constructor(pt, orientation) {
        super(pt.x, pt.y);
        this.orientation = orientation;
    }
    getWallX() {
        let x = this.x;
        if (this.orientation === OrientationEnum.Left) {
            x -= 0.5;
        }
        else if (this.orientation === OrientationEnum.Right) {
            x += 0.5;
        }
        return x;
    }
    getWallY() {
        let y = this.y;
        if (this.orientation === OrientationEnum.Top) {
            y -= 0.5;
        }
        else if (this.orientation === OrientationEnum.Bottom) {
            y += 0.5;
        }
        return y;
    }
    getNeighbour(facetResult) {
        switch (this.orientation) {
            case OrientationEnum.Left:
                if (this.x - 1 >= 0) {
                    return facetResult.facetMap.get(this.x - 1, this.y);
                }
                break;
            case OrientationEnum.Right:
                if (this.x + 1 < facetResult.width) {
                    return facetResult.facetMap.get(this.x + 1, this.y);
                }
                break;
            case OrientationEnum.Top:
                if (this.y - 1 >= 0) {
                    return facetResult.facetMap.get(this.x, this.y - 1);
                }
                break;
            case OrientationEnum.Bottom:
                if (this.y + 1 < facetResult.height) {
                    return facetResult.facetMap.get(this.x, this.y + 1);
                }
                break;
        }
        return -1;
    }
    toString() {
        return this.x + "," + this.y + " " + this.orientation;
    }
}
exports.PathPoint = PathPoint;
/**
 *  A facet that represents an area of pixels of the same color
 */
class Facet {
    constructor() {
        this.pointCount = 0;
        /**
         * Flag indicating if the neighbourfacets array is dirty. If it is, the neighbourfacets *have* to be rebuild
         * Before it can be used. This is useful to defer the rebuilding of the array until it's actually needed
         * and can remove a lot of duplicate building of the array because multiple facets were hitting the same neighbour
         * (over 50% on test images)
         */
        this.neighbourFacetsIsDirty = false;
    }
    getFullPathFromBorderSegments(useWalls) {
        const newpath = [];
        const addPoint = (pt) => {
            if (useWalls) {
                newpath.push(new point_1.Point(pt.getWallX(), pt.getWallY()));
            }
            else {
                newpath.push(new point_1.Point(pt.x, pt.y));
            }
        };
        let lastSegment = null;
        for (const seg of this.borderSegments) {
            // fix for the continuitity of the border segments. If transition points between border segments on the path aren't repeated, the
            // borders of the facets aren't always matching up leaving holes when rendered
            if (lastSegment != null) {
                if (lastSegment.reverseOrder) {
                    addPoint(lastSegment.originalSegment.points[0]);
                }
                else {
                    addPoint(lastSegment.originalSegment.points[lastSegment.originalSegment.points.length - 1]);
                }
            }
            for (let i = 0; i < seg.originalSegment.points.length; i++) {
                const idx = seg.reverseOrder ? (seg.originalSegment.points.length - 1 - i) : i;
                addPoint(seg.originalSegment.points[idx]);
            }
            lastSegment = seg;
        }
        return newpath;
    }
}
exports.Facet = Facet;
/**
 *  Result of the facet construction, both as a map and as an array.
 *  Facets in the array can be null when they've been deleted
 */
class FacetResult {
}
exports.FacetResult = FacetResult;
