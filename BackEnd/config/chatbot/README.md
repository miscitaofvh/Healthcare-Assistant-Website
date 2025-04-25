# Hướng dẫn sử dụng Chatbot Trợ lý Sức khỏe

## Giới thiệu
Đây là thư mục chứa mã nguồn và cấu hình cho chatbot trợ lý sức khỏe. Chatbot được xây dựng dựa trên mô hình ngôn ngữ lớn (LLM) và được tùy chỉnh để hỗ trợ người dùng với các vấn đề sức khỏe.

## Cấu trúc thư mục
- `start.py`: Script Python để tải và tạo mô hình chatbot
- `requirements.txt`: Danh sách các thư viện Python cần thiết
- `Modelfile.txt`: Cấu hình và hướng dẫn cho mô hình Ollama

## Yêu cầu hệ thống
- Python 3.8 trở lên
- [Ollama](https://ollama.ai/) được cài đặt trên máy

## Cài đặt

### 1. Cài đặt Ollama
Trước tiên, bạn cần cài đặt Ollama. Tham khảo trang web chính thức của [Ollama](https://ollama.ai/) để biết hướng dẫn cài đặt cho hệ điều hành của bạn.

### 2. Cài đặt các thư viện Python cần thiết
```
pip install -r requirements.txt
```

## Sử dụng

### 1. Khởi chạy Ollama
Trước khi chạy script, đảm bảo Ollama đang chạy trong nền:
```
ollama serve
```

### 2. Tải và tạo mô hình
Chạy script `start.py` để tải mô hình cơ sở và tạo mô hình tùy chỉnh:
```
python start.py
```

Script sẽ hướng dẫn bạn qua các bước sau:
- Tải mô hình cơ sở (mặc định là llama3.2:3b)
- Tạo mô hình tùy chỉnh dựa trên Modelfile.txt (mặc định tên là AMH_chatbot)

### 3. Tùy chọn nâng cao
- **Điều chỉnh thông số trong `Modelfile.txt`**:
  - `temperature` (0.0-1.0): Kiểm soát độ ngẫu nhiên trong câu trả lời. Giá trị thấp (0.2) tạo câu trả lời nhất quán, giá trị cao (0.8+) tạo câu trả lời đa dạng hơn.
  - `top_k` (1-100): Giới hạn số lượng token được cân nhắc trong mỗi bước dự đoán. Giá trị 50 là cân bằng tốt.
  - `top_p` (0.0-1.0): Lọc các token có xác suất thấp. Giá trị 0.95 bảo tồn 95% xác suất tích lũy.
  - `num_predict`: Số lượng tối đa token trong phản hồi của mô hình.

- **Tùy chỉnh System Prompt**:
  - Bạn có thể chỉnh sửa phần `SYSTEM` trong `Modelfile.txt` để điều chỉnh cách chatbot phản hồi.
  - Thêm hướng dẫn cho lĩnh vực y tế cụ thể (tim mạch, nhi khoa, dinh dưỡng...).
  - Điều chỉnh ngôn ngữ, phong cách giao tiếp, hoặc độ chi tiết trong câu trả lời.

- **Tối ưu hóa mô hình**:
  - Sử dụng mô hình lớn hơn (llama3.2:8b hoặc llama3.2:70b) cho kết quả chính xác hơn nhưng yêu cầu phần cứng mạnh hơn.
  - Thử nghiệm với các mô hình khác như `mistral`, `gemma` hoặc `phi` bằng cách thay đổi dòng `FROM` trong Modelfile.

## Streaming Responses
Chatbot hỗ trợ phản hồi dạng streaming, giúp hiển thị câu trả lời theo thời gian thực:

- API endpoint `/chat/stream` được sử dụng cho phản hồi streaming
- Frontend hiển thị phản hồi từng ký tự một khi nhận được từ backend
- Cải thiện trải nghiệm người dùng bằng cách giảm thời gian chờ đợi
- Tham số `stream: true` trong Ollama API để kích hoạt tính năng này

## Khả năng của Chatbot
Chatbot trợ lý sức khỏe có các khả năng sau:

1. **Hỗ trợ sơ bộ**:
   - Phân tích triệu chứng
   - Gợi ý khả năng bệnh lý
   - Thông tin về thuốc và phương pháp điều trị phổ biến

2. **Tiện ích số**:
   - Hỗ trợ đặt lịch khám
   - Nhắc nhở uống thuốc/tập luyện
   - Hỗ trợ upload ảnh chẩn đoán da liễu

3. **Giao tiếp**:
   - Sử dụng ngôn ngữ phổ thông
   - Tôn trọng quyền riêng tư
   - Ưu tiên phản hồi ngắn gọn
   - Phản hồi dạng streaming cho trải nghiệm mượt mà

## Lưu ý quan trọng
- Chatbot **KHÔNG** thay thế bác sĩ, mọi thông tin chỉ mang tính tham khảo
- Chatbot sẽ đề xuất thăm khám chuyên sâu khi phát hiện dấu hiệu nguy hiểm
- Ưu tiên chuyển tiếp đến chuyên gia y tế cho các trường hợp cấp tính/khẩn cấp

## Khắc phục sự cố

### Không tải được mô hình
- Kiểm tra kết nối internet
- Đảm bảo Ollama đã được cài đặt đúng cách và đang chạy
- Kiểm tra quyền truy cập đối với thư mục lưu trữ mô hình

### Lỗi khi tạo mô hình tùy chỉnh
- Kiểm tra cú pháp trong Modelfile.txt
- Đảm bảo mô hình cơ sở đã được tải thành công
