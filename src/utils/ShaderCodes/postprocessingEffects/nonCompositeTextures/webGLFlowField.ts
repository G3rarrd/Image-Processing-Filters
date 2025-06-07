import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from '../../vertexShaders/postProcessingVertexShader';
import FramebufferPair from "../../../framebuffer_textures/framebufferPair";

class WebGLFlowField implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private program: WebGLProgram | null = null; 

    /**
    */
    
    constructor (
        wgl:WebGLCore, 
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
    }

    public init() {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLFlowField.fragmentShader, "Flow Field Shader");
    }

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        if (! this.program) throw new Error("Flow Field Shader is not compiled");

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


    // private setMaxAndMinMagnitude(width : number, height : number) {
    //     const gl = this.wgl.gl;
    //     const pixelData = new Float32Array(width * height * 4);
    //     // gl.readPixels(0, 0, width, height, gl.RGBA, gl.FLOAT, pixelData);
    //     // this.updateMinMaxFromPixels(pixelData);
    // }

    // private updateMinMaxFromPixels(pixelData: Float32Array) {
    //     /* Resets the min and max magnitude for each call */ 
    //     this.minMagnitude = Infinity; 
    //     this.maxMagnitude = -Infinity;
    //     for (let i = 0; i < pixelData.length; i += 4) {
    //         const magnitude = pixelData[i + 2];
    //         if (!isFinite(magnitude)) continue; // Skip Nans/infs
    //         this.minMagnitude = Math.min(this.minMagnitude, magnitude)
    //         this.maxMagnitude = Math.max(this.maxMagnitude, magnitude)
    //     }
    // }


    

    private setUniforms = () => {
        if (! this.program) throw new Error("Flow Field Shader is not compiled");

        const gl : WebGL2RenderingContext = this.wgl.gl;
        const TEX_NUM : number = 0;

        const imageLocation = gl.getUniformLocation(this.program, "u_image");

        if (!imageLocation) throw new Error("Image cannot be found");
        gl.uniform1i(imageLocation, TEX_NUM);
    };

    private static readonly fragmentShader = 
    `#version 300 es
    precision mediump float;

    uniform sampler2D u_image;

    in vec2 v_texCoord;

    out vec4 outColor;

    float calcGrayScale(in vec4 col) {
        const vec3 kernel = vec3(0.2126, 0.7152, 0.0722); // Luminance
        return dot(kernel, col.rgb);
    }

    vec2 getPerpendicularVec(in vec2 v) {
        return vec2(v.y, -v.x);
    }

    vec2 sobelFilter() {
        vec2 onePixel = vec2(1.0) / vec2(textureSize(u_image, 0));
        vec2 uv = v_texCoord;

        const vec3 kernel0 = vec3(-1.0, -2.0, -1.0);
        const vec3 kernel1 = vec3( 1.0,  2.0,  1.0);

        vec4 c00 = texture(u_image, uv + vec2(-1.0, -1.0) * onePixel);
        vec4 c01 = texture(u_image, uv + vec2( 0.0, -1.0) * onePixel);
        vec4 c02 = texture(u_image, uv + vec2( 1.0, -1.0) * onePixel);

        vec4 c10 = texture(u_image, uv + vec2(-1.0,  0.0) * onePixel);
        vec4 c12 = texture(u_image, uv + vec2( 1.0,  0.0) * onePixel);

        vec4 c20 = texture(u_image, uv + vec2(-1.0,  1.0) * onePixel);
        vec4 c21 = texture(u_image, uv + vec2( 0.0,  1.0) * onePixel);
        vec4 c22 = texture(u_image, uv + vec2( 1.0,  1.0) * onePixel);

        float y00 = calcGrayScale(c00);
        float y01 = calcGrayScale(c01);
        float y02 = calcGrayScale(c02);
        float y10 = calcGrayScale(c10);
        float y12 = calcGrayScale(c12);
        float y20 = calcGrayScale(c20);
        float y21 = calcGrayScale(c21);
        float y22 = calcGrayScale(c22);

        float u = 0.0;
        u += dot(kernel0, vec3(y00, y10, y20));
        u += dot(kernel1, vec3(y02, y12, y22));

        float v = 0.0;
        v += dot(kernel0, vec3(y00, y01, y02));
        v += dot(kernel1, vec3(y20, y21, y22));

        return vec2(u, v); 
    }

    void main() {
        vec2 grad = sobelFilter();
        float mag = length(grad);
        grad = getPerpendicularVec(grad);
        outColor = vec4(grad, mag, 1.0);
    }`;
}

export default WebGLFlowField;
