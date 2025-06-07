import WebGLCore from "../webGLCore";

class WebGLHistoryStack {
    private redoStack : WebGLTexture[] = [];
    private undoStack : WebGLTexture[] = [];
    private readonly wgl : WebGLCore;

    constructor (wgl : WebGLCore, initialTexture : WebGLTexture) {
        this.wgl = wgl;
        this.undoStack.push(initialTexture);
    }
    
    public push(texture : WebGLTexture) : void{
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

    public undo() : WebGLTexture | undefined{
        if (this.isUndoStackEmpty()) return;

        const prevTexture : WebGLTexture | undefined = this.undoStack.pop();
        
        if (!prevTexture) return;

        this.redoStack.push(prevTexture);

        return this.getUndoStackTop();
    }

    public getUndoStackTop() : WebGLTexture {
        if (this.isUndoStackEmpty() ) {
            throw new Error("Undo stack is empty");
        }
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