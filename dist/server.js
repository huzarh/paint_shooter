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

// Add JSON parsing middleware with better error handling
app.use(express.json({
    verify: (req, res, buf, encoding) => {
        try {
            JSON.parse(buf);
        } catch (e) {
            res.status(400).json({
                success: false,
                error: 'Invalid JSON',
                details: 'The request body contains invalid JSON',
                position: e.message
            });
            throw new Error('Invalid JSON');
        }
    }
}));

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
                error: 'No image URL or path provided',
                details: 'Please provide an image URL or local file path in the request body'
            });
            return;
        }

        console.log('Processing image from:', imageUrl);

        let imageBuffer;
        // Check if the input is a local file path
        if (fs.existsSync(imageUrl)) {
            try {
                imageBuffer = fs.readFileSync(imageUrl);
            } catch (error) {
                throw new Error(`Failed to read local file: ${error.message}`);
            }
        } else {
            // Check if it's a Telegram API URL
            const telegramMatch = imageUrl.match(/api\.telegram\.org\/bot([^\/]+)\/(?:photos|file)\/([^\/]+)/);
            if (telegramMatch) {
                try {
                    // First get the file path using getFile
                    const botToken = telegramMatch[1];
                    const fileId = telegramMatch[2];
                    
                    // Try to get file info from Telegram
                    const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile`;
                    console.log('Getting file info from Telegram for file_id:', fileId);
                    
                    const fileResponse = yield axios.post(getFileUrl, {
                        file_id: fileId
                    });

                    if (!fileResponse.data.ok) {
                        console.error('Telegram API error response:', fileResponse.data);
                        throw new Error(`Telegram API error: ${fileResponse.data.description || 'Unknown error'}`);
                    }

                    const filePath = fileResponse.data.result.file_path;
                    if (!filePath) {
                        throw new Error('No file path returned from Telegram');
                    }

                    // Download the file using the file path
                    const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
                    console.log('Downloading from Telegram URL:', downloadUrl);

                    const response = yield axios({
                        method: 'GET',
                        url: downloadUrl,
                        responseType: 'arraybuffer',
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Connection': 'keep-alive'
                        },
                        maxRedirects: 5,
                        validateStatus: function (status) {
                            return status >= 200 && status < 300;
                        }
                    });

                    // Verify that we got image data
                    if (!response.data || response.data.length === 0) {
                        throw new Error('No image data received from Telegram');
                    }

                    imageBuffer = response.data;
                    console.log('Successfully downloaded image from Telegram');
                } catch (error) {
                    console.error('Error downloading from Telegram:', error.message);
                    if (error.response) {
                        console.error('Telegram API response:', error.response.data);
                    }
                    throw new Error(`Failed to download from Telegram: ${error.message}`);
                }
            } else {
                // Regular URL download
                try {
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
                            return status >= 200 && status < 300;
                        }
                    });
                    imageBuffer = response.data;
                } catch (error) {
                    console.error('Error downloading image:', error.message);
                    throw new Error(`Failed to download image: ${error.message}`);
                }
            }
        }

        // Save the image
        const imageNumber = getNextFileNumber('in-', '.png');
        const imagePath = path.join(inputDir, `in-${imageNumber}.png`);
        
        try {
            fs.writeFileSync(imagePath, imageBuffer);
        } catch (error) {
            console.error('Error saving image:', error.message);
            throw new Error(`Failed to save image: ${error.message}`);
        }

        // Load and process the image
        const image = yield (0, canvas_1.loadImage)(imagePath);
        
        // Check image size and resize if necessary
        const MAX_DIMENSION = 1500; // Reduced from 1500 to 1000
        const MAX_PIXELS = 1000000; // Maximum total pixels (1000x1000)
        let finalWidth = image.width;
        let finalHeight = image.height;
        let wasResized = false;

        // Calculate total pixels
        const totalPixels = image.width * image.height;
        
        if (totalPixels > MAX_PIXELS) {
            wasResized = true;
            const scale = Math.sqrt(MAX_PIXELS / totalPixels);
            finalWidth = Math.round(image.width * scale);
            finalHeight = Math.round(image.height * scale);
        } else if (image.width > MAX_DIMENSION || image.height > MAX_DIMENSION) {
            wasResized = true;
            if (image.width > image.height) {
                finalWidth = MAX_DIMENSION;
                finalHeight = Math.round((image.height * MAX_DIMENSION) / image.width);
            } else {
                finalHeight = MAX_DIMENSION;
                finalWidth = Math.round((image.width * MAX_DIMENSION) / image.height);
            }
        }

        // Create settings with optimized values for large images
        const settings = new settings_1.Settings();
        if (totalPixels > 500000) { // If image is large
            settings.kMeansNrOfClusters = 12; // Reduced from 16
            settings.removeFacetsSmallerThanNrOfPoints = 25; // Increased from 20
            settings.maximumNumberOfFacets = 50000; // Reduced from 100000
            settings.nrOfTimesToHalveBorderSegments = 3; // Increased from 2
            settings.narrowPixelStripCleanupRuns = 20; // Reduced from 3
        } else {
            settings.kMeansNrOfClusters = 12;
            settings.removeFacetsSmallerThanNrOfPoints = 10;
            settings.maximumNumberOfFacets = 100000;
            settings.nrOfTimesToHalveBorderSegments = 2;
            settings.narrowPixelStripCleanupRuns = 5;
        }

        const canvas = (0, canvas_1.createCanvas)(finalWidth, finalHeight);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }

        // Draw image with potential resizing
        ctx.drawImage(image, 0, 0, finalWidth, finalHeight);

        // Process the image
        const cancellationToken = new common_1.CancellationToken();
        const result = yield guiprocessmanager_1.GUIProcessManager.process(settings, cancellationToken, canvas, ctx);

        // Generate SVG with optimized settings
        const svg = yield guiprocessmanager_1.GUIProcessManager.createSVG(
            result.facetResult, 
            result.colorsByIndex, 
            3, // sizeMultiplier
            true, // fill
            true, // stroke
            true, // addColorLabels
            Math.max(30, Math.min(50, Math.round(finalWidth / 20))), // Dynamic font size based on image width
            "black", // fontColor
            null // onUpdate
        );

        // Save SVG with sequential number
        const svgPath = path.join(outputDir, `out-${imageNumber}.svg`);
        const svgContent = typeof svg === 'string' ? svg : svg.outerHTML;
        fs.writeFileSync(svgPath, svgContent);

        // Convert SVG to PNG and save
        const svgCanvas = (0, canvas_1.createCanvas)(finalWidth, finalHeight);
        const svgCtx = svgCanvas.getContext('2d');
        
        // Add viewBox to SVG if not present
        let modifiedSvg = svgContent;
        if (!modifiedSvg.includes('viewBox')) {
            modifiedSvg = modifiedSvg.replace('<svg', `<svg viewBox="0 0 ${finalWidth} ${finalHeight}"`);
        }
        
        const svgImage = yield (0, canvas_1.loadImage)(`data:image/svg+xml;base64,${Buffer.from(modifiedSvg).toString('base64')}`);
        svgCtx.drawImage(svgImage, 0, 0, finalWidth, finalHeight);
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
                timestamp: new Date().toISOString(),
                imageSize: {
                    originalWidth: image.width,
                    originalHeight: image.height,
                    finalWidth: finalWidth,
                    finalHeight: finalHeight,
                    wasResized: wasResized,
                    totalPixels: totalPixels,
                    finalPixels: finalWidth * finalHeight
                },
                processingInfo: {
                    kMeansClusters: settings.kMeansNrOfClusters,
                    maxFacets: settings.maximumNumberOfFacets,
                    processingTime: new Date().toISOString(),
                    optimizationLevel: totalPixels > 500000 ? 'high' : 'normal'
                }
            }
        });
    }
    catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error processing image',
            details: error.message || 'An unexpected error occurred during image processing',
            timestamp: new Date().toISOString(),
            errorType: error.name || 'UnknownError',
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Add GET endpoint to list SVGs
app.get('/', (req, res) => {
    try {
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
                    .status {
                        padding: 5px 10px;
                        border-radius: 3px;
                        font-size: 0.9em;
                        margin-left: 10px;
                    }
                    .status.success {
                        background-color: #d4edda;
                        color: #155724;
                    }
                    .status.error {
                        background-color: #f8d7da;
                        color: #721c24;
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
                            <h2>Conversion #${index + 1} <span class="status success">Success</span></h2>
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
    } catch (error) {
        console.error('Error generating page:', error);
        res.status(500).json({
            success: false,
            error: 'Error generating results page',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.post('/convert', convertHandler);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});