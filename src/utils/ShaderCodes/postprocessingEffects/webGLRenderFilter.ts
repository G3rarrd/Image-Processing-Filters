import Framebuffer from "../../framebuffer_textures/framebuffer";

export interface RenderFilter {
    render(inputTextures: WebGLTexture[], textureWidth : number , textureHeight : number) :  Framebuffer ;
}