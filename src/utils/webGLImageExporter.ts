class WebGLImageExporter {
    constructor(private gl : WebGL2RenderingContext) {}

    public export(texture: WebGLTexture, width : number, height: number, filename : string = "output.png") : void {
        const framebuffer = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
        this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, texture, 0);

        if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE){
            console.error("Framebuffer is not complete.")
            return;
        }

        const pixels = new Float32Array(width * height * 4);
        this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.FLOAT, pixels)
        
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null); // Unbind the framebuffer

        const clampedPixels = new Uint8ClampedArray(width * height * 4);
        for (let i = 0; i < pixels.length; i++) {
            clampedPixels[i] = Math.min(255, Math.max(0, pixels[i] * 255));
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (! ctx) throw new Error("2D context not available");
        ctx.putImageData(new ImageData(clampedPixels, width, height), 0, 0);

        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = filename;
        link.click();

        this.gl.deleteFramebuffer(framebuffer);
    }
}

export default WebGLImageExporter;