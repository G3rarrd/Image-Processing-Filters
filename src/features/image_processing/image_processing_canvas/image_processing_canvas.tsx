import React, { useContext, useEffect, useRef, useState } from 'react';
import { ImageProcessingContext } from '../components/image_processing_context/image_processing_provider';

import './image_processing_canvas.css';

import WebGLCore from '../../../utils/webGLCore';
import WebGLShaderPipeline from '../../../utils/webGLShaderPipline';
import WebGL2DCamera from '../../../utils/Scene/webGL2DCamera';
import useWebGL2DScene from './hooks/useWebGL2DCamera';



const ImageProcessingCanvas = () => {
    const srcCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const { src, setSrc, setImageError, glCanvasRef} = useContext(ImageProcessingContext);
    const {handleWheel, handleMouseDown, handleMouseUp, handleMouseMove, handleResize} = useWebGL2DScene();
    const [scale, setScale] = useState<number>(1);
    const [errorText, setErrorText] = useState<string>('');

    // Camera
    

    // useEffect(() => {
    //     const glCanvas: HTMLCanvasElement | null = glCanvasRef.current;
    //     const gl : WebGL2RenderingContext | null | undefined = glCanvas?.getContext('webgl2' , {preserveDrawingBuffer: true});
    //     const img: HTMLImageElement = new Image();

    //     if (! src) return;
    //     img.src = src;
    //     if (! gl) return
    //     const pipeLine : WebGLShaderPipeline = new WebGLShaderPipeline(gl, img, imgWidth, imgHeight);
    // }, [src]);


    return (
    <>
        {/* <canvas onClick={downloadCanvas} className="image_processing_canvas" ref={srcCanvasRef}></canvas> */}
        <canvas className="image_processing_webgl" 
            ref={glCanvasRef} 
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
        >

        </canvas>
        {/* <div id="errorBox"> 
            <span className='errorBoxTitle'>{errorText}</span>
        </div> */}
    </>
    );
}

export default ImageProcessingCanvas;