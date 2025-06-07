import Framebuffer from "./framebuffer";

class FramebufferPair {
    private fboPair:[Framebuffer, Framebuffer];
    constructor (fboWrite : Framebuffer, fboRead : Framebuffer) {
        this.fboPair = [fboWrite, fboRead];
    }

    public swap() {
        [this.fboPair[0], this.fboPair[1]] = [this.fboPair[1], this.fboPair[0]]
    }

    public read() : Framebuffer {
        return this.fboPair[1];
    }

    public write() : Framebuffer {
        return this.fboPair[0];
    }
}

export default FramebufferPair;