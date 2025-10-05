import cv2
import numpy as np
from PIL import Image
import logging

logger = logging.getLogger(__name__)

class ImagePreprocessor:
    """Image preprocessing for better OCR results"""
    
    def enhance_image(self, image_path: str) -> np.ndarray:
        """Main preprocessing pipeline"""
        try:
            # Load image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Could not load image: {image_path}")
            
            # Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Apply preprocessing steps
            processed = self.deskew(gray)
            processed = self.denoise(processed)
            processed = self.enhance_contrast(processed)
            processed = self.binarize(processed)
            
            return processed
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {str(e)}")
            # Return original grayscale as fallback
            return cv2.cvtColor(cv2.imread(image_path), cv2.COLOR_BGR2GRAY)
    
    def deskew(self, image: np.ndarray) -> np.ndarray:
        """Correct skew in scanned documents"""
        # Find contours
        coords = np.column_stack(np.where(image > 0))
        
        # Get minimum area rectangle
        rect = cv2.minAreaRect(coords)
        angle = rect[2]
        
        # Correct angle
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        
        # Rotate image
        if abs(angle) > 0.5:  # Only rotate if significant skew
            (h, w) = image.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
            return rotated
        
        return image
    
    def denoise(self, image: np.ndarray) -> np.ndarray:
        """Remove noise from image"""
        # Apply median blur to remove salt and pepper noise
        denoised = cv2.medianBlur(image, 3)
        
        # Apply Gaussian blur for additional smoothing
        denoised = cv2.GaussianBlur(denoised, (1, 1), 0)
        
        return denoised
    
    def enhance_contrast(self, image: np.ndarray) -> np.ndarray:
        """Enhance contrast using CLAHE"""
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(image)
        return enhanced
    
    def binarize(self, image: np.ndarray) -> np.ndarray:
        """Convert to binary image using adaptive thresholding"""
        # Otsu's thresholding
        _, binary1 = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Adaptive thresholding
        binary2 = cv2.adaptiveThreshold(image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        
        # Combine both methods
        combined = cv2.bitwise_and(binary1, binary2)
        
        return combined
    
    def remove_stamps_seals(self, image: np.ndarray) -> np.ndarray:
        """Remove colored stamps and seals while preserving text"""
        # Convert to HSV for better color segmentation
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # Define range for red stamps (common in government documents)
        lower_red1 = np.array([0, 50, 50])
        upper_red1 = np.array([10, 255, 255])
        lower_red2 = np.array([170, 50, 50])
        upper_red2 = np.array([180, 255, 255])
        
        # Create masks for red regions
        mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
        mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
        red_mask = cv2.bitwise_or(mask1, mask2)
        
        # Define range for blue stamps
        lower_blue = np.array([100, 50, 50])
        upper_blue = np.array([130, 255, 255])
        blue_mask = cv2.inRange(hsv, lower_blue, upper_blue)
        
        # Combine masks
        stamp_mask = cv2.bitwise_or(red_mask, blue_mask)
        
        # Inpaint to remove stamps
        result = cv2.inpaint(image, stamp_mask, 3, cv2.INPAINT_TELEA)
        
        return result
    
    def detect_text_regions(self, image: np.ndarray) -> list:
        """Detect text regions using MSER or contours"""
        # Create MSER detector
        mser = cv2.MSER_create()
        
        # Detect regions
        regions, _ = mser.detectRegions(image)
        
        # Convert to bounding boxes
        bboxes = []
        for region in regions:
            x, y, w, h = cv2.boundingRect(region.reshape(-1, 1, 2))
            bboxes.append((x, y, w, h))
        
        return bboxes