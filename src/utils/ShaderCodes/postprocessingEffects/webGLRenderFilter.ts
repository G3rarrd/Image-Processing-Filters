import FramebufferPair from "../../framebuffer_textures/framebufferPair";

export interface RenderFilter {
    render(inputTextures : WebGLTexture[], fboPair : FramebufferPair) : WebGLTexture; 
}