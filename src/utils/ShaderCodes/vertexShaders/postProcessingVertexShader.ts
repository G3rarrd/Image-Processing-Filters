class PostProcessingVertexShader {
    
    public shader : string = 
        `#version 300 es
        precision mediump float;

        in vec2 a_position;
        in vec2 a_texCoord;

        uniform vec2 u_resolution;

        out vec2 v_texCoord;

        void main() {
            vec2 zeroToOne = a_position / u_resolution;
            vec2 zeroToTwo = zeroToOne * 2.0;
            vec2 clipSpace = zeroToTwo - 1.0;
            
            // Multiply the position by the matrix.
            gl_Position = vec4(clipSpace, 0, 1);
            v_texCoord =  vec2(a_texCoord.s, 1.0 - a_texCoord.t);
        }`

    public setGlobalUniforms (
        gl : WebGL2RenderingContext, 
        program : WebGLProgram, 
        width : number,
        height : number
    ) {
            /* Setting the Post processing vertex uniforms based on the program */
            if (!program) throw new Error("Failed to load program");

            const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
            gl.uniform2f(resolutionLocation, width, height);
        }
}

export default PostProcessingVertexShader;

