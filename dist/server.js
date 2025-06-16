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
const app = express();
const port = 8000;

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

// Add static file serving for the output directory
const outputDir = path.join(__dirname, '../output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}
app.use('/output', express.static(outputDir));

// Configure multer for handling file uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            cb(null, Date.now() + path.extname(file.originalname));
        }
    })
});

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
        if (!req.file) {
            res.status(400).json({ error: 'No image file provided' });
            return;
        }
        console.log('Received file:', req.file.originalname);
        // Create settings with default values
        const settings = new settings_1.Settings();
        settings.kMeansNrOfClusters = 16;
        settings.kMeansMinDeltaDifference = 1;
        settings.removeFacetsSmallerThanNrOfPoints = 20;
        settings.maximumNumberOfFacets = 100000;
        settings.nrOfTimesToHalveBorderSegments = 2;
        settings.narrowPixelStripCleanupRuns = 3;
        // Load and process the image
        const image = yield (0, canvas_1.loadImage)(req.file.path);
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
        const svgNumber = getNextSvgNumber();
        const svgPath = path.join(outputDir, `out-${svgNumber}.svg`);
        fs.writeFileSync(svgPath, typeof svg === 'string' ? svg : svg.outerHTML);

        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);

        // Send success response with the file number
        res.json({ 
            success: true, 
            message: 'SVG generated successfully',
            fileNumber: svgNumber
        });
    }
    catch (error) {
        console.error('Error processing image:', error);
        res.status(500).json({ error: 'Error processing image' });
    }
});

// Add GET endpoint to list SVGs
app.get('/', (req, res) => {
    const files = fs.readdirSync(outputDir);
    const svgFiles = files.filter(file => file.startsWith('out-') && file.endsWith('.svg'))
        .sort((a, b) => {
            const numA = parseInt(a.replace('out-', '').replace('.svg', ''));
            const numB = parseInt(b.replace('out-', '').replace('.svg', ''));
            return numA - numB;
        });

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Generated SVGs</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .svg-container { margin: 20px 0; }
                .svg-container img { max-width: 100%; border: 1px solid #ccc; }
                h1 { color: #333; }
            </style>
        </head>
        <body>
            <h1>Generated SVGs</h1>
            ${svgFiles.map(file => `
                <div class="svg-container">
                    <h2>${file}</h2>
                    <img src="/output/${file}" alt="${file}">
                </div>
            `).join('')}
        </body>
        </html>
    `;

    res.send(html);
});

app.post('/convert', upload.single('image'), convertHandler);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});