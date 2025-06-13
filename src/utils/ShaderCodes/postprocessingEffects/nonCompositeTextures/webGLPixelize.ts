import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import WebGLShaderPass from "../webGLShaderPass";
import FramebufferPool from "../../../framebuffer_textures/framebufferPool";
import { RangeSlidersProps } from "../../../../types/slider";

class WebGLPixelize implements RenderFilter {
    private program: WebGLProgram|null = null; 
    private readonly wgl : WebGLCore;
    private readonly framebufferPool : FramebufferPool;
    private readonly postProcessing : PostProcessingVertexShader;
    private  blockSize : number = 10;
    public config : RangeSlidersProps[];
    
    /** 
    *  
    */

    constructor (
        wgl:WebGLCore, 
        framebufferPool : FramebufferPool
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        this.framebufferPool = framebufferPool;   
        this.config = [{
            min: 1,
            max: 1000,
            step : 1,
            value: this.blockSize,
            label: "Block Size"
        }];
    }

    public init() {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLPixelize.fragmentShader, "Pixelize Shader");
    }

    public setAttributes(blockSize : number ){
        this.blockSize = blockSize;
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer  {
        if (!this.program) throw new Error("Pixelize program is not compiled");
        
        const pass = new WebGLShaderPass(
            this.wgl, 
            this.program, 
            this.framebufferPool,
            this.postProcessing,
            (gl, program) => this.setUniforms(gl, program),
        )

        return pass.execute(inputTextures, textureWidth, textureHeight);
    }

    private setUniforms (gl: WebGL2RenderingContext, program: WebGLProgram) : void {
        const U_IMAGE : string = 'u_image';
        const U_BLOCK_SIZE : string = 'u_block_size';

        const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_IMAGE);
        const blockSizeLocation: WebGLUniformLocation | null = gl.getUniformLocation(program,U_BLOCK_SIZE);
        
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
            vec2 pixelSize = vec2(textureSize(u_image, 0));
            vec2 texelSize = 1.0 / pixelSize;
            vec2 pixelPos = pixelSize * v_texCoord;

            float blockSize = float(u_block_size);
            
            vec2 blockUV = floor(pixelPos / blockSize) * blockSize + (blockSize * 0.5);

            blockUV /= pixelSize;

            outColor = texture(u_image, blockUV);
        }`;
    }


export default WebGLPixelize;
