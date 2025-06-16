/**
 * Module that manages the GUI when processing
 */
import { CancellationToken, RGB } from "./common";
import { FacetResult } from "./facetmanagement";
import { Settings } from "./settings";
export declare class ProcessResult {
    facetResult: FacetResult;
    colorsByIndex: RGB[];
}
/**
 *  Manages the GUI states & processes the image step by step
 */
export declare class GUIProcessManager {
    private static isCLI;
    static process(settings: Settings, cancellationToken: CancellationToken, canvas?: HTMLCanvasElement, ctx?: CanvasRenderingContext2D): Promise<ProcessResult>;
    private static processKmeansClustering;
    private static processFacetBuilding;
    private static processFacetReduction;
    private static processFacetBorderTracing;
    private static processFacetBorderSegmentation;
    private static processFacetLabelPlacement;
    /**
     *  Creates a vector based SVG image of the facets with the given configuration
     */
    static createSVG(facetResult: FacetResult, colorsByIndex: RGB[], sizeMultiplier: number, fill: boolean, stroke: boolean, addColorLabels: boolean, fontSize?: number, fontColor?: string, onUpdate?: ((progress: number) => void) | null): Promise<string | SVGSVGElement>;
}
