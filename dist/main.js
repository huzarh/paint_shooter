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
const gui_1 = require("./gui");
const clipboard_1 = require("./lib/clipboard");
$(document).ready(function () {
    $(".tabs").tabs();
    $(".tooltipped").tooltip();
    const clip = new clipboard_1.Clipboard("canvas", true);
    $("#file").change(function (ev) {
        const files = $("#file").get(0).files;
        if (files !== null && files.length > 0) {
            const reader = new FileReader();
            reader.onloadend = function () {
                const img = document.createElement("img");
                img.onload = () => {
                    const c = document.getElementById("canvas");
                    const ctx = c.getContext("2d");
                    c.width = img.naturalWidth;
                    c.height = img.naturalHeight;
                    ctx.drawImage(img, 0, 0);
                };
                img.onerror = () => {
                    alert("Unable to load image");
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(files[0]);
        }
    });
    (0, gui_1.loadExample)("imgSmall");
    $("#btnProcess").click(function () {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, gui_1.process)();
            }
            catch (err) {
                alert("Error: " + err);
            }
        });
    });
    $("#chkShowLabels, #chkFillFacets, #chkShowBorders, #txtSizeMultiplier, #txtLabelFontSize, #txtLabelFontColor").change(() => __awaiter(this, void 0, void 0, function* () {
        yield (0, gui_1.updateOutput)();
    }));
    $("#btnDownloadSVG").click(function () {
        (0, gui_1.downloadSVG)();
    });
    $("#btnDownloadPNG").click(function () {
        (0, gui_1.downloadPNG)();
    });
    $("#btnDownloadPalettePNG").click(function () {
        (0, gui_1.downloadPalettePng)();
    });
    $("#lnkTrivial").click(() => { (0, gui_1.loadExample)("imgTrivial"); return false; });
    $("#lnkSmall").click(() => { (0, gui_1.loadExample)("imgSmall"); return false; });
    $("#lnkMedium").click(() => { (0, gui_1.loadExample)("imgMedium"); return false; });
});
