import Texture from "./texture";

class Framebuffer {
    private gl: WebGL2RenderingContext;
    public framebuffer: WebGLFramebuffer | null;
    public tex : Texture;
    public framebufferTex : WebGLTexture;
    public width : number;
    public height : number;


    constructor(gl :WebGL2RenderingContext, width : number, height : number) {
        this.gl = gl;
        this.width = width;
        this.height = height;
        this.framebuffer = null;
        // if (! this.framebuffer) throw new Error("Failed to create framebuffer");


        // Setting up the texture for the frame buffer
        this.tex = new Texture(gl);
        this.framebufferTex = this.tex.createFramebufferTexture(width, height);

        this.framebuffer = this.gl.createFramebuffer();
        if (! this.framebuffer) throw new Error("Failed to create framebuffer");

        this.bind();
        // Attach the texture to the frame buffer
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            this.gl.TEXTURE_2D,
            this.framebufferTex,
            0
        );

        // Check if the frame buffer is valid
        const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
        if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
            
            throw new Error("Framebuffer is not complete: " + status.toString());
        }

        this.unbind();
    }


    public bind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
        this.gl.viewport(0, 0, this.width, this.height);
    }

    public getTexture () {
        return this.framebufferTex;
    }

    public unbind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    public delete() {
        if (this.framebuffer) {
            this.gl.deleteFramebuffer(this.framebuffer);
            this.framebuffer = null;
        }
    }

}

export default Framebuffer;