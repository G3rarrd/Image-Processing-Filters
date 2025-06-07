import { useContext, useEffect, useState } from "react";
import WebGL2DCamera, { Camera as ViewState } from "../../../../utils/Scene/webGL2DCamera";
import { ImageProcessingContext } from "../../components/image_processing_context/image_processing_provider";
import { m3 } from "../../../../utils/math/webGLMatrix3";
import WebGLRenderer from "../../../../utils/Scene/webGLRender";

const useWebGL2DScene = () => {
    const {glCanvasRef, src, rendererRef} = useContext(ImageProcessingContext);
    const [viewState, setViewState] = useState<ViewState | null>(null);
    const [canvasDimensions, setCanvasDimensions] = useState<[number, number]>([0, 0]);
    const [curSrc, setCurSrc] = useState<string>(""); // Checks if a image has been set
    const [startPos, setStartPos] = useState<[number, number] | null>(null);

    const getClipSpaceMousePosition = (e : MouseEvent) : [number, number] | null=> {
        if (!glCanvasRef || !glCanvasRef.current) return null;
        const glCanvas = glCanvasRef.current;
        const rect = glCanvas.getBoundingClientRect();
        const cssX = e.clientX - rect.left;
        const cssY = e.clientY - rect.top;

        let clipX = cssX / (rect.right - rect.left);
        let clipY = cssY / (rect.bottom - rect.top);
        
        // Convert to clip space;
        clipX = clipX * 2 -1;
        clipY = clipY * -2 + 1;

        return[clipX, clipY]
    }

    const handleWheel = (e : WheelEvent) => {
        e.preventDefault();
        const clips : [number, number] | null = getClipSpaceMousePosition(e);
        if (!clips) return;
        if (!rendererRef || !rendererRef.current) throw new Error("Renderer is not available")
        
        const camera = rendererRef.current.cam;
        const operand = Math.min(1, Math.max(-1, e.deltaY))*-1; // -1 or +1
        if (!camera) return;

        camera.setViewProjection();
        const [preZoomX, preZoomY] = m3.transformPoint(m3.inverse(camera.viewProjection),clips);
        
        camera.viewState.zoom  = Math.max(0.01, camera.viewState.zoom + (0.05*operand));
        camera.setViewProjection(); 
        
        const [postZoomX, postZoomY] = m3.transformPoint(m3.inverse(camera.viewProjection), clips);
        camera.viewState.x += preZoomX - postZoomX;
        camera.viewState.y += preZoomY - postZoomY;
        camera.setViewProjection(); 
        setViewState({...camera.viewState});
    }

    const handleMouseDown = (e : MouseEvent) => {
        e.preventDefault();
        const clips : [number, number] | null = getClipSpaceMousePosition(e);
        if (! rendererRef || !rendererRef.current) throw new Error("Renderer is not available")
        const camera = rendererRef.current.cam;
        if (!clips) return;
        if (!viewState) return;
        if (!camera.viewProjection) throw new Error("view Projection is not available")
        const [prePanX, prePanY] = m3.transformPoint(m3.inverse(camera.viewProjection),clips);
        setStartPos([prePanX, prePanY]);
    }

    const handleMouseUp = () => {
        setStartPos(null);
    }

    const handleMouseMove = (e : MouseEvent) => {
        if (!startPos) return;
        if (! rendererRef || !rendererRef.current) throw new Error("Renderer is not available")
        const camera = rendererRef.current.cam;
        const clips : [number, number] | null = getClipSpaceMousePosition(e);

        if (!clips) return;
        if (!camera.viewProjection) throw new Error("view Projection is not available");
        
        camera.setViewProjection(); 
        const [postPanX, postPanY] = m3.transformPoint(m3.inverse(camera.viewProjection), clips);
        camera.viewState.x += (startPos[0] - postPanX) ;
        camera.viewState.y += (startPos[1] - postPanY);
        camera.setViewProjection(); 
        setViewState({...camera.viewState});
    }

    const getCanvasDimensions = () : [number, number] | null => {
        if (!glCanvasRef || !glCanvasRef.current) return null
        const glCanvas: HTMLCanvasElement | null = glCanvasRef.current;
        const gl : WebGL2RenderingContext | null | undefined = glCanvas?.getContext('webgl2');
            
        if (!gl || !glCanvas) return null;
        const dpr = window.devicePixelRatio;
        const {width, height} = glCanvas.getBoundingClientRect();
        const displayWidth = Math.round(width * dpr);
        const displayHeight = Math.round(height * dpr);

        return [displayWidth, displayHeight];
    }

    useEffect(() => {
        const handleResize = () => {
            const dim = getCanvasDimensions();
            if (!dim)  return;

            setCanvasDimensions([...dim]);
            if (rendererRef && rendererRef.current){
                const camera = rendererRef.current.cam;
                camera.setViewProjection(); 
                if (!glCanvasRef) throw new Error ("webGL ref is not available")
                // const glCanvas: HTMLCanvasElement | null = glCanvasRef.current;


                rendererRef.current.gl.canvas.width = dim[0];
                rendererRef.current.gl.canvas.height = dim[1];

                // rendererRef.current.initScene();
                camera.setViewProjection(); 

            }
        }
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };

    }, [canvasDimensions]);



    useEffect (() => {
        const img = new Image();
        if (! src) return;

        img.src = src;

        img.onload = () => {
            if (!glCanvasRef) throw new Error ("webGL ref is not available")
            const glCanvas: HTMLCanvasElement | null = glCanvasRef.current;
            const gl : WebGL2RenderingContext | null | undefined = glCanvas?.getContext('webgl2');

            if (!gl || !glCanvas) throw Error("Canvas or WebGL context is unavailable");

            const dim = getCanvasDimensions();
            
            if (!dim) return; 
            gl.canvas.width = dim[0];
            gl.canvas.height = dim[1];
            if (src != curSrc) {
                if (!rendererRef) return;

                const camera : WebGL2DCamera = new WebGL2DCamera(gl);
                camera.resetCamera(img.naturalWidth, img.naturalHeight);
                camera.setViewProjection()
                setViewState({...camera.viewState});
                setCurSrc(src);

                rendererRef.current  = new WebGLRenderer(gl, camera, img);
            }

            
            if (rendererRef) {
                rendererRef.current.renderScene();
            }
            
        };
        return () => {
            img.onload = null;
        }
        

    }, [viewState, src, canvasDimensions]);

    return {handleWheel, handleMouseDown, handleMouseUp, handleMouseMove, canvasDimensions};
}

export default useWebGL2DScene;