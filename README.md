# 🛒 Shopee Commission & Order Calculator

Tiện ích mở rộng Chrome giúp tính hoa hồng và số đơn hàng Shopee ngay khi có chuyển đổi – không cần chờ app cập nhật!

## 🖼️ Ảnh demo

![Demo Screenshot](https://upanh.nhatkythuthuat.com/images/2025/11/14/cover.png)


[![Version](https://img.shields.io/badge/version-1.6.4-orange.svg)](https://github.com)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-green.svg)](https://chrome.google.com/webstore)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📋 Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng](#tính-năng)
- [Cài đặt](#cài-đặt)
- [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
- [Cấu hình](#cấu-hình)
- [Quyền truy cập](#quyền-truy-cập)
- [Hỗ trợ đa ngôn ngữ](#hỗ-trợ-đa-ngôn-ngữ)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Phát triển](#phát-triển)
- [Đóng góp](#đóng-góp)
- [Liên hệ & Hỗ trợ](#liên-hệ--hỗ-trợ)
- [Changelog](#changelog)
- [FAQ](#faq)

## 🎯 Giới thiệu

**Shopee Commission & Order Calculator** là một tiện ích mở rộng Chrome được thiết kế đặc biệt cho các KOL/KOC và người làm Affiliate Marketing trên Shopee. Tiện ích giúp bạn:

- ✅ Tính toán hoa hồng chính xác ngay lập tức
- ✅ Phân loại đơn hàng theo loại (Video, Live, Social)
- ✅ Theo dõi số đơn hàng và GMV (Gross Merchandise Value)
- ✅ Nhận thông báo tự động khi có đơn/hoa hồng mới
- ✅ Xem thống kê shop và sản phẩm bán chạy nhất

## ✨ Tính năng

### 📊 Tính toán hoa hồng

- **Tổng hoa hồng**: Tổng số tiền hoa hồng từ tất cả các đơn hàng
- **Hoa hồng Xtra**: Hoa hồng từ chương trình Shopee Xtra
- **Hoa hồng Shopee**: Hoa hồng từ Shopee chính
- **Tổng GMV**: Tổng giá trị đơn hàng

### 📦 Phân loại đơn hàng

- **Đơn Video**: Đơn hàng từ video Shopee
- **Đơn Live**: Đơn hàng từ livestream
- **Đơn Social**: Đơn hàng từ mạng xã hội
- **Đơn 0đ**: Đơn hàng không có hoa hồng
- **Đơn chưa thanh toán**: Đơn hàng chưa được thanh toán
- **Đơn hủy**: Đơn hàng đã bị hủy

### 🏆 Thống kê nâng cao

- Top 3 shop có nhiều đơn nhất
- Top 5 sản phẩm nổi bật theo hoa hồng
- Thống kê chi tiết theo từng loại đơn

### 🔔 Thông báo tự động

- Thông báo khi có đơn/hoa hồng mới của ngày hôm qua
- Kiểm tra tự động mỗi 5 phút (từ 6:00 - 17:00)
- Có thể bật/tắt thông báo trong cài đặt
- Thông báo khi phiên đăng nhập hết hạn

### 📸 Chụp ảnh kết quả

- Chụp ảnh toàn bộ kết quả tính toán
- Tự động copy vào clipboard
- Dễ dàng chia sẻ với người khác

### 🌍 Đa ngôn ngữ

Hỗ trợ 5 ngôn ngữ:
- 🇻🇳 Tiếng Việt (mặc định)
- 🇬🇧 English
- 🇹🇭 ไทย (Thai)
- 🇮🇩 Bahasa Indonesia
- 🇵🇭 Filipino

## 📥 Cài đặt

### Cách 1: Cài đặt từ Chrome Web Store (Khuyến nghị)

1. Truy cập [Chrome Web Store](https://chrome.google.com/webstore) và tìm kiếm "Shopee Commission Calculator"
2. Nhấn nút **"Thêm vào Chrome"**
3. Xác nhận cài đặt

### Cách 2: Cài đặt từ mã nguồn (Developer Mode)

1. Tải hoặc clone repository này:
   ```bash
   git clone https://github.com/yourusername/Shopee-Commission-Order-Calculator.git
   cd Shopee-Commission-Order-Calculator
   ```

2. Mở Chrome và truy cập `chrome://extensions/`

3. Bật **"Chế độ dành cho nhà phát triển"** (Developer mode) ở góc trên bên phải

4. Nhấn **"Tải tiện ích đã giải nén"** (Load unpacked)

5. Chọn thư mục chứa mã nguồn

## 📖 Hướng dẫn sử dụng

### Bước 1: Truy cập trang báo cáo Shopee

1. Đăng nhập vào tài khoản [Shopee Affiliate](https://affiliate.shopee.vn)
2. Truy cập trang **Báo cáo chuyển đổi**:
   - URL: `https://affiliate.shopee.vn/report/conversion_report`
   - Hoặc: `https://affiliate.shopee.vn/payment/billing/conversion_details`

### Bước 2: Cấu hình trang báo cáo

1. Nhấn vào biểu tượng **⚙️ (răng cưa)** ở góc phải trên
2. Bật tùy chọn **"Thông tin bổ sung"** để hiển thị đầy đủ thông tin

### Bước 3: Chọn ngày và tìm kiếm

1. **Chọn ngày** bạn muốn xem kết quả
   - 💡 **Mẹo**: Nếu không thể chọn ngày hôm qua, hãy chọn ngày hôm kia trước, sau đó nhấn "Tìm kiếm". Lúc này, hệ thống sẽ cho phép bạn chọn lại ngày hôm qua.
2. Nhấn nút **"Tìm kiếm"** để lọc dữ liệu

### Bước 4: Xem kết quả

1. Nhấn vào **biểu tượng tiện ích** (extension icon) ở góc trình duyệt
2. Kết quả sẽ hiển thị:
   - Tổng hoa hồng, hoa hồng Xtra, hoa hồng Shopee
   - Tổng GMV
   - Số đơn hàng theo từng loại
   - Top shop và sản phẩm bán chạy

### Bước 5: Chụp ảnh kết quả (Tùy chọn)

1. Nhấn nút **🌇** ở góc trên bên trái
2. Ảnh sẽ được tự động copy vào clipboard
3. Dán vào bất kỳ ứng dụng nào để chia sẻ

### Video hướng dẫn

📹 Xem video hướng dẫn chi tiết: [https://goink.me/MjsU](https://goink.me/MjsU)

## ⚙️ Cấu hình

### Mở trang cài đặt

1. Nhấn chuột phải vào biểu tượng tiện ích
2. Chọn **"Tùy chọn"** (Options)
3. Hoặc truy cập: `chrome://extensions/` → Tìm tiện ích → Nhấn **"Chi tiết"** → **"Tùy chọn tiện ích"**

### Các tùy chọn

#### 🔔 Thông báo tự động

- **Bật thông báo tự động**: Nhận thông báo khi có đơn/hoa hồng mới của ngày hôm qua
- Tiện ích sẽ tự động kiểm tra mỗi 5 phút (từ 6:00 - 17:00)
- Mỗi ngày chỉ thông báo 1 lần để tránh spam

#### 📝 Cập nhật

Xem lịch sử các phiên bản và tính năng mới

#### 🚀 Tiện ích

Danh sách các công cụ hữu ích khác:
- Lấy liên kết gốc
- Lấy Affiliate ID
- Xem lịch sử thanh toán
- Xem lịch sử hoa hồng
- Xem lịch sử live
- Tính Thuế TNCN
- Và nhiều công cụ khác...

#### 💡 Bài viết

Các bài viết hướng dẫn và kiến thức về Shopee Affiliate

#### 🔗 Liên hệ & Liên kết

- Bản web
- Bản web VIP
- Bản Chrome PC
- Video hướng dẫn
- Liên hệ hỗ trợ

## 🔐 Quyền truy cập

Tiện ích yêu cầu các quyền sau để hoạt động:

### Quyền cần thiết

- **`notifications`**: Hiển thị thông báo khi có đơn/hoa hồng mới hoặc cần đăng nhập lại
- **`alarms`**: Đặt lịch kiểm tra tự động mỗi 5 phút
- **`storage`**: Lưu ngày đã thông báo để tránh báo trùng
- **`host_permissions`** (affiliate.shopee.vn): Đọc dữ liệu để tính hoa hồng chính xác
- **`scripting`**, **`activeTab`**, **`tabs`**: Làm việc với tab khi người dùng bấm popup

### Bảo mật

🔒 **Tiện ích không thu thập dữ liệu người dùng, an toàn để sử dụng.**

- Không gửi dữ liệu đến server bên thứ ba
- Chỉ đọc dữ liệu từ trang Shopee Affiliate của bạn
- Tất cả tính toán được thực hiện cục bộ trên trình duyệt

## 🌐 Hỗ trợ đa ngôn ngữ

Tiện ích tự động phát hiện ngôn ngữ của trình duyệt và hiển thị giao diện phù hợp:

- 🇻🇳 **Tiếng Việt** (vi) - Mặc định
- 🇬🇧 **English** (en)
- 🇹🇭 **ไทย** (th)
- 🇮🇩 **Bahasa Indonesia** (id)
- 🇵🇭 **Filipino** (ph)

## 🛠️ Công nghệ sử dụng

- **Manifest V3**: Sử dụng Chrome Extension Manifest V3
- **JavaScript (ES6+)**: Ngôn ngữ lập trình chính
- **Bootstrap 5**: Framework CSS cho giao diện
- **jQuery**: Thư viện JavaScript
- **html2canvas**: Chụp ảnh màn hình
- **Chrome APIs**:
  - `chrome.scripting`
  - `chrome.storage`
  - `chrome.notifications`
  - `chrome.alarms`
  - `chrome.tabs`

## 📁 Cấu trúc dự án

```
Shopee-Commission-Order-Calculator/
│
├── _locales/                 # File đa ngôn ngữ
│   ├── en/                  # Tiếng Anh
│   ├── id/                  # Tiếng Indonesia
│   ├── ph/                  # Tiếng Filipino
│   ├── th/                  # Tiếng Thái
│   └── vi/                  # Tiếng Việt
│       └── messages.json
│
├── _metadata/               # Metadata của extension
│   └── verified_contents.json
│
├── css/                     # File CSS
│   ├── bootstrap.min.css
│   ├── popup.css
│   └── styles.css
│
├── icon/                    # Icon của extension
│   ├── icon.png
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
│
├── js/                      # File JavaScript
│   ├── background.js        # Service worker (xử lý nền)
│   ├── html2canvas.min.js  # Thư viện chụp ảnh
│   ├── jquery.min.js       # jQuery
│   ├── options.js          # Xử lý trang cài đặt
│   ├── page-popup.js       # Script chạy trên trang
│   ├── popup.js            # Logic chính của popup
│   └── sidepanel.js        # Xử lý side panel
│
├── cover.png               # Ảnh bìa
├── manifest.json           # File cấu hình extension
├── offscreen.html         # Trang offscreen
├── options.html           # Trang cài đặt
├── popup.html             # Giao diện popup chính
├── sidepanel.html        # Giao diện side panel
└── README.md             # File này
```

## 🚀 Phát triển

### Yêu cầu

- Google Chrome hoặc Chromium-based browser
- Node.js (không bắt buộc, chỉ để phát triển)

### Chạy ở chế độ phát triển

1. Clone repository:
   ```bash
   git clone https://github.com/yourusername/Shopee-Commission-Order-Calculator.git
   cd Shopee-Commission-Order-Calculator
   ```

2. Mở Chrome và truy cập `chrome://extensions/`

3. Bật **"Chế độ dành cho nhà phát triển"**

4. Nhấn **"Tải tiện ích đã giải nén"** và chọn thư mục dự án

5. Sau khi chỉnh sửa code, nhấn nút **"Tải lại"** (Reload) trên trang extensions

### Debug

- **Popup**: Nhấn chuột phải vào icon extension → "Kiểm tra popup"
- **Background script**: Vào `chrome://extensions/` → Tìm extension → "Kiểm tra service worker"
- **Content script**: Mở DevTools trên trang Shopee Affiliate

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng:

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

### Quy tắc đóng góp

- Tuân thủ code style hiện tại
- Thêm comments cho code phức tạp
- Cập nhật README nếu cần
- Test kỹ trước khi submit

## 📞 Liên hệ & Hỗ trợ

### Liên hệ

- 📧 Email: [nguyenanhdon.qn@gmail.com](mailto:nguyenanhdon.qn@gmail.com)
- 🌐 Website: [addlivetag.com](https://addlivetag.com)
- 📱 Nhóm Facebook: [Cộng đồng Tiếp thị liên kết Shopee](https://goink.me/ul2i)

### Liên kết hữu ích

- 🌐 [Bản web](https://goink.me/vvfo)
- 🌐 [Bản web VIP](https://goink.me/YcAw)
- 🧩 [Bản Chrome PC](https://goink.me/jhnC)
- 🎥 [Hướng dẫn web](https://goink.me/vWgU)
- 🎥 [Hướng dẫn tiện ích](https://goink.me/Jpeo)

## 📝 Changelog

### Version 1.6.4 (Hiện tại)

- 🔧 Tối ưu hiệu năng và hoạt động nền
- 🆕 Thêm công cụ Lọc theo subid

### Version 1.6.3 (28/10/2025)

- 🔧 Tối ưu hiệu năng và hoạt động nền, giúp kiểm tra đơn/hoa hồng nhanh & ổn định hơn
- 🆕 Thêm công cụ Lọc theo subid để hỗ trợ quản lý hoa hồng theo subid cá nhân

### Version 1.6.2 (22/08/2025)

- 🔔 Thông báo tự động khi có đơn/hoa hồng mới của ngày hôm qua
- ⚙️ Tuỳ chọn bật/tắt thông báo theo nhu cầu
- ⏱️ Hiệu năng nhanh hơn & hoạt động ổn định, kể cả khi không có mạng

Xem đầy đủ changelog trong trang [Cài đặt](options.html#pane-changelog) của extension.

## ❓ FAQ

### Câu hỏi thường gặp

**Q: Tại sao không thấy kết quả khi mở popup?**  
A: Đảm bảo bạn đang ở trang `https://affiliate.shopee.vn/report/conversion_report` hoặc `/payment/billing/conversion_details` và đã nhấn "Tìm kiếm" trước đó.

**Q: Hoa hồng hiển thị có chính xác không?**  
A: Hoa hồng được tính dựa trên dữ liệu từ trang Shopee Affiliate. Lưu ý: Hoa hồng hiển thị chưa trừ đi phí quản lý MCN (nếu bạn thuộc MCN).

**Q: Tại sao thông báo không hoạt động?**  
A: Kiểm tra xem bạn đã bật thông báo trong cài đặt chưa. Thông báo chỉ hoạt động từ 6:00 - 17:00 và mỗi ngày chỉ báo 1 lần.

**Q: Có thể sử dụng trên trình duyệt khác không?**  
A: Hiện tại chỉ hỗ trợ Chrome và các trình duyệt dựa trên Chromium (Edge, Brave, Opera...).

**Q: Tiện ích có an toàn không?**  
A: Có, tiện ích không thu thập dữ liệu người dùng. Tất cả tính toán được thực hiện cục bộ trên trình duyệt của bạn.

**Q: Làm sao để báo lỗi hoặc đề xuất tính năng?**  
A: Vui lòng gửi email đến [nguyenanhdon.qn@gmail.com](mailto:nguyenanhdon.qn@gmail.com) hoặc tạo issue trên GitHub.

**Q: Tại sao không thể chọn ngày hôm qua?**  
A: Đây là giới hạn của trang Shopee. Hãy chọn ngày hôm kia trước, nhấn "Tìm kiếm", sau đó bạn sẽ có thể chọn lại ngày hôm qua.

**Q: Có hỗ trợ tính hoa hồng theo SubID không?**  
A: Có, bạn có thể sử dụng công cụ VIP "Lọc theo SubID" tại [https://goink.me/9enf](https://goink.me/9enf).

## 📄 License

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 🙏 Lời cảm ơn

Cảm ơn tất cả những người đã sử dụng và đóng góp cho dự án này!

---

**Made with ❤️ for Shopee Affiliate Community**

⭐ Nếu bạn thấy tiện ích hữu ích, hãy đánh giá 5 sao trên Chrome Web Store!

