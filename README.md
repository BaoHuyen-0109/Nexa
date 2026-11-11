# 🚀 NEXA — SMART USER PLATFORM
### Nền tảng Quản trị Người dùng Thông minh Đa nền tảng (Web Admin & Mobile App)

![React Native](https://img.shields.io/badge/React_Native-0.88.1-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo_SDK-58-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-ptdnt--dc87f-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20iOS%20%7C%20Android-8B5CF6?style=for-the-badge)

---

## 📖 1. Giới thiệu tổng quan

**NEXA - Smart User Platform** là giải pháp phần mềm quản trị người dùng thế hệ mới, đáp ứng đầy đủ nghiệp vụ quản lý dữ liệu đám mây trên cả hai nền tảng:
- **Web Admin Dashboard**: Bảng điều khiển quản trị chuyên sâu dành cho Desktop/Laptop với giao diện 2 cột hiện đại, thống kê trực quan, tìm kiếm, lọc dữ liệu, phân trang và xuất báo cáo JSON.
- **Mobile Application**: Ứng dụng di động tối ưu cho thiết bị iOS & Android (qua Expo Go), đồng bộ nhận diện thương hiệu Nexa, tích hợp chụp/chọn ảnh trực tiếp từ thiết bị, nén Base64 và cập nhật đám mây.

Dự án được xây dựng theo kiến trúc phân tầng chuẩn doanh nghiệp (**Repository - Service Pattern**), kết nối trực tiếp với hệ sinh thái **Google Cloud Firebase** (`ptdnt-dc87f`) với cơ chế **Đồng bộ thời gian thực hai chiều (Two-way Realtime Synchronization)**.

---

## ✨ 2. Tính năng nổi bật

### 🖥️ Web Admin Dashboard
- **Bảo mật Quản trị viên**: Xác thực đăng nhập qua Firebase Authentication với cơ chế kiểm tra quyền nghiêm ngặt trong collection `/admins/{uid}`.
- **Thống kê thời gian thực**: 4 thẻ KPI chỉ số trực quan (Tổng người dùng, Ảnh Base64, Liên kết URL, Người dùng hoạt động).
- **Quản lý người dùng toàn diện (Full CRUD)**:
  - **Thêm mới**: Form nhập liệu với kiểm tra hợp lệ dữ liệu chặt chẽ (Validation), hỗ trợ nạp ảnh qua URL hoặc tệp hình ảnh.
  - **Xem chi tiết đa điểm**: Hỗ trợ mở modal chi tiết người dùng khi click vào **Avatar**, **Họ tên**, **Email** hoặc nút **Icon con mắt (👁️)**.
  - **Chỉnh sửa**: Cập nhật thông tin nhanh chóng, cập nhật tức thì lên Firestore.
  - **Xóa an toàn**: Hộp thoại xác nhận thao tác xóa có cảnh báo rủi ro (`ConfirmDialog`).
- **Tìm kiếm & Phân loại thông minh**:
  - Tìm kiếm tức thì theo Họ tên hoặc Email không cần tải lại trang.
  - Bộ lọc định dạng hình ảnh: *Tất cả*, *Ảnh tải lên (Base64)*, *Ảnh liên kết (URL)*.
  - Phân trang chuẩn **5 mục/trang** với các nút điều hướng trang trước/sau và đánh số trang trực quan.
- **Kết xuất cơ sở dữ liệu (Export Database)**:
  - Tải về tệp `PTDNT_Database.json` chứa toàn bộ dữ liệu người dùng Firestore phục vụ kiểm tra và nộp bài chỉ với 1 cú click.

### 📱 Ứng dụng Di động (Mobile App iOS & Android)
- **Giao diện chuẩn di động**: Tối ưu riêng cho màn hình cảm ứng di động, bo góc tinh tế, tông màu tím lavender hoàng gia (`#635BFF` / `#1E164B`), không bị vỡ bố cục hay che khuất bàn phím.
- **Chọn & Xử lý ảnh từ thiết bị**:
  - Sử dụng thư viện `expo-image-picker` chuẩn Expo SDK 58.
  - Xin cấp quyền truy cập thư viện ảnh tự động.
  - Nén ảnh thông minh dạng **Base64 Data URL** $\le 700\text{ KB}$ để đảm bảo giới hạn lưu trữ Firestore (1MB/document).
  - Hiển thị ảnh xem trước (Preview) kèm thông tin dung lượng thực tế trước khi lưu.
- **Đồng bộ thời gian thực hai chiều (Realtime Sync)**:
  - Sử dụng Firestore `onSnapshot`: Khi thêm/sửa/xóa người dùng trên điện thoại, bảng dữ liệu trên Web Dashboard lập tức tự cập nhật ngay trong tích tắc mà không cần F5/load lại trang.

### ⚡ Tối ưu hóa hiệu năng đỉnh cao (Performance Optimization)
- **Cơ chế Tree-shaking Icon (`src/icons.ts`)**: Giảm số lượng module biên dịch từ **2.740 modules** xuống **706 modules** (giảm 74%), cắt giảm 50% dung lượng bundle (từ 4.7MB xuống 2.2MB), tốc độ khởi động nhanh hơn **235 lần** (từ 91 giây xuống 387 ms).
- **Nexa Instant Preloader (`web/index.html`)**: Tích hợp màn hình chờ thương hiệu Nexa sẵn trong mã nguồn HTML gốc, triệt tiêu 100% hiện tượng màn hình trắng khi tải trang.
- **Bộ lưu trữ phiên đăng nhập bền vững (`AsyncStorage`)**: Tích hợp `getReactNativePersistence` cho thiết bị di động và `indexedDB` cho Web, duy trì đăng nhập ổn định.

---

## 🏗️ 3. Kiến trúc dự án (Architecture)

```text
E:\GK_PTUDĐNT
├── assets/                     # Tài nguyên tĩnh, logo Nexa
├── web/                        # Template Web HTML với Preloader Nexa tích hợp
│   └── index.html
├── src/
│   ├── config/
│   │   └── firebase.ts         # Khởi tạo Firebase App, Auth, Firestore (ptdnt-dc87f)
│   ├── models/
│   │   ├── UserModel.ts        # Mô hình 4 trường: hoten, email, matkhau: null, hinhanh
│   │   └── BaseModel.ts        # Lớp cơ sở Entity
│   ├── repositories/
│   │   ├── IUserRepository.ts  # Hợp đồng giao tiếp dữ liệu CRUD + Realtime
│   │   └── FirebaseUserRepository.ts # Triển khai thao tác trực tiếp với Cloud Firestore
│   ├── services/
│   │   ├── UserService.ts      # Nghiệp vụ logic người dùng, đếm số lượng, realtime sync
│   │   ├── AuthService.ts      # Xác thực Admin và phân quyền /admins/{uid}
│   │   ├── DatabaseExportService.ts # Xuất file JSON PTDNT_Database.json
│   │   ├── image/
│   │   │   ├── Base64ImageService.ts # Nén ảnh và chuyển đổi Base64
│   │   │   └── UrlImageService.ts    # Kiểm tra tính hợp lệ của link ảnh
│   │   └── index.ts
│   ├── components/
│   │   ├── common/             # Button, Header, Modal, ConfirmDialog, NexaLogo, Preloader
│   │   ├── forms/              # CustomInput, PasswordInput, SearchBar, UserFormModal
│   │   ├── cards/              # Thẻ thống kê, thẻ người dùng
│   │   └── index.ts
│   ├── screens/
│   │   ├── auth/               # LoginScreen (Giao diện đăng nhập Admin Web/Mobile)
│   │   ├── home/               # HomeScreen (Bảng điều khiển Web Dashboard trung tâm)
│   │   ├── list/               # ListScreen (Danh sách người dùng trên Mobile)
│   │   ├── detail/             # DetailScreen (Xem chi tiết & chọn ảnh từ thiết bị)
│   │   └── profile/            # ProfileScreen (Thông tin tài khoản Admin)
│   ├── navigation/
│   │   ├── RootNavigator.tsx   # Bộ định tuyến bảo vệ có xác thực Admin
│   │   ├── AuthStack.tsx       # Luồng Đăng nhập
│   │   └── MainTabNavigator.tsx# Bottom Tab Bar cho ứng dụng di động
│   ├── theme/                  # Bảng màu Tím Lavender & Trắng chuẩn thương hiệu Nexa
│   ├── icons.ts                # Module Icon tối ưu hóa Tree-shaking siêu tốc
│   ├── types/                  # Kiểu dữ liệu TypeScript định nghĩa chặt chẽ
│   └── utils/                  # Trình xử lý lỗi, bộ kiểm tra biểu thức chính quy (Regex)
├── App.tsx                     # Điểm khởi chạy ứng dụng chính
├── metro.config.js             # Cấu hình tối ưu Metro Bundler
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📊 4. Mô hình dữ liệu Cloud Firestore

Dữ liệu được lưu trữ tại Cloud Firestore theo đúng quy chuẩn bài thi:
- **Collection**: `/users/{userId}`
- **Cấu trúc Document (Chính xác 4 trường nghiệp vụ)**:

| Tên trường | Kiểu dữ liệu | Ý nghĩa | Ràng buộc bảo mật |
|:---|:---|:---|:---|
| `hoten` | `string` | Họ và tên người dùng | Bắt buộc, độ dài từ 2 đến 100 ký tự |
| `email` | `string` | Địa chỉ email người dùng | Bắt buộc, đúng định dạng email RFC |
| `matkhau` | `null` | Mật khẩu tài khoản | **Luôn luôn là `null`** (Mật khẩu được mã hóa an toàn trên Firebase Authentication) |
| `hinhanh` | `string` | Hình ảnh đại diện | Chuỗi Base64 Data URL (`data:image/...`) hoặc URL Web hợp lệ |

- **Phân quyền Quản trị viên**: Lưu tại collection `/admins/{uid}` với document rỗng xác thực đặc quyền Admin.

---

## 🛠️ 5. Yêu cầu hệ thống & Cài đặt

### Yêu cầu:
- **Node.js**: Phiên bản 20.x trở lên (Khuyến nghị LTS).
- **Trình quản lý gói**: `npm` hoặc `bun`.
- **Thiết bị chạy**: Trình duyệt Web (Chrome, Edge, Safari) hoặc Thiết bị di động đã cài **Expo Go**.

### Các bước cài đặt:

1. **Clone mã nguồn về máy**:
   ```bash
   git clone https://github.com/BaoHuyen-0109/Nexa.git
   cd Nexa
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies)**:
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường**:
   - Sao chép file `.env.example` thành `.env`:
     ```bash
     cp .env.example .env
     ```
   - Điền các thông số cấu hình của Firebase project `ptdnt-dc87f`:
     ```env
     EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
     EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=ptdnt-dc87f.firebaseapp.com
     EXPO_PUBLIC_FIREBASE_PROJECT_ID=ptdnt-dc87f
     EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=ptdnt-dc87f.firebasestorage.app
     EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
     EXPO_PUBLIC_FIREBASE_APP_ID=1:...
     ```

