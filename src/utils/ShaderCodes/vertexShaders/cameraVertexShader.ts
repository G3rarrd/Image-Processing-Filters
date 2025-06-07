export const cameraVertexShaderCode : string = 
    `#version 300 es
    precision mediump float;

    in vec2 a_position;
    in vec2 a_texCoord;

    uniform mat3 u_matrix;

    out vec2 v_texCoord;

    void main() {
        vec2 position = (u_matrix * vec3(a_position, 1)).xy;
        gl_Position = vec4(position, 0, 1);
        v_texCoord =  vec2(a_texCoord.s, 1.0 - a_texCoord.t);
    }`