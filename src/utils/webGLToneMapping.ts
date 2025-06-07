import WebGLShaderManager from "./webglShaderManager";
class WebGLToneMapping extends WebGLShaderManager {
    constructor (gl : WebGL2RenderingContext, cw : number, ch : number) {
        super(gl, cw, ch);
    }

    private a : number = 0;
    private b : number = 0;
    private kernelSize : number = 3;

    private toneMapFragmentShader =
    `#version 300 es
    precision mediump float;

    // Uniforms
    uniform float u_a;          // Tone mapping parameter 'a'
    uniform float u_b;          // Tone mapping parameter 'b'
    uniform sampler2D u_image;  // Input image texture

    // Varying
    in vec2 v_texCoord; // Texture coordinates

    // Output
    out vec4 outColor;

    // Converts RGB color to HSL color space
    vec3 rgb2hsl(in vec3 color) {
        float r = color.r, g = color.g, b = color.b;

        float cMin = min(r, min(g, b));
        float cMax = max(r, max(g, b));
        float delta = cMax - cMin;

        float l = (cMax + cMin) / 2.0;
        float h = 0.0;
        float s = 0.0;

        if (delta > 0.0) {
            s = (l < 0.5) ? (delta / (cMax + cMin)) : (delta / (2.0 - cMax - cMin));

            if (r == cMax) {
                h = (g - b) / delta;
            } else if (g == cMax) {
                h = 2.0 + (b - r) / delta;
            } else {
                h = 4.0 + (r - g) / delta;
            }

            h = h / 6.0;
        }
        return vec3(h, s, l);
    }

    // Converts HSL color to RGB color space
    vec3 hsl2rgb(in vec3 hsl) {
        vec3 p = vec3(0.0, 4.0, 2.0);
        vec3 q = abs(mod(hsl.x * 6.0 + p, 6.0) - 3.0);
        vec3 rgb = clamp(q - 1.0, 0.0, 1.0);

        return hsl.z + hsl.y * (rgb - 0.5) * (1.0 - abs(2.0 * hsl.z - 1.0));
    }

    // Lightness tone mapping function
    float lightnessMap(float l) {
        float gamma = 1.0 - exp(-1.0 / (u_a + u_b));
        float numerator = 1.0 - exp(-l / (u_a * l + u_b));
        return numerator / gamma;
    }

    // Saturation adjustment function
    float saturationMap(float s, float l, float newL) {
        float epsilon = 1e-5; // Small value to prevent division by zero
    float numerator = 1.0 - newL;
    float denominator = max(1.0 - l, epsilon);
    return s * numerator / denominator;
}

void main() {
    // Sample the input texture color
    vec4 imageColor = texture(u_image, v_texCoord);
    
    // Convert RGB to HSL
    vec3 hsl = rgb2hsl(imageColor.rgb);
    float h = hsl.x;
    float s = hsl.y;
    float l = hsl.z;
    
    // Apply tone mapping and saturation adjustment
    float newL = lightnessMap(l);
    float newS = saturationMap(s, l, newL);

    // Convert back to RGB
    vec3 newHSL = vec3(h, newS, newL);
    vec3 newRGB = hsl2rgb(newHSL);

    // Output the final color
    outColor = vec4(newRGB, 1.0);
}`;

    public grayscaleOperatorFragmentShader = 
        `#version 300 es
        precision mediump float;
    
        uniform sampler2D u_image;
    
        in vec2 v_texCoord;

        out vec4 outColor;

        void main() {
            vec4 color = texture(u_image, v_texCoord);
        
            vec3 weights = vec3(0.299, 0.587, 0.114);

            float luminance = dot(color.rgb, weights);
            outColor = vec4(vec3(luminance), 1.0);
        }`

    

    private outLineMapFragmentShader = 
    `#version 300 es
    precision mediump float;

    uniform int u_kernelSize;
    uniform sampler2D u_image; 
    uniform sampler2D u_grayscaleImage; // must be a grayscale 
    
    in vec2 v_texCoord;

    out vec4 outColor; 
    
    

    vec4 maximalGrayDifference (vec3 color, float grayVal) {
        vec2 onePixel = vec2(1.0) / vec2(textureSize(u_image, 0));
        float maximumNeighbor = 0.0;
        int halfSize = u_kernelSize / 2;
        vec3 newColor = color; 
        for (int y = -halfSize; y <= halfSize; y++) {
            for(int x = -halfSize; x <= halfSize; x++) {
                vec2 offset = vec2(x, y) * onePixel;
                float g0 = texture(u_grayscaleImage, v_texCoord + offset).r;
                vec3 c0 = vec3(texture(u_image, v_texCoord + offset));
                
                if (maximumNeighbor < g0) {
                    maximumNeighbor = g0;
                    newColor = c0;
                } 
            }
        }
        newColor = vec3(1.0) - (newColor - color);
        return vec4(newColor, 1.0);
    }

    vec4 minimalGrayDifference (vec3 color, float grayVal) {
        vec2 onePixel = vec2(1.0) / vec2(textureSize(u_image, 0));
        float minimumNeighbor = 1.0;
        int halfSize = u_kernelSize / 2;
        vec3 newColor = color; 
        for (int y = -halfSize; y <= halfSize; y++) {
            for(int x = -halfSize; x <= halfSize; x++) {
                vec2 offset = vec2(x, y) * onePixel;
                float g0 = texture(u_grayscaleImage, v_texCoord + offset).r;
                vec3 c0 = vec3(texture(u_image, v_texCoord + offset));
                
                if (minimumNeighbor > g0) {
                    minimumNeighbor = g0;
                    newColor = c0;
                } 
            }
        }
        newColor = vec3(1.0) - ( color - newColor);
        return vec4(newColor, 1.0);
    }

    void main () {
        vec3 color = vec3(texture(u_image, v_texCoord));
        vec4 colorGrayscale = texture(u_grayscaleImage, v_texCoord);
        vec4 maxGrayDiff = maximalGrayDifference(color, colorGrayscale.r);
        vec4 minGrayDiff = minimalGrayDifference(color, colorGrayscale.r);

        outColor = maxGrayDiff;
    }
    `

