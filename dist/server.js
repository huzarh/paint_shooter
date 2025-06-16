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
const express = require('express');
const multer = require('multer');
const guiprocessmanager_1 = require("./guiprocessmanager");
const settings_1 = require("./settings");
const canvas_1 = require("canvas");
const common_1 = require("./common");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const axios = require('axios');
const app = express();
const port = 8000;

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

// Add JSON parsing middleware
app.use(express.json());

// Add static file serving for the output directory
const outputDir = path.join(__dirname, '../output');
const inputDir = path.join(__dirname, '../input');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}
if (!fs.existsSync(inputDir)) {
    fs.mkdirSync(inputDir, { recursive: true });
}
app.use('/output', express.static(outputDir));
app.use('/input', express.static(inputDir));

// Function to get next available file number
function getNextFileNumber(prefix, extension) {
    const dir = prefix.startsWith('in-') ? inputDir : outputDir;
    const files = fs.readdirSync(dir);
    const matchingFiles = files.filter(file => file.startsWith(prefix) && file.endsWith(extension));
    if (matchingFiles.length === 0) return 1;
    
    const numbers = matchingFiles.map(file => {
        const num = parseInt(file.replace(prefix, '').replace(extension, ''));
        return isNaN(num) ? 0 : num;
    });
    return Math.max(...numbers) + 1;
}

// Create a temporary directory for processing
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Function to get next available SVG number
function getNextSvgNumber() {
    const files = fs.readdirSync(outputDir);
    const svgFiles = files.filter(file => file.startsWith('out-') && file.endsWith('.svg'));
    if (svgFiles.length === 0) return 1;
    
    const numbers = svgFiles.map(file => {
        const num = parseInt(file.replace('out-', '').replace('.svg', ''));
        return isNaN(num) ? 0 : num;
    });
    return Math.max(...numbers) + 1;
}

const convertHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const imageUrl = req.body.url;
        if (!imageUrl) {
            res.status(400).json({ 
                success: false, 
                error: 'No image URL provided',
                details: 'Please provide an image URL in the request body'
            });
            return;
        }

        console.log('Processing image from URL:', imageUrl);

        // Download image from URL
        const response = yield axios({
            method: 'GET',
            url: imageUrl,
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive'
            },
            maxRedirects: 5,
            validateStatus: function (status) {
                return status >= 200 && status < 300; // Accept all 2xx status codes
            }
        });

        // Check if the response is actually an image
        const contentType = response.headers['content-type'];
        if (!contentType || !contentType.startsWith('image/')) {
            throw new Error('URL does not point to a valid image');
        }

        // Save the downloaded image
        const imageNumber = getNextFileNumber('in-', '.png');
        const imagePath = path.join(inputDir, `in-${imageNumber}.png`);
        fs.writeFileSync(imagePath, response.data);

        // Create settings with default values
        const settings = new settings_1.Settings();
        settings.kMeansNrOfClusters = 16;
        settings.kMeansMinDeltaDifference = 1;
        settings.removeFacetsSmallerThanNrOfPoints = 20;
        settings.maximumNumberOfFacets = 100000;
        settings.nrOfTimesToHalveBorderSegments = 2;
        settings.narrowPixelStripCleanupRuns = 3;

        // Load and process the image
        const image = yield (0, canvas_1.loadImage)(imagePath);
        const canvas = (0, canvas_1.createCanvas)(image.width, image.height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }
        ctx.drawImage(image, 0, 0);

        // Process the image
        const cancellationToken = new common_1.CancellationToken();
        const result = yield guiprocessmanager_1.GUIProcessManager.process(settings, cancellationToken, canvas, ctx);

        // Generate SVG
        const svg = yield guiprocessmanager_1.GUIProcessManager.createSVG(result.facetResult, result.colorsByIndex, 3,
            true, true, true, 50, "black", null);

        // Save SVG with sequential number
        const svgPath = path.join(outputDir, `out-${imageNumber}.svg`);
        const svgContent = typeof svg === 'string' ? svg : svg.outerHTML;
        fs.writeFileSync(svgPath, svgContent);

        // Convert SVG to PNG and save
        const svgCanvas = (0, canvas_1.createCanvas)(image.width, image.height);
        const svgCtx = svgCanvas.getContext('2d');
        
        // Add viewBox to SVG if not present
        let modifiedSvg = svgContent;
        if (!modifiedSvg.includes('viewBox')) {
            modifiedSvg = modifiedSvg.replace('<svg', `<svg viewBox="0 0 ${image.width} ${image.height}"`);
        }
        
        const svgImage = yield (0, canvas_1.loadImage)(`data:image/svg+xml;base64,${Buffer.from(modifiedSvg).toString('base64')}`);
        svgCtx.drawImage(svgImage, 0, 0, image.width, image.height);
        const pngBuffer = svgCanvas.toBuffer('image/png');
        const pngPath = path.join(outputDir, `out-${imageNumber}.png`);
        fs.writeFileSync(pngPath, pngBuffer);

        // Send success response with the file numbers
        res.json({ 
            success: true, 
            message: 'SVG generated successfully',
            inputFile: `in-${imageNumber}.png`,
            outputFile: `out-${imageNumber}.svg`,
            details: {
                inputPath: `/input/in-${imageNumber}.png`,
                outputPath: `/output/out-${imageNumber}.svg`,
                outputPngPath: `/output/out-${imageNumber}.png`,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error processing image',
            details: error.message || 'An unexpected error occurred during image processing'
        });
    }
});

// Add GET endpoint to list SVGs
app.get('/', (req, res) => {
    const inputFiles = fs.readdirSync(inputDir)
        .filter(file => file.startsWith('in-') && file.endsWith('.png'))
        .sort((a, b) => {
            const numA = parseInt(a.replace('in-', '').replace('.png', ''));
            const numB = parseInt(b.replace('in-', '').replace('.png', ''));
            return numA - numB;
        });

    const outputFiles = fs.readdirSync(outputDir)
        .filter(file => file.startsWith('out-') && file.endsWith('.svg'))
        .sort((a, b) => {
            const numA = parseInt(a.replace('out-', '').replace('.svg', ''));
            const numB = parseInt(b.replace('out-', '').replace('.svg', ''));
            return numA - numB;
        });

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Image Conversion Results</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .comparison-container { 
                    margin: 20px 0;
                    padding: 20px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                }
                .image-pair {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .image-container {
                    flex: 1;
                }
                .image-container img { 
                    max-width: 100%;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                }
                h1 { color: #333; }
                h2 { color: #666; margin-bottom: 10px; }
                .file-name {
                    font-size: 0.9em;
                    color: #666;
                    margin-top: 5px;
                }
            </style>
        </head>
        <body>
            <h1>Image Conversion Results</h1>
            ${inputFiles.map((inputFile, index) => {
                const outputFile = outputFiles[index];
                if (!outputFile) return '';
                return `
                    <div class="comparison-container">
                        <h2>Conversion #${index + 1}</h2>
                        <div class="image-pair">
                            <div class="image-container">
                                <h3>Input Image</h3>
                                <img src="/input/${inputFile}" alt="${inputFile}">
                                <div class="file-name">${inputFile}</div>
                            </div>
                            <div class="image-container">
                                <h3>Output SVG</h3>
                                <img src="/output/${outputFile}" alt="${outputFile}">
                                <div class="file-name">${outputFile}</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </body>
        </html>
    `;

    res.send(html);
});

app.post('/convert', convertHandler);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});