4. **Kiểm tra tính toàn vẹn kiểu dữ liệu (Typecheck)**:
   ```bash
   npm run typecheck
   ```

---

## 🚀 6. Hướng dẫn khởi chạy ứng dụng

### Chạy hệ thống Metro Bundler:
```bash
npx expo start
```

### 1. Trải nghiệm trên Web Dashboard (Desktop / Laptop):
- Nhấn phím `w` trong cửa sổ Terminal hoặc mở trình duyệt tại:
  ```
  http://localhost:8081
  ```
- **Tài khoản Quản trị viên mặc định**:
  - **Email**: `admin@ptdnt.edu.vn`
  - **Mật khẩu**: `123456`

### 2. Trải nghiệm trên Mobile App (iOS / Android Expo Go):
- Mở ứng dụng **Expo Go** trên Android hoặc ứng dụng **Camera** trên iPhone (kết nối cùng Wi-Fi với máy tính).
- Quét mã QR code hiển thị trên màn hình Terminal để nạp ứng dụng.
- Trường hợp Wi-Fi trường học hoặc cơ quan chặn kết nối nội bộ LAN giữa điện thoại và máy tính, hãy khởi động chế độ Tunnel:
  ```bash
  npx expo start --tunnel
  ```

---

## 🧪 7. Kịch bản kiểm thử đề xuất (Test Scenarios)

