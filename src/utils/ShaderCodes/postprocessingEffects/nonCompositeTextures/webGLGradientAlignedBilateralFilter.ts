import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import GaussianCalculations from '../../../math/gaussianCalculation';
import WebGLShaderPass from "../webGLShaderPass";
import FramebufferPool from '../../../framebuffer_textures/framebufferPool';
import Framebuffer from "../../../framebuffer_textures/framebuffer";

class WebGLGradientAlignedBilateral implements RenderFilter {
    private static readonly MAX_KERNEL_SIZE : number = 200;
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private readonly gaussianCalc : GaussianCalculations;
    private readonly framebufferPool : FramebufferPool;
    private program: WebGLProgram | null = null; 

    private sigmaG : number = 1.0;
    private rangeSigmaG : number = 1.0;
    private kernel1D : number[] = [0, 1, 0];
    public kernelSize : number = 3;
    /** 
    * Creates a Gaussian blur pass with a 1D convolution kernel.
    *  
    * @param kernel1D - A 1D array of weights for the Gaussian kernel. Must be symmetric and normalized.
    * @param wgl - The WebGLCore context to use for rendering
    */

    constructor (
        wgl:WebGLCore, 
        framebufferPool : FramebufferPool,
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader()
        this.gaussianCalc = new GaussianCalculations();
        this.framebufferPool = framebufferPool;
    }

    public init() {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLGradientAlignedBilateral.fragmentShader, "Gradient Aligned Bilateral Shader");
    }

    public setAttribute(sigmaG : number, rangeSigmaG : number) : void {
        this.sigmaG = sigmaG;
        this.rangeSigmaG = rangeSigmaG;
        this.kernelSize = this.gaussianCalc.getKernelSize(this.sigmaG);
        this.kernel1D = this.gaussianCalc.get1DGaussianKernel(this.kernelSize, this.sigmaG);
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer  {
        if (!this.program) throw new Error("Gradient Aligned Bilateral is not compiled");
        
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
        const U_IMAGE : string = 'u_image';
        const U_KERNEL_SIZE : string = 'u_kernel_size';
        const U_ETF : string = 'u_etf';
        const U_SIGMA_RANGE : string = 'u_sigma_range';
        
        const KERNEL_SIZE : number = this.kernel1D.length;

        const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_IMAGE);
        const etfLocation : WebGLUniformLocation | null = gl.getUniformLocation(program, U_ETF);
        const kernelSizeLocation: WebGLUniformLocation | null = gl.getUniformLocation(program, U_KERNEL_SIZE);
        const sigmaRangeLocation: WebGLUniformLocation | null = gl.getUniformLocation(program, U_SIGMA_RANGE);
        const kernelLocation: WebGLUniformLocation | null = gl.getUniformLocation(program, U_KERNEL);
        
        if (!kernelLocation) throw new Error(setUniformLocationError(U_KERNEL));
        if (!sigmaRangeLocation) throw new Error(setUniformLocationError(U_SIGMA_RANGE));
        if (!imageLocation) throw new Error(setUniformLocationError(U_IMAGE));
        if (!etfLocation) throw new Error(setUniformLocationError(U_ETF));
        if (!kernelSizeLocation) throw new Error(setUniformLocationError(U_KERNEL_SIZE));        
        if (KERNEL_SIZE > WebGLGradientAlignedBilateral.MAX_KERNEL_SIZE)  
            throw new Error(`Kernel size ${KERNEL_SIZE} exceeds maximum supported size of ${WebGLGradientAlignedBilateral.MAX_KERNEL_SIZE}.`);

        /* Set the Uniforms */ 
        gl.uniform1i(imageLocation, TEX_NUM_1);
        gl.uniform1i(etfLocation, TEX_NUM_2);
        gl.uniform1i(kernelSizeLocation, KERNEL_SIZE);
        gl.uniform1f(sigmaRangeLocation, this.rangeSigmaG);
        gl.uniform1fv(kernelLocation, this.kernel1D);
    };


    private static readonly fragmentShader: string = 
    `#version 300 es
    precision mediump float;

    uniform sampler2D u_image; // Our texture
    uniform sampler2D u_etf; // Edge Tangent Flow
    uniform int u_kernel_size; // Kernel Size
    uniform float u_kernel[200]; // kernel array with a max size of 100
    uniform float u_sigma_range; // gaussian sigma of difference of colors

    in vec2 v_texCoord;

    out vec4 outColor;

    void main() {
        vec2 onePixel = vec2(1.0) / vec2(textureSize(u_image, 0));

        
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

        vec3 centerColor = texture(u_image, v_texCoord).rgb;
        vec2 centerTangent = vec2(x, y) * onePixel;
        vec3 sum = vec3(0.0);
        float total = 0.0;
        for (int i = -halfSize; i <= halfSize; ++i) {
            int idx = i + halfSize;
            vec2 offset = centerTangent * float(i);

            vec3 sampleColor = texture(u_image, offset + v_texCoord).rgb;
            float spatialWeight = u_kernel[idx];
            
            vec3 colorDistance = centerColor - sampleColor;
            float rangeWeight = exp(-dot(colorDistance, colorDistance) / (2.0 * u_sigma_range * u_sigma_range ));

            float weight = spatialWeight * rangeWeight;

            sum += sampleColor * weight;
            total += weight;
        }
        
        outColor = vec4(sum / total, 1.0);
    }`;
}


export default WebGLGradientAlignedBilateral;
