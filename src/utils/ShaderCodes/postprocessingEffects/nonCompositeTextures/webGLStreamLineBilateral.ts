import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import GaussianCalculations from '../../../math/gaussianCalculation';
import FramebufferPair from "../../../framebuffer_textures/framebufferPair";

class WebGLStreamlineBilateral implements RenderFilter {
    private static readonly MAX_KERNEL_SIZE : number= 200;
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private readonly gaussianCalc : GaussianCalculations;
    
    private program: WebGLProgram | null = null; 
    private sigmaE : number = 1.0;
    private sigmaRangeE : number = 1.0;
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

    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader()
        this.gaussianCalc = new GaussianCalculations();
    }

    public init () : void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLStreamlineBilateral.fragmentShader, "Streamline Bilateral Shader");
    }

    public setAttributes (sigmaE : number, sigmaRangeE : number) {
        this.sigmaE = sigmaE;
        this.sigmaRangeE = sigmaRangeE;
        this.kernelSize = this.gaussianCalc.getKernelSize(this.sigmaE);
        this.kernel1D = this.gaussianCalc.get1DGaussianKernel(this.kernelSize, this.sigmaE);
    }

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        if (!this.program) throw new Error("Streamline Bilateral is not compiled");

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
        if (!this.program) throw new Error("Streamline Bilateral is not compiled");

        const gl : WebGL2RenderingContext = this.wgl.gl;
        const TEX_NUM_1 : number  = 0;
        const TEX_NUM_2 : number = 1;

        const U_SIGMA_RANGE : string = 'u_sigma_range';
        const U_KERNEL : string = 'u_kernel';
        const U_IMAGE : string = 'u_image';
        const U_KERNEL_SIZE : string = 'u_kernel_size';
        const U_ETF : string = 'u_etf';

        const KERNEL_SIZE : number = this.kernel1D.length;

        const dogLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_IMAGE);
        const etfLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_ETF);
        const kernelSizeLocation: WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_KERNEL_SIZE);
        const kernelLocation: WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_KERNEL);
        const sigmaRangeLocation: WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_SIGMA_RANGE);

        if (!kernelLocation) throw new Error(setUniformLocationError(U_KERNEL));
        if (!dogLocation) throw new Error(setUniformLocationError(U_IMAGE));
        if (!etfLocation) throw new Error(setUniformLocationError(U_ETF));
        if (!kernelSizeLocation) throw new Error(setUniformLocationError(U_KERNEL_SIZE));        
        if (!sigmaRangeLocation) throw new Error(setUniformLocationError(U_SIGMA_RANGE));

        if (KERNEL_SIZE > WebGLStreamlineBilateral.MAX_KERNEL_SIZE)  
            throw new Error(`Kernel size ${KERNEL_SIZE} exceeds maximum supported size of ${WebGLStreamlineBilateral.MAX_KERNEL_SIZE}.`);

        /* Set the Uniforms */ 
        gl.uniform1i(dogLocation, TEX_NUM_1);
        gl.uniform1i(etfLocation, TEX_NUM_2);
        gl.uniform1i(kernelSizeLocation, KERNEL_SIZE);
        gl.uniform1fv(kernelLocation, this.kernel1D);
        gl.uniform1f(sigmaRangeLocation, this.sigmaRangeE);
    };

    private static readonly fragmentShader: string = 
    `#version 300 es
    precision mediump float;

    uniform sampler2D u_image; // Our edge Difference of Gaussian
    uniform sampler2D u_etf; // Edge Tangent Flow
    uniform int u_kernel_size; // Kernel Size
    uniform float u_kernel[200]; // kernel array with a max size of 200
    uniform float u_sigma_range;
    in vec2 v_texCoord;

    out vec4 outColor;

    vec2 normalizeVector(vec2 vector){
        float len = length(vector);
        if (len < 1e-4) return vec2(1.0, 0.0); // default direction (e.g., horizontal)
        else return normalize(vector);
    }

    void main() {
        vec3 sum = vec3(0.0);
        int halfSize = u_kernel_size / 2; // Half the kernel Size
        vec2 texelSize = vec2(1.0) / vec2(textureSize(u_image, 0));
        vec3 centerColor = texture(u_image, v_texCoord).rgb;


        // Forward Sum;
        vec2 coord = v_texCoord;

        float total = 0.0;
        for (int i = 1 ; i <= halfSize; i++) {
            vec2 vector = normalizeVector(texture(u_etf, coord).rg);
            vec2 step = vector * texelSize; // go to the next texel directed by the etf
            coord += step;

            coord = clamp(coord, vec2(0.0), vec2(1.0));
            vec3 offsetColor = texture(u_image, coord).rgb;

            vec3 colorDifference = centerColor - offsetColor;
            float rangeWeight = exp(-dot(colorDifference, colorDifference) / (2.0 * u_sigma_range * u_sigma_range));

            float spatialWeight = u_kernel[i];
            float weight = rangeWeight * spatialWeight;

            sum += offsetColor * weight;
            total += weight;
        }

        // Backward Sum;
        coord = v_texCoord;
        for (int i = 1 ; i <= halfSize; i++) {
            vec2 vector = normalizeVector(texture(u_etf, coord).rg);
            vec2 step = vector * texelSize; // go to the next texel directed by the etf
            coord -= step;

            coord = clamp(coord, vec2(0.0), vec2(1.0));
            
            vec3 offsetColor = texture(u_image, coord).rgb;

            vec3 colorDifference = centerColor - offsetColor;

            float rangeWeight = exp(-dot(colorDifference, colorDifference) / (2.0 * u_sigma_range * u_sigma_range));
            float spatialWeight = u_kernel[i];

            float weight = rangeWeight * spatialWeight;

            sum += offsetColor * weight;
            total += weight;
        }

        sum += centerColor * u_kernel[halfSize]; // exponential of zero is one (range weight will be 1 at the center);
        total += u_kernel[halfSize];
        outColor = vec4(sum / total, 1.0);
    }`;
}


export default WebGLStreamlineBilateral;
