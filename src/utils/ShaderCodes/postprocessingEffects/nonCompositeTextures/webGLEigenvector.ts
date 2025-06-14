import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from '../../vertexShaders/postProcessingVertexShader';
import WebGLShaderPass from "../webGLShaderPass";
import FramebufferPool from "../../../framebuffer_textures/framebufferPool";
import Framebuffer from "../../../framebuffer_textures/framebuffer";
import { setUniformLocationError } from "../webGLGetUniformErrorText";

class WebGLEigenvector implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private readonly framebufferPool: FramebufferPool;
    private program: WebGLProgram | null = null; 
    
    constructor (
        wgl:WebGLCore, 
        framebufferPool: FramebufferPool,
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
        this.framebufferPool = framebufferPool;
    }

    public init() {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLEigenvector.fragmentShader, "Eigenvector Shader");
    }

    public render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) : Framebuffer  {
        if (! this.program) throw new Error("Eigenvector Shader program is not compiled");
        
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
        const TEX_NUM : number = 0;
        const U_BLURRED_STRUCTURED_TENSOR : string = "u_blurred_structured_tensor";
        const tensorLocation = gl.getUniformLocation(program, U_BLURRED_STRUCTURED_TENSOR);

        if (!tensorLocation) throw new Error(setUniformLocationError(U_BLURRED_STRUCTURED_TENSOR));
        gl.uniform1i(tensorLocation, TEX_NUM);
    };
    /**
     * Ensure the image is a blurred structured tensor
    */
    private static readonly fragmentShader = 
    `#version 300 es
    precision mediump float;

    uniform sampler2D u_blurred_structured_tensor;

    out vec4 outColor;
    
    
    in vec2 v_texCoord;


    

    void main () {
        vec4 color = texture(u_blurred_structured_tensor, v_texCoord);
        vec3 tensor = color.xyz; // blurred tensor values
        float trace = tensor.y + tensor.x ;
        float det_term = sqrt((tensor.x - tensor.y)*(tensor.x - tensor.y) + 4.0 * tensor.z* tensor.z);
        
        float lambda1 =  0.5 * (trace + det_term);
        float lambda2 =  0.5 * (trace - det_term );

        vec2 vector = vec2(lambda1 - tensor.x, -tensor.z);
        vec2 t = (length(vector) > 0.0) 
                    ? normalize(vector) 
                    : (vector.x > vector.y ? vec2(1.0, 0.0) 
                    : vec2(0.0, 1.0));

        float A = lambda1 + lambda2 > 0.0 ? lambda1 - lambda2 / lambda1 + lambda2 : 0.0;

        outColor = vec4((t), A, 1.0);
    }
    `;

}

export default WebGLEigenvector;
