class Texture {
    private gl : WebGL2RenderingContext;
    // public texture : WebGLTexture | null;
    public width: number = 0;
    public height: number = 0;
    constructor(
        gl : WebGL2RenderingContext) {
        this.gl = gl;
    }

    public bind(texture : WebGLTexture, textureUnit: number = 0) {
        this.gl.activeTexture(this.gl.TEXTURE0 + textureUnit);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture );
    }

    public createAndSetupTexture() {
        const texture = this.gl.createTexture();
        if (!texture) throw new Error("Failed to create texture");
        this.bind(texture);

        // Setting up texture to enable the rendering of any sized image and so we are working with pixels
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);        
        return texture;
    }


    public uploadData(texture : WebGLTexture, width: number, height : number) {
        /* This method will be used for the framebuffers implementation */
        this.width = width;
        this.height = height;
        
        this.bind(texture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0, 
            this.gl.RGBA32F,
            width,
            height,
            0,
            this.gl.RGBA,
            this.gl.FLOAT,
            null
        );
    }

    public uploadImgTexture (texture : WebGLTexture, img : HTMLImageElement) {
        if (! img ) throw new Error("Image is unavailable");

        // this.createAndSetupTexture();
        // Create a texture and put the image in it after binding and setting up the texture
        this.width = img.naturalWidth;
        this.height = img.naturalHeight;

        this.bind(texture);
        
        const mipLevel = 0;
        const internalFormat = this.gl.RGBA32F;
        const srcFormat = this.gl.RGBA;
        const srcType = this.gl.FLOAT;

        this.gl.texImage2D(
            this.gl.TEXTURE_2D, 
            mipLevel, 
            internalFormat, 
            srcFormat, 
            srcType, 
            img
        );
    }

    public createTextureFromImage(img: HTMLImageElement) : WebGLTexture {
        const texture = this.createAndSetupTexture();
        this.uploadImgTexture(texture, img);
        return texture;
    }

    public createFramebufferTexture(width : number, height : number) : WebGLTexture {
        const texture = this.createAndSetupTexture();
        this.uploadData(texture, width, height);
        return texture;
    }

    // Creates texture for frame buffer and with data consisting of arraybufferview
    public createTexture (texture : WebGLTexture, width : number, height : number) {
        this.uploadData(texture, width, height);
    }

    public setUniforms(program: WebGLProgram, 
        gl: WebGL2RenderingContext, 
        imgWidth : number, 
        imgHeight : number ){
        const imageSizeLocation = this.gl.getUniformLocation(program, "u_imageSize");
        if (imageSizeLocation !== null) gl.uniform2f(imageSizeLocation, imgWidth, imgHeight);
    }

    public delete(texture : WebGLTexture | null) {
        if (texture) {
            this.gl.deleteTexture(texture);
            texture = null;
        }
    }
}

export default Texture;