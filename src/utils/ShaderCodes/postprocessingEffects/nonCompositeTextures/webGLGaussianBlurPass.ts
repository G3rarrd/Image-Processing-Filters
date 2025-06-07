import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import FramebufferPair from "../../../framebuffer_textures/framebufferPair";

class WebGLGaussianBlurPass implements RenderFilter {
    private static readonly MAX_KERNEL_SIZE : number= 200;
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private program: WebGLProgram | null = null; 
    private  kernel1D : number[] = [0,1,0];
    private  direction: [number, number] = [0, 1]; // Either (1, 0) or (0, 1);
    
    /** 
    * Creates a Gaussian blur pass with a 1D convolution kernel.
    *  
    * @param direction - The blur direction: `[1, 0]` for horizontal, `[0, 1]` for vertical direction
    * @param kernel1D - A 1D array of weights for the Gaussian kernel. Must be symmetric and normalized.
    * @param wgl - The WebGLCore context to use for rendering
    */

    constructor (
        wgl:WebGLCore, 
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
    }

    public init() : void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLGaussianBlurPass.fragmentShader, "Gaussian Blur");
    }

    public setAttributes(kernel1D : number[], direction: [number, number] ){
        this.kernel1D = kernel1D;
        this.direction = direction;
    }

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        if (! this.program) throw new Error("Gaussian blur pass is not compiled");

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
        if (! this.program) throw new Error("Gaussian blur pass is not compiled");
        
        const gl : WebGL2RenderingContext = this.wgl.gl;

        const U_DIRECTION : string = 'u_direction';
        const U_KERNEL : string = 'u_kernel';
        const U_IMAGE : string = 'u_image';
        const U_KERNEL_SIZE : string = 'u_kernel_size'
        const KERNEL_SIZE : number = this.kernel1D.length;

        const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_IMAGE);
        const kernelSizeLocation: WebGLUniformLocation | null = gl.getUniformLocation(
            this.program,
            U_KERNEL_SIZE
        );

        const kernelLocation: WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_KERNEL);
        const directionLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_DIRECTION);
        
        if (!kernelLocation) throw new Error(setUniformLocationError(U_KERNEL));
        if (!imageLocation) throw new Error(setUniformLocationError(U_IMAGE));
        if (! kernelSizeLocation) throw new Error(setUniformLocationError(U_KERNEL_SIZE));
        if (! directionLocation) throw new Error(setUniformLocationError(U_DIRECTION))
        if (KERNEL_SIZE > WebGLGaussianBlurPass.MAX_KERNEL_SIZE)  
            throw new Error(`Kernel size ${KERNEL_SIZE} exceeds maximum supported size of ${WebGLGaussianBlurPass.MAX_KERNEL_SIZE}.`);

        /* Set the Uniforms */ 
        gl.uniform1i(imageLocation, 0);
        gl.uniform1i(kernelSizeLocation, KERNEL_SIZE);
        gl.uniform1fv(kernelLocation, this.kernel1D);
        gl.uniform2f(directionLocation, this.direction[0], this.direction[1]);
    };

    private static readonly fragmentShader: string = 
    `#version 300 es
    precision mediump float;

    #define MAX_KERNEL_SIZE 200

    uniform sampler2D u_image; // Our texture
    uniform int u_kernel_size; // The Kernel Size
    uniform float u_kernel[MAX_KERNEL_SIZE]; // kernel array with a max size of 200
    uniform vec2 u_direction;

    in vec2 v_texCoord;

    out vec4 outColor;

    void main() {
        vec2 texelSize = 1.0 / vec2(textureSize(u_image, 0));
        vec4 colorSum = vec4(0.0);
        int halfSize = u_kernel_size / 2; // Half the kernel Size

        for (int i = -halfSize; i <= halfSize; ++i) {
            vec2 offset = float(i) * u_direction * texelSize;
            colorSum += texture(u_image, v_texCoord + offset) * u_kernel[halfSize + i];
        }
        
        outColor = colorSum;
    }
    `;
}


export default WebGLGaussianBlurPass;
