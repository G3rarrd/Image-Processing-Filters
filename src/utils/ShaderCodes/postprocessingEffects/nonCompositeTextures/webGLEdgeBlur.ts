import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import GaussianCalculations from '../../../math/gaussianCalculation';
import WebGLShaderPass from "../webGLShaderPass";
import FramebufferPool from '../../../framebuffer_textures/framebufferPool';
import Framebuffer from "../../../framebuffer_textures/framebuffer";

class WebGLEdgeBlurPass implements RenderFilter {
    private static readonly MAX_KERNEL_SIZE : number= 1000;
    private readonly wgl : WebGLCore;
    private readonly framebufferPool : FramebufferPool;
    private readonly postProcessing : PostProcessingVertexShader;
    private program: WebGLProgram | null = null; 
    private sigmaE : number = 1.6;
    private kernel1D : number[] = [0, 1, 0];
    private gaussianCalc : GaussianCalculations;
    public kernelSize : number = 3;
    /**
     * 
    */

    constructor (
        wgl:WebGLCore, 
        framebufferPool : FramebufferPool
    ) {
        this.wgl = wgl;
        this.framebufferPool = framebufferPool;
        this.postProcessing = new PostProcessingVertexShader();
        this.gaussianCalc = new GaussianCalculations();
    }

    public init() {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLEdgeBlurPass.fragmentShader, "Edge Blur Pass Shader");
    }

    public setAttributes(sigmaE : number) {
        this.sigmaE = sigmaE;
        this.kernelSize = this.gaussianCalc.getKernelSize(this.sigmaE); 
        this.kernel1D = this.gaussianCalc.get1DGaussianKernel(this.kernelSize, sigmaE);
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer  {
         /**
         * Accepts 2 textures
         * @param inputTextures[0] : Original Image or edited Texture
         * @param inputTextures[1] : Edge Tangent Flow texture
        */
        
        if (! this.program) throw new Error("Edge Blur Pass Shader program is not compiled");
        
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

        const U_IMAGE : string = 'u_image';
        const U_ETF : string = 'u_etf';
        const U_KERNEL : string = 'u_kernel';
        const U_KERNEL_SIZE : string = 'u_kernel_size';

        const KERNEL_SIZE : number = this.kernel1D.length;

        const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_IMAGE);
        const etfLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_ETF);
        const kernelSizeLocation: WebGLUniformLocation | null = gl.getUniformLocation(program, U_KERNEL_SIZE);
        const kernelLocation: WebGLUniformLocation | null = gl.getUniformLocation(program, U_KERNEL);
        
        if (!kernelLocation) throw new Error(setUniformLocationError(U_KERNEL));
        if (!imageLocation) throw new Error(setUniformLocationError(U_IMAGE));
        if (!etfLocation) throw new Error(setUniformLocationError(U_ETF));
        if (!kernelSizeLocation) throw new Error(setUniformLocationError(U_KERNEL_SIZE));        
        if (KERNEL_SIZE > WebGLEdgeBlurPass.MAX_KERNEL_SIZE)  
            throw new Error(`Kernel size ${KERNEL_SIZE} exceeds maximum supported size of ${WebGLEdgeBlurPass.MAX_KERNEL_SIZE}.`);

        /* Set the Uniforms */ 
        gl.uniform1i(imageLocation, TEX_NUM_1);
        gl.uniform1i(etfLocation, TEX_NUM_2);
        gl.uniform1i(kernelSizeLocation, KERNEL_SIZE);
        gl.uniform1fv(kernelLocation, this.kernel1D);
    };

    public setKernelSize(size : number) {
        this.kernelSize = this.gaussianCalc.getKernelSize(size);
        this.kernel1D = this.gaussianCalc.get1DGaussianKernel(size, this.sigmaE);
    }

    private static readonly fragmentShader: string = 
        `#version 300 es
        precision mediump float;

        #define MAX_KERNEL_SIZE 1000

        uniform float u_p; // Scalar number
        uniform sampler2D u_image; // Our texture
        uniform sampler2D u_etf; // Edge Tangent Flow
        uniform int u_kernel_size; // Kernel Size
        uniform float u_kernel[MAX_KERNEL_SIZE]; // kernel array with a max size of 1000

        in vec2 v_texCoord;

        out vec4 outColor;

        void main() {
            vec2 onePixel = vec2(1.0) / vec2(textureSize(u_image, 0));

            vec4 colorSum = vec4(0.0);
            vec2 vector = texture(u_etf, v_texCoord).rg;

            float len = length(vector);
            if (len < 1e-4) {
                vector = vec2(1.0, 0.0); // default direction (e.g., horizontal)
            } else {
                vector = normalize(vector);
            }

            // Perpendicular
            float x = -vector.g; // g -> y
            float y = vector.r; // r -> x

            int halfSize = u_kernel_size / 2; // Half the kernel Size

            vec2 tangentOffset = vec2(x, y) * onePixel;
            for (int i = -halfSize; i <= halfSize; ++i) {
                vec2 offset = tangentOffset * float(i);
                colorSum += texture(u_image, v_texCoord + offset) * u_kernel[halfSize + i];
            }
            
            outColor = colorSum;
        }`;
}


export default WebGLEdgeBlurPass;
