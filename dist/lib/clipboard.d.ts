/**
 * image pasting into canvas
 *
 * @param {string} canvas_id - canvas id
 * @param {boolean} autoresize - if canvas will be resized
 */
export declare class Clipboard {
    private ctrl_pressed;
    private command_pressed;
    private pasteCatcher;
    private paste_event_support;
    private canvas;
    private ctx;
    private autoresize;
    constructor(canvas_id: string, autoresize: boolean);
    init(): void;
    private paste_auto;
    private on_keyboard_action;
    private on_keyboardup_action;
    private paste_createImage;
}