    private setToneMapUniforms = () => {
        if (!this.wgl) throw new Error("Failed to define WebGL");
        if (!this.wgl.program) throw new Error("Failed to load program");
        if (!this.gl) throw new Error("Failed to find gl context");

        const resolutionLocation = this.gl.getUniformLocation(this.wgl.program, "u_resolution");
        const imageLocation = this.gl.getUniformLocation(this.wgl.program, "u_image");
        const aLocation = this.gl.getUniformLocation(this.wgl.program, "u_a");
        const bLocation = this.gl.getUniformLocation(this.wgl.program, "u_b");

        this.gl.uniform2f(resolutionLocation, this.cw, this.ch);
        this.gl.uniform1i(imageLocation, this.texNum);
        this.gl.uniform1f(aLocation, this.a);
        this.gl.uniform1f(bLocation, this.b);
    }

    public applyToneMap = (
        inputTexture : WebGLTexture,
        framebuffer1 : FramebufferTexturePair,
        framebuffer2 : FramebufferTexturePair,
        a : number,
        b : number
    ) => {
        this.a = a;
        this.b = b;

        if (!framebuffer1.framebuffer) throw new Error("framebuffer1 framebuffer is not available" );
        
        this.applyShader(inputTexture, framebuffer1.framebuffer, this.toneMapFragmentShader, "toneMapFragmentShader", this.setToneMapUniforms );
        return [framebuffer2, framebuffer1];
    }

    private setGrayscaleOperatorUniforms = () => {
        if (!this.wgl) throw new Error("Failed to define WebGL");
        if (!this.wgl.program) throw new Error("Failed to load program");
        if (!this.gl) throw new Error("Failed to find gl context");

        const resolutionLocation = this.gl.getUniformLocation(this.wgl.program, "u_resolution");
        const imageLocation = this.gl.getUniformLocation(this.wgl.program, "u_image");

        this.gl.uniform2f(resolutionLocation, this.cw, this.ch);
        this.gl.uniform1i(imageLocation, this.texNum);
    }

    

    public applyGrayscaleOperator = (
        inputTexture : WebGLTexture,
        framebuffer1 : FramebufferTexturePair,
        framebuffer2 : FramebufferTexturePair,
    ) => {
        
        this.applyShader(
            inputTexture,
            framebuffer1.framebuffer, 
            this.grayscaleOperatorFragmentShader, 
            "grayscaleOperatorFragmentShader",
            this.setGrayscaleOperatorUniforms
        );

        return [framebuffer2, framebuffer1];
    }

    private setOutlineMapUniforms = () => {
        if (!this.wgl) throw new Error("Failed to define WebGL");
        if (!this.wgl.program) throw new Error("Failed to load program");
        if (!this.gl) throw new Error("Failed to find gl context");

        const resolutionLocation = this.gl.getUniformLocation(this.wgl.program, "u_resolution");
        const imageLocation = this.gl.getUniformLocation(this.wgl.program, "u_image");
        const grayscaleLocation = this.gl.getUniformLocation(this.wgl.program, "u_grayscale");
        const kernelSizeLocation = this.gl.getUniformLocation(this.wgl.program, "u_kernelSize");

        this.gl.uniform2f(resolutionLocation, this.cw, this.ch);
        this.gl.uniform1i(imageLocation, this.texNum);
        this.gl.uniform1i(grayscaleLocation, this.texNum + 1);
        this.gl.uniform1i(kernelSizeLocation , this.kernelSize);
    }

    public applyOutlineMap = (
        inputTexture : WebGLTexture,
        framebuffer1 : FramebufferTexturePair,
        framebuffer2 : FramebufferTexturePair,
        kernelSize : number
    ) => {
        if (!this.wgl) throw new Error("Failed to define WebGL");

        this.kernelSize = kernelSize;
        if (!framebuffer1.framebuffer) throw new Error("framebuffer1 framebuffer is not available" );
        let grayscaleOperatorFramebuffer = this.wgl.createEmptyFramebuffer();

        if (!grayscaleOperatorFramebuffer) throw new Error ("grayscaleOperatorFramebuffer is not available");
        
        [framebuffer1, grayscaleOperatorFramebuffer] = 
        this.applyGrayscaleOperator(inputTexture, framebuffer1, framebuffer2);
        
        this.applyShader2Tex(
            inputTexture,
            grayscaleOperatorFramebuffer.texture,
            framebuffer1.framebuffer, 
            this.outLineMapFragmentShader, 
            "outLineMapFragmentShader", 
            this.setOutlineMapUniforms
        );
        return [framebuffer2, framebuffer1];
    }   
}

export default WebGLToneMapping;