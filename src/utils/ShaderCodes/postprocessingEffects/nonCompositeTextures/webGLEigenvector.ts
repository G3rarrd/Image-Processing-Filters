import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from '../../vertexShaders/postProcessingVertexShader';
import FramebufferPair from "../../../framebuffer_textures/framebufferPair";

class WebGLEigenvector implements RenderFilter {
    private readonly wgl : WebGLCore;
    private readonly postProcessing : PostProcessingVertexShader;
    private program: WebGLProgram | null = null; 
    
    constructor (
        wgl:WebGLCore, 
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader();
    }

    public init() {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLEigenvector.fragmentShader, "Eigenvector Shader");
    }

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        if (! this.program) throw new Error("Eigenvector Shader program is not compiled");
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
    
    private setUniforms = () => {
        if (! this.program) throw new Error("Eigenvector Shader program is not compiled");

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

    out vec4 outColor;
    
    
    in vec2 v_texCoord;

    vec2 complexSqrt (vec2 z) {
        float x = z.x; // real number
        float y = z.y; // imaginary number 

        float magnitude = sqrt(x*x + y*y);
        float angle = atan(y, x) / 2.0; // Phase angle; 

        float realPart = magnitude * cos(angle);
        float imagPart = magnitude * sin(angle);

        return vec2(realPart, imagPart);
    }

    vec2 eigenvalue(vec3 tensor) {
        float xx = tensor.r;
        float yy = tensor.g;
        float xy = tensor.b;

        float trace = xx + yy;
        float determinant = (xx * yy) - (xy*xy);
        float discriminant = trace * trace - 4.0 * determinant;

        float root1 = 0.0;
        float root2 = 0.0;
        if (discriminant >= 0.0) {
            root1 = (trace + sqrt(discriminant)) / 2.0;
            root2 = (trace - sqrt(discriminant)) / 2.0;
            return vec2(root1, root2);
        } 
        
        float realPart = trace / 2.0;
        float imagPart = sqrt(-discriminant) / 2.0;
        
        return vec2(realPart, imagPart);
    }

    

    void main () {
        vec4 color = texture(u_image, v_texCoord);
        vec3 tensor = color.rgb;
        vec2 lambdas = eigenvalue(tensor);

        float selectedLambda = abs(lambdas.x) < abs(lambdas.y) ? lambdas.x : lambdas.y;
        float xx = tensor.r; // xx component
        float yy = tensor.g; // yy component
        float xy = tensor.b; // xy component

        vec2 eigenvector = vec2(0.0);
        if (abs(xy) > 1.0e-7) {
            eigenvector = normalize(vec2(selectedLambda - yy, xy));
        } else {
            // Fallback to x- or y-axis aligned direction
            eigenvector = vec2(0.0, 1.0);
        }
            
        

        outColor = vec4((eigenvector), 0.0, 1.0);
    }
    `;

}

export default WebGLEigenvector;
