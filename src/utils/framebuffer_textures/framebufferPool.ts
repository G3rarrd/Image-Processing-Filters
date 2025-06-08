import Framebuffer from './framebuffer';
class FramebufferPool {
    public pool: Framebuffer[] = [];
    private gl : WebGL2RenderingContext;
    public inUse : Set<Framebuffer> = new Set();
    constructor (gl : WebGL2RenderingContext) {
        this.gl= gl;
    };

    public acquire(width : number, height : number, curTexture : WebGLTexture) {
        let fbo : Framebuffer | undefined;
        for (let i = 0; i < this.pool.length; ++i) {
            if (!this.inUse.has(this.pool[i]) && this.pool[i].width == width && this.pool[i].height == height && curTexture != this.pool[i].getTexture()) {
                fbo = this.pool[i];
                break;
            }
        }

        if (!fbo) {
            fbo = new Framebuffer(this.gl, width, height);
            this.pool.push(fbo);
        }

        this.inUse.add(fbo);
        return fbo;
    }

    public getRead(width : number, height : number) {
        for (const fbo of this.pool) {
            const fboInUse : boolean = this.inUse.has(fbo);
            const sizeMatch : boolean = fbo.width === width && fbo.height  === height;
            
            if (!fboInUse && sizeMatch ) {
                this.inUse.add(fbo);
                return fbo;
            }
        }

        
        // Add a new Framebuffer if all the framebuffers in the pool are in use
        const newFbo = new Framebuffer(this.gl, width, height);
        this.pool.push(newFbo);
        this.inUse.add(newFbo);
        return newFbo;
    }

    public getWrite(width : number, height : number, inputTextures : WebGLTexture[]) {
        for (const fbo of this.pool) {
            const texture : WebGLTexture = fbo.getTexture();

            const notInUse : boolean = ! this.inUse.has(fbo);
            const sizeMatch : boolean = fbo.width === width && fbo.height === height;
            const notUsedAsInput = ! inputTextures.includes(texture);

            if(notInUse && sizeMatch && notUsedAsInput) {
                this.inUse.add(fbo);
                return fbo;
            }
        }

        const newFbo = new Framebuffer(this.gl, width, height);
        this.pool.push(newFbo);
        this.inUse.add(newFbo);
        return newFbo;
    }

    public release(fbo : Framebuffer) {
        if (!this.inUse.has(fbo)) {
            console.warn("Trying to release framebuffer that is not currently in use!");
            return;
        }
        this.inUse.delete(fbo); // framebuffer is no longer needed
    }

    public clear () {
        // use when a new image has been loaded
        this.inUse.clear();
        this.pool.forEach(fbo => fbo.delete()); // call gl.deleteFramebuffer etc.
        this.pool = [];
    }
}

export default FramebufferPool;