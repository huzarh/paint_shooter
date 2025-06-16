"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const guiprocessmanager_1 = require("./guiprocessmanager");
const settings_1 = require("./settings");
const canvas_1 = require("canvas");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const common_1 = require("./common");
function processImage(inputImage, outputDir) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Create settings with default values
            const settings = new settings_1.Settings();
            settings.kMeansNrOfClusters = 16;
            settings.kMeansMinDeltaDifference = 1;
            settings.removeFacetsSmallerThanNrOfPoints = 20;
            settings.maximumNumberOfFacets = 100000;
            settings.nrOfTimesToHalveBorderSegments = 2;
            settings.narrowPixelStripCleanupRuns = 3;
            // Load image
            const image = yield (0, canvas_1.loadImage)(inputImage);
            const canvas = (0, canvas_1.createCanvas)(image.width, image.height);
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not get canvas context');
            }
            ctx.drawImage(image, 0, 0);
            // Process image
            const cancellationToken = new common_1.CancellationToken();
            const result = yield guiprocessmanager_1.GUIProcessManager.process(settings, cancellationToken, canvas, ctx);
            // Create output directory if it doesn't exist
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            const outputPath = path.join(outputDir, 'output');
            // Save SVG
            const svg = yield guiprocessmanager_1.GUIProcessManager.createSVG(result.facetResult, result.colorsByIndex, 3, // sizeMultiplier
            true, // fill
            true, // stroke - set to true to show borders
            true, // addColorLabels
            50, // fontSize
            "black", // fontColor
            null // onUpdate
            );
            if (typeof svg === 'string') {
                fs.writeFileSync(outputPath + '.svg', svg);
            }
            else {
                fs.writeFileSync(outputPath + '.svg', svg.outerHTML);
            }
            // Save PNG
            const png = canvas.toBuffer('image/png');
            fs.writeFileSync(outputPath + '.png', png);
            // Save palette
            const paletteCanvas = (0, canvas_1.createCanvas)(800, 100);
            const paletteCtx = paletteCanvas.getContext('2d');
            if (!paletteCtx) {
                throw new Error('Could not get palette canvas context');
            }
            const colorWidth = paletteCanvas.width / result.colorsByIndex.length;
            result.colorsByIndex.forEach((color, index) => {
                paletteCtx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
                paletteCtx.fillRect(index * colorWidth, 0, colorWidth, paletteCanvas.height);
                paletteCtx.fillStyle = 'black';
                paletteCtx.font = '20px Arial';
                paletteCtx.fillText(index.toString(), index * colorWidth + 5, 30);
            });
            const palettePng = paletteCanvas.toBuffer('image/png');
            fs.writeFileSync(outputPath + '_palette.png', palettePng);
            console.log('Processing complete. Output files saved to:', outputDir);
        }
        catch (err) {
            console.error('Error processing image:', err);
            process.exit(1);
        }
    });
}
// Command line interface
if (require.main === module) {
    const args = process.argv;
    if (args.length < 3) {
        console.error('Usage: node cli.js <input_image> [output_directory]');
        process.exit(1);
    }
    const inputImage = args[2];
    const outputDir = args[3] || '.';
    processImage(inputImage, outputDir);
}
