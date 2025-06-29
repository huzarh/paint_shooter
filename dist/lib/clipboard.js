"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Clipboard = void 0;
// From https://stackoverflow.com/a/35576409/694640
/**
 * image pasting into canvas
 *
 * @param {string} canvas_id - canvas id
 * @param {boolean} autoresize - if canvas will be resized
 */
class Clipboard {
    constructor(canvas_id, autoresize) {
        this.ctrl_pressed = false;
        this.command_pressed = false;
        this.paste_event_support = false;
        const _self = this;
        this.canvas = document.getElementById(canvas_id);
        this.ctx = this.canvas.getContext("2d");
        this.autoresize = autoresize;
        // handlers
        // document.addEventListener("keydown", function (e) {
        //     _self.on_keyboard_action(e);
        // }, false); // firefox fix
        // document.addEventListener("keyup", function (e) {
        //     _self.on_keyboardup_action(e);
        // }, false); // firefox fix
        document.addEventListener("paste", function (e) {
            _self.paste_auto(e);
        }, false); // official paste handler
        this.init();
    }
    // constructor - we ignore security checks here
    init() {
        this.pasteCatcher = document.createElement("div");
        this.pasteCatcher.setAttribute("id", "paste_ff");
        this.pasteCatcher.setAttribute("contenteditable", "");
        this.pasteCatcher.style.cssText = "opacity:0;position:fixed;top:0px;left:0px;width:10px;margin-left:-20px;";
        document.body.appendChild(this.pasteCatcher);
        const _self = this;
        // create an observer instance
        const observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (_self.paste_event_support === true || _self.ctrl_pressed === false || mutation.type !== "childList") {
                    // we already got data in paste_auto()
                    return true;
                }
                // if paste handle failed - capture pasted object manually
                if (mutation.addedNodes.length === 1) {
                    if (mutation.addedNodes[0].src !== undefined) {
                        // image
                        _self.paste_createImage(mutation.addedNodes[0].src);
                    }
                    // register cleanup after some time.
                    setTimeout(function () {
                        _self.pasteCatcher.innerHTML = "";
                    }, 20);
                }
                return false;
            });
        });
        const target = document.getElementById("paste_ff");
        const config = { attributes: true, childList: true, characterData: true };
        observer.observe(target, config);
    }
    // default paste action
    paste_auto(e) {
        this.paste_event_support = false;
        if (this.pasteCatcher !== undefined) {
            this.pasteCatcher.innerHTML = "";
        }
        if (e.clipboardData) {
            const items = e.clipboardData.items;
            if (items) {
                this.paste_event_support = true;
                // access data directly
                for (let i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf("image") !== -1) {
                        // image
                        const blob = items[i].getAsFile();
                        const URLObj = window.URL || window.webkitURL;
                        const source = URLObj.createObjectURL(blob);
                        this.paste_createImage(source);
                        e.preventDefault();
                        return false;
                    }
                }
            }
            else {
                // wait for DOMSubtreeModified event
                // https://bugzilla.mozilla.org/show_bug.cgi?id=891247
            }
        }
        return true;
    }
    // on keyboard press
    on_keyboard_action(event) {
        const k = event.keyCode;
        // ctrl
        if (k === 17 || event.metaKey || event.ctrlKey) {
            if (this.ctrl_pressed === false) {
                this.ctrl_pressed = true;
            }
        }
        // v
        if (k === 86) {
            if (document.activeElement !== undefined && document.activeElement.type === "text") {
                // let user paste into some input
                return false;
            }
            if (this.ctrl_pressed === true && this.pasteCatcher !== undefined) {
                this.pasteCatcher.focus();
            }
        }
        return true;
    }
    // on keyboard release
    on_keyboardup_action(event) {
        // ctrl
        if (event.ctrlKey === false && this.ctrl_pressed === true) {
            this.ctrl_pressed = false;
        }
        else if (event.metaKey === false && this.command_pressed === true) {
            this.command_pressed = false;
            this.ctrl_pressed = false;
        }
    }
    // draw pasted image to canvas
    paste_createImage(source) {
        const pastedImage = new Image();
        const self = this;
        pastedImage.onload = function () {
            if (self.autoresize === true) {
                // resize
                self.canvas.width = pastedImage.width;
                self.canvas.height = pastedImage.height;
            }
            else {
                // clear canvas
                self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
            }
            self.ctx.drawImage(pastedImage, 0, 0);
        };
        pastedImage.src = source;
    }
}
exports.Clipboard = Clipboard;
