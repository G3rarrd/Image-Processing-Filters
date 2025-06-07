import FramebufferPair from "../../../framebuffer_textures/framebufferPair";
import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { RenderFilter } from "../webGLRenderFilter";

class WebGLSubtract implements RenderFilter {
    public program : WebGLProgram | null = null;
    private wgl : WebGLCore;
    private postProcessing : PostProcessingVertexShader;
    constructor (wgl: WebGLCore) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        
    }

    public init() : void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLSubtract.fragmentShader, "Subtract Shader");
    }

    private setUniforms() : void {
        if (! this.program) throw new Error("Subtract Program is not compiled");

        const gl  = this.wgl.gl;
        const imageLocation1 = gl.getUniformLocation(this.program, "u_image1");
        const imageLocation2 = gl.getUniformLocation(this.program, "u_image2");
        if (imageLocation1 === null || imageLocation2 === null) throw new Error("Failed to get uniform location for u_image1 or u_image2");
        gl.uniform1i(imageLocation1, 0);
        gl.uniform1i(imageLocation2, 1);
    }

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        if (! this.program) throw new Error("Subtract Program is not compiled");
        
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
    private static readonly fragmentShader = 
        `#version 300 es
        precision mediump float;
        uniform sampler2D u_image1;
        uniform sampler2D u_image2;
        in vec2 v_texCoord;
        out vec4 outColor; 

        void main() {
            vec4 color1 = texture(u_image1, v_texCoord);
            vec4 color2 = texture(u_image2, v_texCoord);

            vec3 subtract = vec3(color1) - vec3(color2) ;

            outColor = vec4(subtract, 1.0);
        }`
}

export default WebGLSubtract;