import os
import argparse
import cv2
import numpy as np
from PIL import Image, ImageEnhance
import pytesseract
import docx
import PyPDF2
import fitz  # PyMuPDF

def extract_text_from_txt(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

def extract_text_from_docx(file_path):
    doc = docx.Document(file_path)
    fullText = []
    for para in doc.paragraphs:
        fullText.append(para.text)
    return "\n".join(fullText)

def extract_text_from_pdf(file_path, process_type="processed"):
    """
    Extract text from PDF file with fallback to OCR if normal extraction fails
    
    Args:
        file_path: Path to the PDF file
        process_type: OCR processing mode if needed - "original" or "processed"
    
    Returns:
        Extracted text as string
    """
    text = ""
    with open(file_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page_num, page in enumerate(reader.pages):
            page_text = page.extract_text()
            text += page_text + "\n" if page_text else "\n"
    
    # Check if extracted text is insufficient (empty or very little text)
    if not text.strip() or len(text.strip()) < 100:
        print("Phát hiện PDF không có text layer, đang áp dụng OCR...")
        
        # Set tesseract path
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        
        # Process PDF pages with OCR
        ocr_text = ""
        pdf_document = fitz.open(file_path)
        
        for page_num in range(len(pdf_document)):
            # Get page
            page = pdf_document[page_num]
            
            # Convert page to image
            pix = page.get_pixmap(alpha=False)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            
            # Process image with OCR
            processed_img = process_image_for_ocr(img, process_type)
            
            # Enhance image
            if process_type == "processed":
                # Tăng độ tương phản
                enhancer = ImageEnhance.Contrast(processed_img)
                processed_img = enhancer.enhance(2.0)
                
                # Tăng độ sắc nét
                enhancer = ImageEnhance.Sharpness(processed_img)
                processed_img = enhancer.enhance(2.0)
                
                # Tăng độ sáng
                enhancer = ImageEnhance.Brightness(processed_img)
                processed_img = enhancer.enhance(1.2)
            
            # Define custom configuration for Tesseract
            custom_config = r'--oem 3 --psm 6 -l eng+vie'
            
            # Extract text from image
            page_text = pytesseract.image_to_string(processed_img, config=custom_config)
            ocr_text += page_text + "\n\n"
            
            print(f"Đã xử lý trang {page_num + 1}/{len(pdf_document)}")
        
        pdf_document.close()
        return ocr_text
    
    return text

def process_image_for_ocr(img, process_type="original"):
    # Convert PIL Image to numpy array for OpenCV processing if needed
    if isinstance(img, Image.Image):
        img_np = np.array(img)
    else:
        img_np = img
        
    if process_type == "processed":
        # Convert to grayscale
        if len(img_np.shape) == 3:
            gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
        else:
            gray = img_np
            
        # Apply thresholding to get clear black and white image
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
        
        # Noise removal using morphological operations
        kernel = np.ones((1, 1), np.uint8)
        opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
        
        # Return as PIL Image for pytesseract
        return Image.fromarray(opening)
    else:
        # Return original image as PIL Image
        if isinstance(img, Image.Image):
            return img
        else:
            return Image.fromarray(img_np)

def extract_text_from_image(file_path, process_type="original"):
    """
    Extract text from image with enhanced line-by-line extraction
    
    Args:
        file_path: Path to the image file
        process_type: Type of image processing - "original" or "processed"
    
    Returns:
        Extracted text as string
    """
    # Set Tesseract executable path
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    
    # Load image
    img = Image.open(file_path)
    
    # Process image based on selected mode
    processed_img = process_image_for_ocr(img, process_type)
    
    # Enhance image if processed mode is selected
    if process_type == "processed":
        # Tăng độ tương phản
        enhancer = ImageEnhance.Contrast(processed_img)
        processed_img = enhancer.enhance(2.0)  # Tăng giá trị để tăng độ tương phản
        
        # Tăng độ sắc nét
        enhancer = ImageEnhance.Sharpness(processed_img) 
        processed_img = enhancer.enhance(2.0)  # Tăng giá trị để làm rõ nét hơn
        
        # Tăng độ sáng nếu cần
        enhancer = ImageEnhance.Brightness(processed_img)
        processed_img = enhancer.enhance(1.2)  # > 1.0 để tăng độ sáng
        
        # Nâng cao độ nét của đường viền bằng cách tăng đặc trưng màu
        enhancer = ImageEnhance.Color(processed_img)
        processed_img = enhancer.enhance(1.5)
        # Display processed image for visual inspection for 10 seconds
        try:
            # Convert PIL image to numpy array for OpenCV
            img_array = np.array(processed_img)
            # # Display the image
            # cv2.imshow("Processed Image", img_array)
            # # Wait for 10 seconds
            # cv2.waitKey(5000)
            # # Close the window
            # cv2.destroyAllWindows()
        except Exception as e:
            print(f"Could not display processed image: {str(e)}")
        
    # Define custom configuration for Tesseract
    # --oem 3: Default, --psm 6: Assume a single uniform block of text
    # -l eng+vie: Use both English and Vietnamese language data
    custom_config = r'--oem 3 --psm 6 -l eng+vie'
    
    # Get text
    text = pytesseract.image_to_string(processed_img, config=custom_config)

    if process_type == "processed":
        # Get information about detected text regions
        data = pytesseract.image_to_data(processed_img, config=custom_config, output_type=pytesseract.Output.DICT)
        
        # Group words by line
        lines = {}
        for i, word in enumerate(data['text']):
            if word.strip():  # Skip empty words
                line_num = data['line_num'][i]
                if line_num not in lines:
                    lines[line_num] = []
                lines[line_num].append(word)
        
        # Format lines
        formatted_lines = []
        for line_num in sorted(lines.keys()):
            formatted_lines.append(' '.join(lines[line_num]))
        
        # Return the formatted text with clear line breaks if we have any lines
        if formatted_lines:
            text = '\n'.join(formatted_lines)
    
    return text

def extract_text(file_path, process_type="original"):
    ext = os.path.splitext(file_path)[1].lower()
    if ext in [".txt"]:
        return extract_text_from_txt(file_path)
    elif ext in [".docx"]:
        return extract_text_from_docx(file_path)
    elif ext in [".pdf"]:
        return extract_text_from_pdf(file_path)
    elif ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff"]:
        return extract_text_from_image(file_path, process_type)
    else:
        raise ValueError(f"Định dạng file '{ext}' chưa được hỗ trợ")

if __name__ == "__main__":
    # Set up command line arguments
    parser = argparse.ArgumentParser(description='Extract text from various file types including images')
    parser.add_argument('--path', '-p', type=str, help='Path to the file')
    parser.add_argument('--mode', '-m', type=str, choices=['original', 'processed'], 
                        default='original', help='Image processing mode (for images only)')
    
    args = parser.parse_args()
    
    path = args.path
    
    # Get processing mode
    process_type = args.mode
    
    try:
        print(f"Chế độ xử lý hình ảnh: {process_type}")
        content = extract_text(path, process_type)
        print("=== Nội dung trích xuất ===")
        print(content)
    except Exception as e:
        print("Lỗi:", e)
