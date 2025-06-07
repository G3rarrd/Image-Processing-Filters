import FramebufferPair from "../../../framebuffer_textures/framebufferPair";
import WebGLCore from "../../../webGLCore";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { RenderFilter } from "../webGLRenderFilter";
import { setUniformLocationError } from "../webGLGetUniformErrorText";

class WebGLSubtractFDoG implements RenderFilter{
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    public program : WebGLProgram | null = null;
    private p : number = 1.0; // Variable name based on the paper
    constructor (wgl: WebGLCore) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
    }

    public setAttributes(p : number) {
        this.p = p;
    }

    public init () : void {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLSubtractFDoG.fragmentShader, "Subtract FDoG Shader");
    }

    private setUniforms() : void  {
        if (!this.program) throw new Error ("Subtract FDoG program is not compiled"); 
        
        const gl  = this.wgl.gl;

        const TEX_NUM : number = 0;
        const TEX_NUM_1 : number = 1;
        const U_IMAGE_1 : string = 'u_image_1';
        const U_IMAGE_2 : string = 'u_image_2';
        const U_P : string = 'u_p';
        
        const imageLocation1 : WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_IMAGE_1);
        const imageLocation2 : WebGLUniformLocation | null  = gl.getUniformLocation(this.program, U_IMAGE_2);
        const pLocation : WebGLUniformLocation | null = gl.getUniformLocation(this.program, U_P);

        if (imageLocation1 === null) throw new Error(setUniformLocationError(U_IMAGE_1));
        if (imageLocation2 === null) throw new Error(setUniformLocationError(U_IMAGE_2));
        if (pLocation == null) throw new Error(setUniformLocationError(U_P))
        
        gl.uniform1i(imageLocation1, TEX_NUM);
        gl.uniform1i(imageLocation2, TEX_NUM_1);
        gl.uniform1f(pLocation, this.p);
    }

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        const textureCount : number = inputTextures.length;
        
        if (textureCount != 2 ) {
            console.error(`Subtract FDoG Shader requires 2 textures. ${textureCount} was provided`); 
            return fboPair.write().getTexture(); 
        }

        if (!this.program) throw new Error ("Subtract FDoG program is not compiled"); 
        
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
        uniform sampler2D u_image_1;
        uniform sampler2D u_image_2;
        uniform float u_p;

        in vec2 v_texCoord;
        out vec4 outColor; 

        void main() {
            vec4 color1 = texture(u_image_1, v_texCoord);
            vec4 color2 = texture(u_image_2, v_texCoord);

            vec3 subtract = vec3(color1) - (u_p * vec3(color2)) ;

            outColor = vec4(subtract, 1.0);
        }`
}

export default WebGLSubtractFDoG;