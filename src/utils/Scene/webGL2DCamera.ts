import { m3 } from "../math/webGLMatrix3";

export interface Camera {
    x : number,
    y : number,
    rotation : number,
    zoom : number
}

class WebGL2DCamera { 
    public viewState : Camera;
    public viewProjection : number[];
    public gl : WebGL2RenderingContext;
    constructor (gl : WebGL2RenderingContext) {
        this.gl = gl;
        
        this.viewProjection = m3.identity();
        this.viewState =  {x : 0, y : 0, rotation : 0, zoom : 1};
    }

    public setUniforms(program : WebGLProgram){
        const matrixLocation = this.gl.getUniformLocation(program, "u_matrix");
        if(!this.viewProjection) throw new Error("View Projection is not available");
        this.gl.uniformMatrix3fv(matrixLocation, false, this.viewProjection);
    }

    public makeCameraMatrix() :  number[] {
        const zoomScale = 1 / this.viewState.zoom;
        let cameraMat = m3.identity(); 
        cameraMat = m3.translate(cameraMat, this.viewState.x, this.viewState.y);
        cameraMat = m3.rotate(cameraMat, this.viewState.rotation);
        cameraMat = m3.scale(cameraMat, zoomScale, zoomScale);
        return cameraMat;
    }

    public setViewProjection () : void {
        const cameraMatrix = this.makeCameraMatrix();

        const canvasWidth = this.gl.canvas.width;
        const canvasHeight = this.gl.canvas.height;

        if (! cameraMatrix) throw new Error("Camera Matrix is unavailable");
        
        const projectionMat = m3.projection(canvasWidth, canvasHeight);
        const viewMat = m3.inverse(cameraMatrix);
        this.viewProjection = m3.multiply(projectionMat, viewMat);
    }

    public resetCamera(imgWidth : number, imgHeight : number) : void{
        // To prevent the texture(img) from under or over filling the canvas screen
        const scaleX =  imgWidth / this.gl.canvas.width;
        const scaleY = imgHeight / this.gl.canvas.height;
        const scale = Math.max(scaleX, scaleY) + 0.1; 
        
        // Positions the texture(img) to the center;
        const offsetX = (this.gl.canvas.width * scale - imgWidth ) / 2;
        const offsetY = (this.gl.canvas.height * scale - imgHeight ) / 2;
        
        // Assigning the values
        this.viewState.x -= offsetX;
        this.viewState.y -= offsetY;
        this.viewState.zoom =  1 / scale;

        // For Debugging
        // this.viewState.x = 0;
        // this.viewState.y = 0;
        // this.viewState.zoom =  1;
    }
}

export default WebGL2DCamera;