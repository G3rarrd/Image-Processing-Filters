import ImageProcessingCreateNewBtn from "./image_processing_create_new_btn/image_processing_create_new_btn";
import ImageProcessingHomeBtn from "./image_processing_home_btn/image_processing_home_btn"
import styles from './image_processing_menu_bar.module.css';
import ImageProcessingFileBtn from './image_processing_file_btn/image_processing_file_btn';
import ImageProcessingFilterBtn from "./image_processing_filter_btn/image_processing_filter_btn";
import ImageProcessingViewBtn from "./image_processing_view_btn/image_processing_view_btn";

const ImageProcessingMenuBar = () => {
    return (
        <div className={`${styles.menu_bar}`}>

            <div className={`${styles.section_1}`}>
                <ImageProcessingHomeBtn/>
                <ImageProcessingCreateNewBtn/>
            </div>

            <div className={`${styles.section_2}`}>
                <ImageProcessingFileBtn/>
                <ImageProcessingFilterBtn/>
                <ImageProcessingViewBtn/>
            </div>
            
        </div>
    )
}

export default ImageProcessingMenuBar;