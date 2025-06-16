import Texture from "../framebuffer_textures/texture";
import WebGLCore from "../webGLCore";

class WebGLHistoryStack {
    private static readonly MAX_STACK_SIZE : number; 
    private readonly wgl : WebGLCore;
    private redoStack : WebGLTexture[] = [];
    private undoStack : WebGLTexture[] = [];

    constructor (wgl : WebGLCore) {
        this.wgl = wgl;
    }
    
    public add(texture : WebGLTexture, width : number, height : number ) : void{
        const gl = this.wgl.gl;
        const srcFBO = gl.createFramebuffer();
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, srcFBO);
        gl.framebufferTexture2D(gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        const dstFBO = gl.createFramebuffer();
        const tex = new Texture(gl);
        const dstTexture = tex.createFramebufferTexture(width, height);

        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, dstFBO);
        gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, dstTexture,0)

        gl.blitFramebuffer(
            0, 0, width, height,
            0, 0, width, height,
            gl.COLOR_BUFFER_BIT,
            gl.NEAREST
        );
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.deleteFramebuffer(srcFBO);
        gl.deleteFramebuffer(dstFBO);
        
        this.undoStack.push(dstTexture);

        while(this.redoStack.length > 0) {
            const top = this.redoStack.pop();
            if (top) gl.deleteTexture(top);
        }

        if (this.undoStack.length > WebGLHistoryStack.MAX_STACK_SIZE) {
            const oldTexture : WebGLTexture | undefined = this.undoStack.shift();
            
            if (oldTexture) gl.deleteTexture(oldTexture);
        }
    }

    public redo() : WebGLTexture{
        if (this.isRedoStackEmpty()) return this.getUndoStackTop();
        const nextTexture = this.redoStack.pop();

        if (!nextTexture) return this.getUndoStackTop();

        this.undoStack.push(nextTexture);

        return this.getUndoStackTop();
    }

    public undo() : WebGLTexture {
        if (this.isUndoStackAlmostEmpty()) return this.getUndoStackTop();

        const prevTexture : WebGLTexture | undefined = this.undoStack.pop();
        
        if (!prevTexture) return this.getUndoStackTop();

        this.redoStack.push(prevTexture);

        return this.getUndoStackTop();
    }

    public getTexture() : WebGLTexture {
        return this.getUndoStackTop();
    }

    public getUndoStackTop() : WebGLTexture {
        return this.undoStack[this.undoStack.length - 1];
    }

    public isUndoStackAlmostEmpty() : boolean {
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