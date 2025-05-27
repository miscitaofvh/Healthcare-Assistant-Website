import os
import json
import ollama
from handleMedicalHistory import extract_text

def process_medical_record(file_path, process_type="processed"):
    """
    Process a medical record file using OCR and chatbot analysis
    
    Args:
        file_path: Path to the uploaded file
        process_type: OCR processing mode - "original" or "processed"
    
    Returns:
        Dictionary with structured medical record data
    """
    try:
        # Extract text from the file using OCR
        extracted_text = extract_text(file_path, process_type)
        
        # Check if we got enough text
        if not extracted_text or len(extracted_text.strip()) < 10:
            return {
                "success": False,
                "error": "Không thể trích xuất đủ dữ liệu từ file. Vui lòng thử lại với file khác."
            }
        
        # Process the extracted text with chatbot
        result = process_with_chatbot(extracted_text)
        return result
    
    except Exception as e:
        return {
            "success": False,
            "error": f"Lỗi xử lý: {str(e)}"
        }

def process_with_chatbot(text):
    """
    Send extracted text to chatbot and get structured data back
    
    Args:
        text: Extracted text from medical record
    
    Returns:
        Dictionary with structured medical record fields
    """
    try:        # Define the prompt for the chatbot      
        text_portion = f"""
Dưới đây là văn bản được trích xuất từ một hồ sơ y tế bằng OCR, có thể có lỗi nhận dạng:

{text}

Hãy phân tích và trích xuất thông tin sau đây từ hồ sơ y tế, nếu một trường không có thông tin thì để chuỗi rỗng (""):
- record_date: Ngày khám (định dạng YYYY-MM-DD, ví dụ: "2023-12-31")
- diagnosis: Chẩn đoán bệnh chính (định dạng chuỗi)
- symptoms: Các triệu chứng (định dạng chuỗi)
- treatments: Các phương pháp điều trị (định dạng chuỗi, không chứa thông tin về thuốc, nếu không có thì ghi "Uống thuốc theo chỉ định")
- medications: Danh sách thuốc theo định dạng JSON array. Mỗi thuốc có 4 thuộc tính: name (tên thuốc), dosage (liều lượng), instructions (hướng dẫn), duration (thời gian). Ví dụ: [{{"name":"Paracetamol","dosage":"500mg","instructions":"Uống sau khi ăn","duration":"7 ngày"}}]
- doctor_name: Tên bác sĩ 
- hospital: Tên bệnh viện/phòng khám/trung tâm y tế.
- notes: Ghi chú khác
- record_type: Loại hồ sơ (chọn CHÍNH XÁC 1 trong các loại sau: "checkup", "hospitalization", "surgery", "other")

Trả về kết quả dưới dạng JSON với CHÍNH XÁC các trường nêu trên, KHÔNG được bỏ qua trường nào, nếu không tìm thấy thông tin thì để chuỗi rỗng (""). 

Hãy chú ý:
1. JSON phải hợp lệ và đúng cú pháp
2. Trường medications phải là một mảng JSON nếu có dữ liệu, hoặc mảng rỗng ([]) nếu không có
3. OCR có thể chứa lỗi nhận dạng, hãy suy luận thông tin một cách hợp lý
4. Trường record_type phải là một trong các giá trị: "checkup", "hospitalization", "surgery", "other"
5. Hãy đảm bảo đúng chính tả, bạn có thể dự đoán từ ngữ dựa trên ngữ cảnh là thông tin y tế và thông tin bệnh nhân.

Chỉ trả về JSON, không cần giải thích hay bổ sung thông tin khác.
"""

        # Combine text portion with the rest of the prompt to create the final prompt
        prompt = text_portion
        
        # Send prompt to chatbot
        response = ollama.chat(
            model="AMH_chatbot",  # Use custom model defined in Modelfile
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            options={
                "temperature": 0.05  # Low temperature for more consistent structured responses
            }
        )
          # Extract response content from chatbot
        response_text = response['message']['content'].strip()
        
        # print(response_text)  # Debug: print the raw response from the chatbot
        
        # Try to extract JSON from the response
        # First, look for JSON between code blocks
        json_text = None
        if "```json" in response_text and "```" in response_text.split("```json", 1)[1]:
            json_text = response_text.split("```json", 1)[1].split("```", 1)[0].strip()
        elif "```" in response_text and "```" in response_text.split("```", 1)[1]:
            json_text = response_text.split("```", 1)[1].split("```", 1)[0].strip()
        else:
            # Try to find a JSON-like structure in the text
            start_idx = response_text.find("{")
            end_idx = response_text.rfind("}")
            
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_text = response_text[start_idx:end_idx+1]
          # If we couldn't extract JSON, return the raw response
        if not json_text:
            return {
                "success": False,
                "error": "Không thể phân tích kết quả từ chatbot",
                "raw_response": response_text
            }
        
        # Parse the JSON response
        record_data = json.loads(json_text)
          # Ensure all required fields are present
        required_fields = ["record_date", "diagnosis", "symptoms", "treatments", "medications", 
                          "doctor_name", "hospital", "notes", "record_type"]
        
        for field in required_fields:
            if field not in record_data:
                record_data[field] = ""
          # Special handling for medications to ensure it's a valid JSON string
        if record_data["medications"] and isinstance(record_data["medications"], list):
            record_data["medications"] = json.dumps(record_data["medications"])
        
        # Validate record_type to ensure it's one of the allowed values
        valid_record_types = ["checkup", "hospitalization", "surgery", "other"]
        if record_data["record_type"] not in valid_record_types:
            record_data["record_type"] = "other"
        
        return {
            "success": True,
            "data": record_data
        }
    
    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": "Lỗi định dạng phản hồi từ chatbot",
            "raw_response": response_text
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Lỗi xử lý chatbot: {str(e)}"
        }

if __name__ == "__main__":
    # Test with a sample file
    import argparse
    import sys
    
    # Set the output encoding to UTF-8 for proper handling of Vietnamese characters
    if sys.stdout.encoding != 'utf-8':
        sys.stdout.reconfigure(encoding='utf-8', errors='backslashreplace')
    
    parser = argparse.ArgumentParser(description='Process medical record file')
    parser.add_argument('--file', '-f', type=str, required=True, help='Path to medical record file')
    parser.add_argument('--mode', '-m', type=str, choices=['original', 'processed'], 
                       default='processed', help='OCR processing mode')
    parser.add_argument('--output', '-o', type=str, help='Output file path for JSON result')
    
    args = parser.parse_args()
    
    result = process_medical_record(args.file, args.mode)
    
    # Use ensure_ascii=False to keep Unicode characters and force output as UTF-8
    json_output = json.dumps(result, indent=2, ensure_ascii=False)
    
    # Write to output file if specified, otherwise print to stdout
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(json_output)
    else:
        # Print only the final JSON output
        print(json_output)
