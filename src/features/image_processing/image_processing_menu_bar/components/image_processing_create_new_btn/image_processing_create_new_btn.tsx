import styles from './image_processing_create_new_btn.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretDown } from '@fortawesome/free-solid-svg-icons';

const ImageProcessingCreateNewBtn = () => {
    const dropdownIcon = <FontAwesomeIcon icon={faCaretDown}/>

    return (
        <button className={`${styles.create_new_btn}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM232 344l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/></svg>
            <span>Create New</span>
            {dropdownIcon}
        </button>
    )
}

export default ImageProcessingCreateNewBtn;