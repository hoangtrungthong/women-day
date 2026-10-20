# 20/10 — Chúc mừng Ngày Phụ nữ Việt Nam

Trang web chúc mừng ngày Phụ nữ Việt Nam. Không cần đăng nhập, ai vào cũng chỉnh sửa được.

## Chạy

Bản desktop (Electron, hiệu ứng chất lượng cao):

```bash
npm install
npm start      # npm run dev để mở kèm DevTools
```

Bản trình duyệt: mở trực tiếp `index.html`, hoặc `npx serve .`
Mọi tính năng giống nhau, chỉ hiệu ứng nền giảm bớt chi tiết.

## Tính năng

- Chỉnh sửa trực tiếp tiêu đề, lời chúc, tên người nhận/người gửi (nhấn **Chỉnh sửa**)
- Thư viện câu chúc mẫu, thêm/xoá/sửa tuỳ ý
- Thêm ảnh/video từ máy hoặc từ link (YouTube cũng được)
- 7 theme mặc định + tạo theme riêng (màu, font, hiệu ứng nền)
- Hiệu ứng hoa nở pseudo-3D: phối cảnh, parallax theo chuột, depth-of-field, bokeh
- Bấm vào nền để nở thêm một bông ngay tại điểm bấm
- Lưu tự động vào `localStorage`, xuất/nhập file JSON
- Nút **Chia sẻ** tạo link chứa toàn bộ nội dung (media dạng link mới được nhúng vào URL)

## Lưu ý

Không có backend, nên mỗi máy giữ bản nội dung riêng. Muốn gửi cho người khác thì dùng
nút Chia sẻ hoặc xuất file JSON.
