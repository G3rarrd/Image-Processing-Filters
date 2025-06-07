import Framebuffer from './framebuffer';
class FramebufferPool {
    private pool: Framebuffer[] = [];
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

    public release(fbo : Framebuffer) {
        if (!this.inUse.has(fbo)) {
            console.warn("Trying to release framebuffer that was not acquired!");
            return;
        }
        this.inUse.delete(fbo);
    }

    public clear () {
        this.inUse.clear();
        this.pool.forEach(fbo => fbo.delete()); // call gl.deleteFramebuffer etc.
        this.pool = [];
    }
}

export default FramebufferPool;