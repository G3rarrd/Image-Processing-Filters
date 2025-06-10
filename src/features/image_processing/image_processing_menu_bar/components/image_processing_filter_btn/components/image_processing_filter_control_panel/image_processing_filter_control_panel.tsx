import { useContext, useEffect } from "react";
import ImageProcessingRangeSliders from "../image_processing_filter_range_sliders/image_processing_filter_range_sliders";
import { ImageProcessingContext } from "../../../../../components/image_processing_context/image_processing_provider";

import styles from './image_processing_filter_control_panel.module.css'
function ImageProcessingFilterControlPanel () {
    const {sliderConfigs,  setSliderConfigs, filterFuncRef} = useContext(ImageProcessingContext);
    
    const handleSliderChange = (label : string, newValue : number) => {
        const updateConfigs = sliderConfigs.map(config => 
            config.label === label ? {...config, value: newValue} : config
        );
        setSliderConfigs(updateConfigs);
    }

    useEffect (() => {
        if (filterFuncRef.current) {
            filterFuncRef.current(sliderConfigs);
        }
        }, [sliderConfigs])

    return (
    <div className={`${styles.filter_control_panel_container}`}>
        {sliderConfigs.map((config) => (
            <ImageProcessingRangeSliders
                key={config.label}
                config={config}
                onChange={(val : number) => handleSliderChange(config.label, val)}
            />
        ))
    }
    </div>
    )
}

export default ImageProcessingFilterControlPanel;