import { useCallback, useContext, useEffect } from "react";
import ImageProcessingRangeSliders from "../image_processing_filter_range_sliders/image_processing_filter_range_sliders";
import { ImageProcessingContext } from "../../../../../components/image_processing_context/image_processing_provider";

import styles from './image_processing_filter_control_panel.module.css'
import { RangeSlidersProps } from "../../../../../../../types/slider";
function ImageProcessingFilterControlPanel () {
    const {rendererRef, sliderConfigs, openFilterControl, setOpenFilterControl, setSliderConfigs, filterFuncRef} = useContext(ImageProcessingContext);
    
    const handleSliderChange = useCallback((label : string, newValue : number) => {
        setSliderConfigs((prevConfigs)  => {
            return  prevConfigs.map((config : RangeSlidersProps) => {
                return config.label === label 
                ? {...config, value: newValue} 
                : config
            });
        });
    }, [setSliderConfigs])

    const handleClose =(() => {
        if (!rendererRef || !rendererRef.current) return;
        setOpenFilterControl(() => false);
        const renderer = rendererRef.current;
        renderer.currentTexture = renderer.holdCurrentTexture;
        renderer.renderScene();
    })

    const handleApply = (() => {
        if (!rendererRef || !rendererRef.current) return;
        setOpenFilterControl(() => false);
        const renderer = rendererRef.current;
        const imgWidth = renderer.img.naturalWidth;
        const imgHeight = renderer.img.naturalHeight;
        renderer.historyStack.add(renderer.currentTexture, imgWidth, imgHeight);
        renderer.holdCurrentTexture = renderer.historyStack.getUndoStackTop();
    }) 

    useEffect (() => {
        if (filterFuncRef.current) {
            filterFuncRef.current(sliderConfigs);
        }
    }, [sliderConfigs])

    

    return (
    <div className={`${styles.filter_control_panel_container} ${openFilterControl ? styles.visible : styles.hidden}`}  >
        <div className={`${styles.filter_control_panel_title_container}`}>
            <span className={`${styles.filter_control_panel_title}`}>Title</span>
            <button onClick={handleClose} className={`${styles.filter_control_panel_close_btn}`}>X</button>
        </div>
        {sliderConfigs.map((config) => (
            <ImageProcessingRangeSliders
                key={config.label}
                config={config}
                onChange={(val : number) => handleSliderChange(config.label, val)}
            />
        ))}
    <button onClick={handleApply} className={`${styles.filter_control_panel_apply_btn}`}>Apply</button>
    </div>
    )
}

export default ImageProcessingFilterControlPanel;