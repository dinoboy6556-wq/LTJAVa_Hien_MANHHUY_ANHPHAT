# Trợ lý thư viện

Mở http://localhost:3000/assistant hoặc bấm Hỏi AI ở góc dưới trang độc giả. Cần đăng nhập.

## Cấu hình AI

Backend dùng OpenAI Responses API. Thêm vào file local đã được gitignore tại library/src/main/resources/application-local.properties.

    app.ai.api-key=DIEN_API_KEY_CUA_BAN
    app.ai.model=gpt-5-mini

Hoặc đặt biến môi trường OPENAI_API_KEY và OPENAI_MODEL trước khi chạy backend. Khởi động lại backend sau khi cấu hình. Khóa chỉ dùng tại backend.

Khi chưa có khóa, trả lời được gắn nhãn Tra cứu thư viện và dùng danh mục thật cùng hướng dẫn có sẵn. Khi API lỗi hoặc bận, giao diện cũng ghi rõ chế độ tra cứu dự phòng.

## Vị trí mã

- frontend/app/assistant/page.jsx — màn hình hội thoại và liên kết sách.
- frontend/app/layout.jsx — nút mở Hỏi AI.
- frontend/lib/api.js — gọi POST /api/v1/library-chat.
- library/src/main/java/com/example/library/controller/LibraryChatController.java — xác thực đầu vào.
- library/src/main/java/com/example/library/service/LibraryChatService.java — gợi ý, giới hạn truy cập và gọi OpenAI.
- library/src/main/java/com/example/library/repository/BookRepository.java — lấy dữ liệu công khai của sách.

Mỗi tài khoản gửi tối đa 8 câu/phút. Hội thoại gửi kèm tối đa 6 tin gần nhất. Dữ liệu danh mục được giới hạn 150 đầu sách và chọn tối đa 6 sách khớp câu hỏi. Câu hỏi cùng lịch sử gần nhất được gửi cho OpenAI khi cấu hình khóa. Hội thoại lưu tối đa 60 tin trên localStorage của trình duyệt, theo từng tài khoản. Tải lại trang vẫn giữ hội thoại. Có nút Xóa hội thoại với xác nhận. Lịch sử không đồng bộ giữa thiết bị và sẽ mất khi xóa dữ liệu trình duyệt. Chỉ 6 tin gần nhất được gửi cùng câu hỏi tới backend.
