import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import GaussianCalculations from '../../../math/gaussianCalculation';
import WebGLShaderPass from "../webGLShaderPass";
import FramebufferPool from "../../../framebuffer_textures/framebufferPool";
import Framebuffer from "../../../framebuffer_textures/framebuffer";

class WebGLStreamlineBlur implements RenderFilter {
    private static readonly MAX_KERNEL_SIZE : number= 200;
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private readonly gaussianCalc : GaussianCalculations;
    private readonly framebufferPool: FramebufferPool;
    private program: WebGLProgram | null = null; 
    private sigmaM : number = 1.0;
    private kernel1D : number[] = [0, 1, 0];
    public kernelSize : number = 3;
    /** 
    */

    constructor (
        wgl:WebGLCore, 
        framebufferPool: FramebufferPool
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        this.gaussianCalc = new GaussianCalculations();
        this.framebufferPool = framebufferPool;
    }

    public init() : void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLStreamlineBlur.fragmentShader, "Streamline Blur Shader");
    }

    public setAttributes(sigmaM : number) {
        this.sigmaM =sigmaM;
        this.kernelSize = this.gaussianCalc.getKernelSize(this.sigmaM);
        this.kernel1D = this.gaussianCalc.get1DGaussianKernel(this.kernelSize, this.sigmaM);
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer  {
        if (! this.program) throw new Error("Streamline blur program is not compiled");
        
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
        

        const TEX_NUM_1 = 0;
        const TEX_NUM_2 = 1;

        const U_KERNEL : string = 'u_kernel';
        const U_DoG : string = 'u_dog';
        const U_KERNEL_SIZE : string = 'u_kernel_size';
        const U_ETF : string = 'u_etf';

        const KERNEL_SIZE : number = this.kernel1D.length;

        const dogLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_DoG);
        const etfLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_ETF);
        const kernelSizeLocation: WebGLUniformLocation | null = gl.getUniformLocation(program, U_KERNEL_SIZE);
        const kernelLocation: WebGLUniformLocation | null = gl.getUniformLocation(program, U_KERNEL);
        
        if (!kernelLocation) throw new Error(setUniformLocationError(U_KERNEL));
        if (!dogLocation) throw new Error(setUniformLocationError(U_DoG));
        if (!etfLocation) throw new Error(setUniformLocationError(U_ETF));
        if (!kernelSizeLocation) throw new Error(setUniformLocationError(U_KERNEL_SIZE));        
        if (KERNEL_SIZE > WebGLStreamlineBlur.MAX_KERNEL_SIZE)  
            throw new Error(`Kernel size ${KERNEL_SIZE} exceeds maximum supported size of ${WebGLStreamlineBlur.MAX_KERNEL_SIZE}.`);

        /* Set the Uniforms */ 
        gl.uniform1i(dogLocation, TEX_NUM_1);
        gl.uniform1i(etfLocation, TEX_NUM_2);
        gl.uniform1i(kernelSizeLocation, KERNEL_SIZE);
        gl.uniform1fv(kernelLocation, this.kernel1D);
    };

    public setKernelSize(size : number) {
        this.kernelSize = this.gaussianCalc.getKernelSize(size);
        this.kernel1D = this.gaussianCalc.get1DGaussianKernel(size, this.sigmaM);
    }

    private static readonly fragmentShader: string = 
        `#version 300 es
        precision mediump float;

        uniform sampler2D u_dog; // Our edge Difference of Gaussian
        uniform sampler2D u_etf; // Edge Tangent Flow
        uniform int u_kernel_size; // Kernel Size
        uniform float u_kernel[200]; // kernel array with a max size of 200

        in vec2 v_texCoord;

        out vec4 outColor;

        vec2 normalizeVector(vec2 vector){
            float len = length(vector);
            if (len < 1e-4) return vec2(1.0, 0.0); // default direction (e.g., horizontal)
            else return normalize(vector);
        }

        void main() {
            vec4 colorSum = texture(u_dog, v_texCoord) * u_kernel[0];
            
            int halfSize = u_kernel_size / 2; // Half the kernel Size
            vec2 texelSize = vec2(1.0) / vec2(textureSize(u_dog, 0));
            
            // Forward Sum;
            vec2 coord = v_texCoord;
            for (int i = 1 ; i <= halfSize; i++) {
                vec2 vector = normalizeVector(texture(u_etf, coord).rg);
                vec2 step = vector * texelSize;
                coord += step;
                coord = clamp(coord, vec2(0.0), vec2(1.0));
                colorSum += texture(u_dog, coord) * u_kernel[i];
            }

            // Backward Sum;
            coord = v_texCoord;
            for (int i = 1 ; i <= halfSize; i++) {
                vec2 vector = normalizeVector(texture(u_etf, coord).rg);
                vec2 step = vector * texelSize;
                coord -= step;
                coord = clamp(coord, vec2(0.0), vec2(1.0));
                colorSum += texture(u_dog, coord) * u_kernel[i];
            }
            
            outColor = colorSum;
        }`;
}


export default WebGLStreamlineBlur;
