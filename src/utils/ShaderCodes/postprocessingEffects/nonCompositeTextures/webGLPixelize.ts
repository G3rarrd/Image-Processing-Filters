import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import FramebufferPair from "../../../framebuffer_textures/framebufferPair";

class WebGLPixelize implements RenderFilter {
    private program: WebGLProgram|null = null; 
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private  blockSize : number = 1;
    
    /** 
    *  
    */
    constructor (
        wgl:WebGLCore, 
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        
    }

    public init() {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLPixelize.fragmentShader, "Pixelize Shader");
    }

    public setAttributes(blockSize : number ){
        this.blockSize = blockSize;
    }

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        /* Uses only one texture */ 
        if (! this.program) throw new Error("Pixelize program is not compiled");
        const gl: WebGL2RenderingContext = this.wgl.gl;

        fboPair.write().bind();

        this.wgl.clearCanvas(); // Clear the framebuffer

        gl.useProgram(this.program);
        gl.bindVertexArray(this.wgl.vao);

        for (let i = 0; i < inputTextures.length; i++) {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, inputTextures[i]);
        }
        
        this.postProcessing.setGlobalUniforms(gl, this.program,fboPair.write().width, fboPair.write().height);
        this.setUniforms();

        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindVertexArray(null);
        gl.useProgram(null);
        fboPair.write().unbind();
        fboPair.swap()
        return fboPair.read().getTexture();
    }

    

    private setUniforms () : void {
        if (! this.program) throw new Error("Pixelize program is not compiled");
        
        const gl : WebGL2RenderingContext = this.wgl.gl;

        const U_IMAGE : string = 'u_image';
        const U_BLOCK_SIZE : string = 'u_block_size';

        const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_IMAGE);
        const blockSizeLocation: WebGLUniformLocation | null = gl.getUniformLocation(
            this.program,
            U_BLOCK_SIZE
        );
        
        if (!imageLocation) throw new Error(setUniformLocationError(U_IMAGE));
        if (!blockSizeLocation) throw new Error(setUniformLocationError(U_BLOCK_SIZE));
        
        /* Set the Uniforms */ 
        gl.uniform1i(imageLocation, 0);
        gl.uniform1i(blockSizeLocation,this.blockSize);
    };

    private static readonly fragmentShader: string = 
        `#version 300 es
        precision mediump float;

        uniform sampler2D u_image;
        uniform int u_block_size;

        in vec2 v_texCoord;
        out vec4 outColor;

        void main() {
            vec2 texelSize = vec2(textureSize(u_image, 0));
            vec2 pixelSize = 1.0 / texelSize;
            vec2 pixelPos = texelSize * v_texCoord;

            float blockSize = float(u_block_size);
            
            vec2 blockUV = floor(pixelPos / blockSize) * blockSize + (blockSize * 0.5);

            blockUV /= texelSize;

            outColor = texture(u_image, blockUV);
        }`;
    }


export default WebGLPixelize;
