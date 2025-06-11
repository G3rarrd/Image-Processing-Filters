import styles from './image_processing_filter_range_sliders.module.css';
import { RangeSlidersProps } from '../../../../../../../types/slider';
import React from 'react';

interface SliderActionProps {
    config : RangeSlidersProps,
    onChange : (value : number) => void,
}


const  ImageProcessingRangeSliders : React.FC<SliderActionProps> = ({config, onChange}) => {


    return (
        <div className={`${styles.range_slider_container}`}>
            <label htmlFor={config.label}>{config.label} : {config.value}</label>
            <input 
                id={config.label}
                type='range'
                min={config.min}
                max={config.max}
                value={config.value}
                step={config.step}
                onChange={(e : React.ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
                className={`${styles.slider}`}
            />
        </div>
    );
}

export default React.memo(ImageProcessingRangeSliders);