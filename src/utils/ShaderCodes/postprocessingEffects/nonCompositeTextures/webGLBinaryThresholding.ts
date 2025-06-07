import FramebufferPair from "../../../framebuffer_textures/framebufferPair";
import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from '../../vertexShaders/postProcessingVertexShader';
import { RenderFilter } from "../webGLRenderFilter";

class WebGLBinaryThreshold implements RenderFilter {
    private wgl : WebGLCore;
    private program : WebGLProgram | null = null;
    private postProcessing : PostProcessingVertexShader;
    private threshold : number =0.01;
    constructor(wgl : WebGLCore) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
    }

    public init() {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLBinaryThreshold.fragmentShader, "Binary Threshold Shader");
    }

    public setAttributes(threshold : number) : void {
        this.threshold = threshold;
    }

    public render(inputTextures  : WebGLTexture[], fboPair : FramebufferPair) {
        if (!this.program) throw new Error("Grayscale program is not compiled");

        const gl : WebGL2RenderingContext = this.wgl.gl;
        fboPair.write().bind();


        this.wgl.clearCanvas(); // removes the previous image on the canvas

        gl.useProgram(this.program);
        gl.bindVertexArray(this.wgl.vao);
            
        gl.activeTexture(gl.TEXTURE0 + 0);
        gl.bindTexture(gl.TEXTURE_2D, inputTextures[0]);

        this.postProcessing.setGlobalUniforms(gl, this.program, fboPair.write().width, fboPair.write().height);
        this.setUniforms();
        
        gl.drawArrays(gl.TRIANGLES, 0, 6); // To draw texture to framebuffer
        gl.bindVertexArray(null);
        gl.useProgram(null);
        fboPair.write().unbind();

        fboPair.swap()
        return fboPair.read().getTexture();
    }

    private setUniforms() {
        if (!this.program) throw new Error("Grayscale program is not compiled");

        const gl : WebGL2RenderingContext = this.wgl.gl;
        const TEX_NUM : number = 0;
        const imageLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program, "u_image");
        const thresholdLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program, "threshold");

        if (! imageLocation) throw new Error("Image cannot be found");
        if (! thresholdLocation) throw new Error("Threshold not found");

        gl.uniform1i(imageLocation, TEX_NUM);
        gl.uniform1f(thresholdLocation, this.threshold);
    } 

    private static readonly fragmentShader = 
    `#version 300 es
    
    precision mediump float;

    uniform sampler2D u_image;
    
    uniform float threshold;
    
    in vec2 v_texCoord;
    
    out vec4 outColor;
    
    void main () {
        vec4 color = texture(u_image, v_texCoord);
        float average = dot(color.rgb, vec3(0.299, 0.587, 0.114));
        float mask = step(threshold, average); // Same as if else but more gpu friendly
        outColor = vec4(vec3(mask), 1.0);
    }`
}

export default WebGLBinaryThreshold;