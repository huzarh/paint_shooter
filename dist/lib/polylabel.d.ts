type Polygon = PolygonRing[];
type PolygonRing = Point[];
interface Point {
    x: number;
    y: number;
}
interface PointResult {
    pt: Point;
    distance: number;
}
export declare function polylabel(polygon: Polygon, precision?: number): PointResult;
/**
 * Signed distance from point to polygon outline (negative if point is outside)
 */
export declare function pointToPolygonDist(x: number, y: number, polygon: Polygon): number;
export {};
