"use strict";
/**
 * Module that manages the GUI when processing
 */
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
exports.GUIProcessManager = exports.ProcessResult = void 0;
const colorreductionmanagement_1 = require("./colorreductionmanagement");
const common_1 = require("./common");
const facetBorderSegmenter_1 = require("./facetBorderSegmenter");
const facetBorderTracer_1 = require("./facetBorderTracer");
const facetCreator_1 = require("./facetCreator");
const facetLabelPlacer_1 = require("./facetLabelPlacer");
const facetmanagement_1 = require("./facetmanagement");
const facetReducer_1 = require("./facetReducer");
const gui_1 = require("./gui");
const point_1 = require("./structs/point");
const canvas_1 = require("canvas");
class ProcessResult {
}
exports.ProcessResult = ProcessResult;
/**
 *  Manages the GUI states & processes the image step by step
 */
class GUIProcessManager {
    static process(settings, cancellationToken, canvas, ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            let c;
            let context;
            if (this.isCLI) {
                if (!canvas || !ctx) {
                    throw new Error('Canvas and context are required in CLI mode');
                }
                c = canvas;
                context = ctx;
            }
            else {
                c = document.getElementById("canvas");
                context = c.getContext("2d");
            }
            let imgData = context.getImageData(0, 0, c.width, c.height);
            if (settings.resizeImageIfTooLarge && (c.width > settings.resizeImageWidth || c.height > settings.resizeImageHeight)) {
                let width = c.width;
                let height = c.height;
                if (width > settings.resizeImageWidth) {
                    const newWidth = settings.resizeImageWidth;
                    const newHeight = c.height / c.width * settings.resizeImageWidth;
                    width = newWidth;
                    height = newHeight;
                }
                if (height > settings.resizeImageHeight) {
                    const newHeight = settings.resizeImageHeight;
                    const newWidth = width / height * newHeight;
                    width = newWidth;
                    height = newHeight;
                }
                const tempCanvas = this.isCLI ?
                    (0, canvas_1.createCanvas)(width, height) :
                    document.createElement("canvas");
                tempCanvas.width = width;
                tempCanvas.height = height;
                tempCanvas.getContext("2d").drawImage(c, 0, 0, width, height);
                c.width = width;
                c.height = height;
                context.drawImage(tempCanvas, 0, 0, width, height);
                imgData = context.getImageData(0, 0, c.width, c.height);
            }
            // reset progress
            if (!this.isCLI) {
                $(".status .progress .determinate").css("width", "0px");
                $(".status").removeClass("complete");
            }
            // k-means clustering
            const kmeansImgData = yield this.processKmeansClustering(imgData, context, settings, cancellationToken);
            let facetResult = new facetmanagement_1.FacetResult();
            let colormapResult = new colorreductionmanagement_1.ColorMapResult();
            // build color map
            colormapResult = colorreductionmanagement_1.ColorReducer.createColorMap(kmeansImgData);
            if (settings.narrowPixelStripCleanupRuns === 0) {
                // facet building
                facetResult = yield this.processFacetBuilding(colormapResult, cancellationToken);
                // facet reduction
                yield this.processFacetReduction(facetResult, settings, colormapResult, cancellationToken);
            }
            else {
                for (let run = 0; run < settings.narrowPixelStripCleanupRuns; run++) {
                    // clean up narrow pixel strips
                    yield colorreductionmanagement_1.ColorReducer.processNarrowPixelStripCleanup(colormapResult);
                    // facet building
                    facetResult = yield this.processFacetBuilding(colormapResult, cancellationToken);
                    // facet reduction
                    yield this.processFacetReduction(facetResult, settings, colormapResult, cancellationToken);
                }
            }
            // facet border tracing
            yield this.processFacetBorderTracing(facetResult, cancellationToken);
            // facet border segmentation
            yield this.processFacetBorderSegmentation(facetResult, settings, cancellationToken);
            // facet label placement
            yield this.processFacetLabelPlacement(facetResult, cancellationToken);
            // everything is now ready to generate the SVG, return the result
            const processResult = new ProcessResult();
            processResult.facetResult = facetResult;
            processResult.colorsByIndex = colormapResult.colorsByIndex;
            return processResult;
        });
    }
    static processKmeansClustering(imgData, ctx, settings, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, gui_1.time)("K-means clustering");
            const cKmeans = this.isCLI ?
                (0, canvas_1.createCanvas)(imgData.width, imgData.height) :
                document.getElementById("cKMeans");
            cKmeans.width = imgData.width;
            cKmeans.height = imgData.height;
            const ctxKmeans = cKmeans.getContext("2d");
            ctxKmeans.fillStyle = "white";
            ctxKmeans.fillRect(0, 0, cKmeans.width, cKmeans.height);
            const kmeansImgData = ctxKmeans.getImageData(0, 0, cKmeans.width, cKmeans.height);
            if (!this.isCLI) {
                $(".status.kMeans").addClass("active");
            }
            yield colorreductionmanagement_1.ColorReducer.applyKMeansClustering(imgData, kmeansImgData, ctx, settings, (kmeans) => {
                if (!this.isCLI) {
                    const progress = (100 - (kmeans.currentDeltaDistanceDifference > 100 ? 100 : kmeans.currentDeltaDistanceDifference)) / 100;
                    $("#statusKMeans").css("width", Math.round(progress * 100) + "%");
                }
                ctxKmeans.putImageData(kmeansImgData, 0, 0);
                console.log(kmeans.currentDeltaDistanceDifference);
                if (cancellationToken.isCancelled) {
                    throw new Error("Cancelled");
                }
            });
            if (!this.isCLI) {
                $(".status").removeClass("active");
                $(".status.kMeans").addClass("complete");
            }
            (0, gui_1.timeEnd)("K-means clustering");
            return kmeansImgData;
        });
    }
    static processFacetBuilding(colormapResult, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, gui_1.time)("Facet building");
            if (!this.isCLI) {
                $(".status.facetBuilding").addClass("active");
            }
            const facetResult = yield facetCreator_1.FacetCreator.getFacets(colormapResult.width, colormapResult.height, colormapResult.imgColorIndices, (progress) => {
                if (cancellationToken.isCancelled) {
                    throw new Error("Cancelled");
                }
                if (!this.isCLI) {
                    $("#statusFacetBuilding").css("width", Math.round(progress * 100) + "%");
                }
            });
            if (!this.isCLI) {
                $(".status").removeClass("active");
                $(".status.facetBuilding").addClass("complete");
            }
            (0, gui_1.timeEnd)("Facet building");
            return facetResult;
        });
    }
    static processFacetReduction(facetResult, settings, colormapResult, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, gui_1.time)("Facet reduction");
            const cReduction = this.isCLI ?
                (0, canvas_1.createCanvas)(facetResult.width, facetResult.height) :
                document.getElementById("cReduction");
            cReduction.width = facetResult.width;
            cReduction.height = facetResult.height;
            const ctxReduction = cReduction.getContext("2d");
            ctxReduction.fillStyle = "white";
            ctxReduction.fillRect(0, 0, cReduction.width, cReduction.height);
            const reductionImgData = ctxReduction.getImageData(0, 0, cReduction.width, cReduction.height);
            if (!this.isCLI) {
                $(".status.facetReduction").addClass("active");
            }
            yield facetReducer_1.FacetReducer.reduceFacets(settings.removeFacetsSmallerThanNrOfPoints, settings.removeFacetsFromLargeToSmall, settings.maximumNumberOfFacets, colormapResult.colorsByIndex, facetResult, colormapResult.imgColorIndices, (progress) => {
                if (cancellationToken.isCancelled) {
                    throw new Error("Cancelled");
                }
                if (!this.isCLI) {
                    $("#statusFacetReduction").css("width", Math.round(progress * 100) + "%");
                }
                // update image
                let idx = 0;
                for (let j = 0; j < facetResult.height; j++) {
                    for (let i = 0; i < facetResult.width; i++) {
                        const facet = facetResult.facets[facetResult.facetMap.get(i, j)];
                        const rgb = colormapResult.colorsByIndex[facet.color];
                        reductionImgData.data[idx++] = rgb[0];
                        reductionImgData.data[idx++] = rgb[1];
                        reductionImgData.data[idx++] = rgb[2];
                        idx++;
                    }
                }
                ctxReduction.putImageData(reductionImgData, 0, 0);
            });
            if (!this.isCLI) {
                $(".status").removeClass("active");
                $(".status.facetReduction").addClass("complete");
            }
            (0, gui_1.timeEnd)("Facet reduction");
        });
    }
    static processFacetBorderTracing(facetResult, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, gui_1.time)("Facet border tracing");
            const cBorderPath = this.isCLI ?
                (0, canvas_1.createCanvas)(facetResult.width, facetResult.height) :
                document.getElementById("cBorderPath");
            cBorderPath.width = facetResult.width;
            cBorderPath.height = facetResult.height;
            const ctxBorderPath = cBorderPath.getContext("2d");
            if (!this.isCLI) {
                $(".status.facetBorderPath").addClass("active");
            }
            yield facetBorderTracer_1.FacetBorderTracer.buildFacetBorderPaths(facetResult, (progress) => {
                if (cancellationToken.isCancelled) {
                    throw new Error("Cancelled");
                }
                if (!this.isCLI) {
                    $("#statusFacetBorderPath").css("width", Math.round(progress * 100) + "%");
                }
                ctxBorderPath.fillStyle = "white";
                ctxBorderPath.fillRect(0, 0, cBorderPath.width, cBorderPath.height);
                for (const f of facetResult.facets) {
                    if (f != null && f.borderPath != null) {
                        ctxBorderPath.beginPath();
                        ctxBorderPath.moveTo(f.borderPath[0].getWallX(), f.borderPath[0].getWallY());
                        for (let i = 1; i < f.borderPath.length; i++) {
                            ctxBorderPath.lineTo(f.borderPath[i].getWallX(), f.borderPath[i].getWallY());
                        }
                        ctxBorderPath.stroke();
                    }
                }
            });
            if (!this.isCLI) {
                $(".status").removeClass("active");
                $(".status.facetBorderPath").addClass("complete");
            }
            (0, gui_1.timeEnd)("Facet border tracing");
        });
    }
    static processFacetBorderSegmentation(facetResult, settings, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, gui_1.time)("Facet border segmentation");
            const cBorderSegment = this.isCLI ?
                (0, canvas_1.createCanvas)(facetResult.width, facetResult.height) :
                document.getElementById("cBorderSegmentation");
            cBorderSegment.width = facetResult.width;
            cBorderSegment.height = facetResult.height;
            const ctxBorderSegment = cBorderSegment.getContext("2d");
            if (!this.isCLI) {
                $(".status.facetBorderSegmentation").addClass("active");
            }
            yield facetBorderSegmenter_1.FacetBorderSegmenter.buildFacetBorderSegments(facetResult, settings.nrOfTimesToHalveBorderSegments, (progress) => {
                if (cancellationToken.isCancelled) {
                    throw new Error("Cancelled");
                }
                if (!this.isCLI) {
                    $("#statusFacetBorderSegmentation").css("width", Math.round(progress * 100) + "%");
                }
                ctxBorderSegment.fillStyle = "white";
                ctxBorderSegment.fillRect(0, 0, cBorderSegment.width, cBorderSegment.height);
                for (const f of facetResult.facets) {
                    if (f != null && progress > f.id / facetResult.facets.length) {
                        ctxBorderSegment.beginPath();
                        const path = f.getFullPathFromBorderSegments(false);
                        ctxBorderSegment.moveTo(path[0].x, path[0].y);
                        for (let i = 1; i < path.length; i++) {
                            ctxBorderSegment.lineTo(path[i].x, path[i].y);
                        }
                        ctxBorderSegment.stroke();
                    }
                }
            });
            if (!this.isCLI) {
                $(".status").removeClass("active");
                $(".status.facetBorderSegmentation").addClass("complete");
            }
            (0, gui_1.timeEnd)("Facet border segmentation");
            return cBorderSegment;
        });
    }
    static processFacetLabelPlacement(facetResult, cancellationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            (0, gui_1.time)("Facet label placement");
            const cLabelPlacement = this.isCLI ?
                (0, canvas_1.createCanvas)(facetResult.width, facetResult.height) :
                document.getElementById("cLabelPlacement");
            cLabelPlacement.width = facetResult.width;
            cLabelPlacement.height = facetResult.height;
            const ctxLabelPlacement = cLabelPlacement.getContext("2d");
            if (!this.isCLI) {
                $(".status.facetLabelPlacement").addClass("active");
            }
            yield facetLabelPlacer_1.FacetLabelPlacer.buildFacetLabelBounds(facetResult, (progress) => {
                if (cancellationToken.isCancelled) {
                    throw new Error("Cancelled");
                }
                if (!this.isCLI) {
                    $("#statusFacetLabelPlacement").css("width", Math.round(progress * 100) + "%");
                }
                for (const f of facetResult.facets) {
                    if (f != null && f.labelBounds != null) {
                        ctxLabelPlacement.fillStyle = "red";
                        ctxLabelPlacement.fillRect(f.labelBounds.minX, f.labelBounds.minY, f.labelBounds.width, f.labelBounds.height);
                    }
                }
            });
            if (!this.isCLI) {
                $(".status").removeClass("active");
                $(".status.facetLabelPlacement").addClass("complete");
            }
            (0, gui_1.timeEnd)("Facet label placement");
        });
    }
    /**
     *  Creates a vector based SVG image of the facets with the given configuration
     */
    static createSVG(facetResult_1, colorsByIndex_1, sizeMultiplier_1, fill_1, stroke_1, addColorLabels_1) {
        return __awaiter(this, arguments, void 0, function* (facetResult, colorsByIndex, sizeMultiplier, fill, stroke, addColorLabels, fontSize = 50, fontColor = "black", onUpdate = null) {
            if (this.isCLI) {
                // CLI mode: Create SVG string directly
                let svgContent = `<?xml version="1.0" standalone="no"?>
<svg width="${sizeMultiplier * facetResult.width}" height="${sizeMultiplier * facetResult.height}" xmlns="http://www.w3.org/2000/svg">`;
                let count = 0;
                for (const f of facetResult.facets) {
                    if (f != null && f.borderSegments.length > 0) {
                        let newpath = [];
                        const useSegments = true;
                        if (useSegments) {
                            newpath = f.getFullPathFromBorderSegments(false);
                        }
                        else {
                            for (let i = 0; i < f.borderPath.length; i++) {
                                newpath.push(new point_1.Point(f.borderPath[i].getWallX() + 0.5, f.borderPath[i].getWallY() + 0.5));
                            }
                        }
                        if (newpath[0].x !== newpath[newpath.length - 1].x || newpath[0].y !== newpath[newpath.length - 1].y) {
                            newpath.push(newpath[0]);
                        }
                        let data = "M ";
                        data += newpath[0].x * sizeMultiplier + " " + newpath[0].y * sizeMultiplier + " ";
                        for (let i = 1; i < newpath.length; i++) {
                            const midpointX = (newpath[i].x + newpath[i - 1].x) / 2;
                            const midpointY = (newpath[i].y + newpath[i - 1].y) / 2;
                            data += "Q " + (midpointX * sizeMultiplier) + " " + (midpointY * sizeMultiplier) + " " + (newpath[i].x * sizeMultiplier) + " " + (newpath[i].y * sizeMultiplier) + " ";
                        }
                        data += "Z";
                        const strokeStyle = stroke ? "#000" : (fill ? `rgb(${colorsByIndex[f.color][0]},${colorsByIndex[f.color][1]},${colorsByIndex[f.color][2]})` : "none");
                        const fillStyle = fill ? `rgb(${colorsByIndex[f.color][0]},${colorsByIndex[f.color][1]},${colorsByIndex[f.color][2]})` : "none";
                        svgContent += `<path data-facetId="${f.id}" d="${data}" style="stroke:${strokeStyle};stroke-width:1px;fill:${fillStyle}"/>`;
                        if (addColorLabels) {
                            const nrOfDigits = (f.color + "").length;
                            const labelFontSize = fontSize / nrOfDigits;
                            svgContent += `<g class="label" transform="translate(${f.labelBounds.minX * sizeMultiplier},${f.labelBounds.minY * sizeMultiplier})">
                            <svg width="${f.labelBounds.width * sizeMultiplier}" height="${f.labelBounds.height * sizeMultiplier}" overflow="visible" viewBox="-50 -50 100 100" preserveAspectRatio="xMidYMid meet">
                                <text font-family="Tahoma" font-size="${labelFontSize}" dominant-baseline="middle" text-anchor="middle" fill="${fontColor}">${f.color}</text>
                            </svg>
                        </g>`;
                        }
                        if (count % 100 === 0) {
                            yield (0, common_1.delay)(0);
                            if (onUpdate != null) {
                                onUpdate(f.id / facetResult.facets.length);
                            }
                        }
                    }
                    count++;
                }
                svgContent += "</svg>";
                if (onUpdate != null) {
                    onUpdate(1);
                }
                return svgContent; // Return string directly in CLI
            }
            else {
                // Original browser code
                const xmlns = "http://www.w3.org/2000/svg";
                const svg = document.createElementNS(xmlns, "svg");
                svg.setAttribute("width", sizeMultiplier * facetResult.width + "");
                svg.setAttribute("height", sizeMultiplier * facetResult.height + "");
                let count = 0;
                for (const f of facetResult.facets) {
                    if (f != null && f.borderSegments.length > 0) {
                        let newpath = [];
                        const useSegments = true;
                        if (useSegments) {
                            newpath = f.getFullPathFromBorderSegments(false);
                        }
                        else {
                            for (let i = 0; i < f.borderPath.length; i++) {
                                newpath.push(new point_1.Point(f.borderPath[i].getWallX() + 0.5, f.borderPath[i].getWallY() + 0.5));
                            }
                        }
                        if (newpath[0].x !== newpath[newpath.length - 1].x || newpath[0].y !== newpath[newpath.length - 1].y) {
                            newpath.push(newpath[0]);
                        }
                        const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                        let data = "M ";
                        data += newpath[0].x * sizeMultiplier + " " + newpath[0].y * sizeMultiplier + " ";
                        for (let i = 1; i < newpath.length; i++) {
                            const midpointX = (newpath[i].x + newpath[i - 1].x) / 2;
                            const midpointY = (newpath[i].y + newpath[i - 1].y) / 2;
                            data += "Q " + (midpointX * sizeMultiplier) + " " + (midpointY * sizeMultiplier) + " " + (newpath[i].x * sizeMultiplier) + " " + (newpath[i].y * sizeMultiplier) + " ";
                        }
                        data += "Z";
                        svgPath.setAttribute("data-facetId", f.id + "");
                        svgPath.setAttribute("d", data);
                        if (stroke) {
                            svgPath.style.stroke = "#000";
                        }
                        else {
                            if (fill) {
                                svgPath.style.stroke = `rgb(${colorsByIndex[f.color][0]},${colorsByIndex[f.color][1]},${colorsByIndex[f.color][2]})`;
                            }
                        }
                        svgPath.style.strokeWidth = "1px";
                        if (fill) {
                            svgPath.style.fill = `rgb(${colorsByIndex[f.color][0]},${colorsByIndex[f.color][1]},${colorsByIndex[f.color][2]})`;
                        }
                        else {
                            svgPath.style.fill = "none";
                        }
                        svg.appendChild(svgPath);
                        if (addColorLabels) {
                            const txt = document.createElementNS(xmlns, "text");
                            txt.setAttribute("font-family", "Tahoma");
                            const nrOfDigits = (f.color + "").length;
                            txt.setAttribute("font-size", (fontSize / nrOfDigits) + "");
                            txt.setAttribute("dominant-baseline", "middle");
                            txt.setAttribute("text-anchor", "middle");
                            txt.setAttribute("fill", fontColor);
                            txt.textContent = f.color + "";
                            const subsvg = document.createElementNS(xmlns, "svg");
                            subsvg.setAttribute("width", f.labelBounds.width * sizeMultiplier + "");
                            subsvg.setAttribute("height", f.labelBounds.height * sizeMultiplier + "");
                            subsvg.setAttribute("overflow", "visible");
                            subsvg.setAttribute("viewBox", "-50 -50 100 100");
                            subsvg.setAttribute("preserveAspectRatio", "xMidYMid meet");
                            subsvg.appendChild(txt);
                            const g = document.createElementNS(xmlns, "g");
                            g.setAttribute("class", "label");
                            g.setAttribute("transform", "translate(" + f.labelBounds.minX * sizeMultiplier + "," + f.labelBounds.minY * sizeMultiplier + ")");
                            g.appendChild(subsvg);
                            svg.appendChild(g);
                        }
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
                return svg;
            }
        });
    }
}
exports.GUIProcessManager = GUIProcessManager;
GUIProcessManager.isCLI = typeof window === 'undefined';