1. **Kiểm thử Xác thực Admin**:
   - Nhập tài khoản không hợp lệ hoặc tài khoản không có trong `/admins` $\rightarrow$ Hệ thống từ chối truy cập và báo lỗi rõ ràng.
   - Nhập `admin@ptdnt.edu.vn` / `123456` $\rightarrow$ Đăng nhập thành công vào bảng điều khiển.
2. **Kiểm thử Đồng bộ thời gian thực hai chiều (Realtime Sync)**:
   - Mở song song Web Dashboard trên máy tính và Mobile App trên điện thoại.
   - Trên điện thoại: Nhấn nút `+` để thêm một người dùng mới.
   - Quan sát Web Dashboard: Dữ liệu người dùng mới xuất hiện ngay lập tức mà không cần bấm F5.
3. **Kiểm thử Chọn ảnh từ thiết bị**:
   - Trên điện thoại, vào chi tiết một người dùng $\rightarrow$ Bấm nút *"Chọn ảnh từ thiết bị"*.
   - Cấp quyền truy cập ảnh $\rightarrow$ Chọn một ảnh chân dung từ thư viện.
   - Ảnh được xem trước, nén Base64 $\le 700\text{ KB}$ kèm thông số dung lượng $\rightarrow$ Bấm *"Lưu ảnh đại diện mới"*.
   - Dữ liệu ảnh mới được ghi nhận vào Firestore và hiển thị đồng bộ trên cả Web.
4. **Kiểm thử Xuất dữ liệu JSON**:
   - Trên Web Dashboard, bấm nút *"Xuất cơ sở dữ liệu (JSON)"* $\rightarrow$ Tệp `PTDNT_Database.json` được tải về máy tính với cấu trúc chuẩn 4 trường.

---

## 👥 Tác giả & Bản quyền

- **Dự án**: NEXA — SMART USER PLATFORM
- **Mã nguồn**: [https://github.com/BaoHuyen-0109/Nexa.git](https://github.com/BaoHuyen-0109/Nexa.git)
- **Bản quyền**: © 2026 NEXA PLATFORM. All rights reserved.
