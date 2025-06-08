import WebGLCore from "../webGLCore";

class WebGLHistoryStack {
    private redoStack : WebGLTexture[] = [];
    private undoStack : WebGLTexture[] = [];
    private readonly wgl : WebGLCore;

    constructor (wgl : WebGLCore) {
        this.wgl = wgl;
    }
    
    public add(texture : WebGLTexture) : void{
        const gl = this.wgl.gl;
        this.undoStack.push(texture);

        while(this.redoStack.length > 0) {
            const top = this.redoStack.pop();
            if (top) gl.deleteTexture(top);
        }
    }

    public redo() : WebGLTexture | undefined{
        if (this.isRedoStackEmpty()) return;
        const nextTexture = this.redoStack.pop();

        if (!nextTexture) return;

        this.undoStack.push(nextTexture);

        return this.getUndoStackTop();
    }

    public undo() : void{
        if (this.isUndoStackEmpty()) return;

        const prevTexture : WebGLTexture | undefined = this.undoStack.pop();
        
        if (!prevTexture) return;

        this.redoStack.push(prevTexture);
    }

    public getTexture() : WebGLTexture {
        return this.getUndoStackTop();
    }

    public getUndoStackTop() : WebGLTexture {
        return this.undoStack[this.undoStack.length - 1];
    }

    public isUndoStackEmpty() : boolean {
        return this.undoStack.length <= 1;
    }

    public isRedoStackEmpty() : boolean {
        return this.redoStack.length === 0;
    }

    public getRedoStackTop() : WebGLTexture{
        return this.redoStack[this.redoStack.length - 1];
    }
}

export default WebGLHistoryStack;