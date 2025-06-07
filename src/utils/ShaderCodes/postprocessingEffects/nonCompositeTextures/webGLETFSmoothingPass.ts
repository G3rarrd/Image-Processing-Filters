import WebGLCore from "../../../webGLCore";
import { RenderFilter } from "../webGLRenderFilter";
import PostProcessingVertexShader from "../../vertexShaders/postProcessingVertexShader";
import { setUniformLocationError } from "../webGLGetUniformErrorText";
import FramebufferPair from "../../../framebuffer_textures/framebufferPair";
class WebGLETFSmoothingPass implements RenderFilter {
    private readonly  wgl : WebGLCore;
    private readonly  postProcessing : PostProcessingVertexShader;
    private readonly minMagnitude : number = 0;
    private readonly maxMagnitude : number = 1;
    private program: WebGLProgram | null = null; 
    private direction: [number, number] = [0, 1];
    private kernelSize : number = 3;
    
    constructor (
        wgl:WebGLCore, 
    ) {
        this.wgl = wgl;
        this.postProcessing = new PostProcessingVertexShader()
    }

    public init() {
        this.program = this.wgl.compileAndLinkProgram(this.postProcessing.shader, WebGLETFSmoothingPass.fragmentShader, "ETF Smoothing X Pass Shader");
    }

    public setAttributes(direction : [number, number], kernelSize : number) {
        this.direction = direction;
        this.kernelSize = kernelSize;
    }

    public render(inputTextures: WebGLTexture[], fboPair: FramebufferPair) : WebGLTexture {
        if (!this.program) throw new Error("ETF Smoothing X Pass program is not compiled");
        
        const gl: WebGL2RenderingContext = this.wgl.gl;

        fboPair.write().bind();

        this.wgl.clearCanvas(); // Clear the framebuffer

        gl.useProgram(this.program);
        gl.bindVertexArray(this.wgl.vao);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTextures[0]);

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
        if (!this.program) throw new Error("ETF Smoothing X Pass program is not compiled");

        const gl : WebGL2RenderingContext = this.wgl.gl;
        const TEX_NUM = 0;

        const U_DIRECTION : string = 'u_direction';
        const U_MAX_MAG : string = 'u_max_mag';
        const U_MIN_MAG : string = 'u_min_mag';
        const U_IMAGE : string = 'u_image';
        const U_KERNEL_SIZE : string = 'u_kernel_size'

        const imageLocation = gl.getUniformLocation(this.program, U_IMAGE);
        const maxMagLocation = gl.getUniformLocation(this.program, U_MAX_MAG);
        const minMagLocation = gl.getUniformLocation(this.program, U_MIN_MAG);
        const kernelSizeLocation = gl.getUniformLocation(this.program, U_KERNEL_SIZE);
        const directionLocation = gl.getUniformLocation(this.program, U_DIRECTION);

        
        if (!minMagLocation) throw new Error(setUniformLocationError(U_MIN_MAG));
        if (!maxMagLocation) throw new Error(setUniformLocationError(U_MAX_MAG));
        if (!imageLocation) throw new Error(setUniformLocationError(U_IMAGE));
        if (!kernelSizeLocation) throw new Error(setUniformLocationError(U_KERNEL_SIZE));
        if (!directionLocation) throw new Error(setUniformLocationError(U_DIRECTION));

        gl.uniform1i(imageLocation, TEX_NUM);
        gl.uniform1f(maxMagLocation, this.maxMagnitude);
        gl.uniform1f(minMagLocation, this.minMagnitude);
        gl.uniform1i(kernelSizeLocation, this.kernelSize);
        gl.uniform2f(directionLocation, this.direction[0], this.direction[1]);
    };
    
    private static fragmentShader: string = 
        `#version 300 es
        precision highp float;
        
        uniform sampler2D u_image; // tangentFlow field and magnitude;
        uniform float u_max_mag;
        uniform float u_min_mag;
        uniform int u_kernel_size;
        uniform vec2 u_direction;
        
        in vec2 v_texCoord;
        out vec4 outColor; 
        
        // Equation 1: Normalize magnitude to [0, 1]
        float normalizeMagnitude (float mag) {
            return (mag - u_min_mag) / (u_max_mag - u_min_mag);
        }
        
        // Equation 2: spatial weight based on vertical distance
        float spatialWeight(vec2 center, vec2 offset) {
            float dist = distance(center, offset);
            float halfSize = float(u_kernel_size) / 2.0;
            return dist < halfSize ? 1.0 : 0.0; 
        }
        
        // Equation 3
        float magnitudeWeight(float gradientMagnitudeX, float gradientMagnitudeY) {
            return (1.0 + tanh(gradientMagnitudeY - gradientMagnitudeX)) / 2.0;
        }
        
        // Equation 4: vector alignment weight
        float distanceWeight(vec2 centerTan, vec2 offsetTan) {
            return abs(dot(centerTan, offsetTan));
        }
        
        // Equation 5: directional agreement
        float computePhi(vec2 centerTan, vec2 offsetTan) {
            return dot(centerTan, offsetTan) > 0.0? 1.0 : -1.0;
        }
        
        vec2 computeNewVector() {
            int kernelHalf = u_kernel_size / 2;
            vec3 c0 = texture(u_image, v_texCoord).rgb;
            vec2 centerTan = c0.rg;
            float centerMag = c0.b;
            centerMag =  normalizeMagnitude(centerMag);
        
            vec2 invTexSize = 1.0 / vec2(textureSize(u_image, 0));
        
            vec2 sum = vec2(0.0);
            for (int i = -kernelHalf; i <= kernelHalf; i++) {
                vec2 offsetDirection = float(i) * u_direction;
                vec2 offsetCoord =  v_texCoord + offsetDirection * invTexSize;
                vec3 colorOffset = texture(u_image, offsetCoord).rgb;
                vec2 offsetTan = colorOffset.rg;
                float offsetMag = colorOffset.b;
                offsetMag = normalizeMagnitude(offsetMag);
        
                float phi = computePhi(centerTan, offsetTan);
                float sw = spatialWeight(vec2(0.0), offsetDirection);
                float mw = magnitudeWeight(centerMag, offsetMag);
                float dw = distanceWeight(centerTan, offsetTan);
                sum += phi *offsetTan *sw * mw * dw;
            }
        
            float newMag = length(sum);
            return newMag > 0.0 ? sum / newMag : vec2(0.0);
        }
        
        void main() {
            vec4 color = texture(u_image, v_texCoord);
            vec2 sum = computeNewVector();
            outColor = vec4(sum, color.b, 1.0);
        }`;
}


export default WebGLETFSmoothingPass;
