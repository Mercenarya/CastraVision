# Kỹ năng Tạo Mô hình Django

Kỹ năng này cung cấp hướng dẫn để tạo các mô hình Django theo các thực hành tốt nhất cho dự án CastraVision.

## Khi nào nên sử dụng
Sử dụng kỹ năng này khi bạn cần tạo một mô hình Django mới hoặc sửa đổi một mô hình hiện có trong ứng dụng CastraServices.

## Các bước Thực hiện

### 1. Lập kế hoạch Mô hình
- [ ] Xác định thực thể mà mô hình này đại diện
- [ ] Liệt kê tất cả các trường cần thiết và jejich loại
- [ ] Xác định mối quan hệ với các mô hình khác
- [ ] Xem xét những chỉ mục cơ sở dữ liệu nào có thể cần thiết
- [ ] Lập kế hoạch cho bất kỳ phương pháp hoặc thuộc tính tùy chỉnh nào

### 2. Tạo File Mô hình
- [ ] Tạo mô hình trong `CastraServices/models.py`
- [ ] Thêm các import cần thiết ở đầu file
- [ ] Tuân theo quy ước đặt tên: CamelCase cho tên mô hình
- [ ] Thêm tài liệu mô tả mô tả mục đích của mô hình

### 3. Xác định Trường
Mỗi trường:
- [ ] Chọn loại trường phù hợp (CharField, IntegerField, etc.)
- [ ] Đặt `null=True` chỉ nếu trường thực sự có thể là NULL trong cơ sở dữ liệu
- [ ] Đặt `blank=True` chỉ nếu trường có thể để trống trong biểu mẫu
- [ ] Cung cấp `verbose_name` và `help_text` mô tả khi cần thiết
- [ ] Sử dụng tham số `choices` cho các trường có giới hạn lựa chọn
- [ ] Xem xét sử dụng giá trị `default` khi thích hợp
- [ ] Thêm `db_index=True` cho các trường sẽ được truy vấn thường xuyên
- [ ] Sử dụng `unique=True` cho các trường phải là duy nhất

### 4. Thiết lập Mối quan hệ
- [ ] Sử dụng `ForeignKey` cho mối quan hệ nhiều-đến-một
- [ ] Sử dụng `ManyToManyField` cho mối quan hệ nhiều-đến-nhiều
- [ ] Sử dụng `OneToOneField` cho mối quan hệ một-đến-một
- [ ] Luôn chỉ định `related_name` để tránh xung đột truy cập ngược
- [ ] Xem xét sử dụng `on_delete=models.CASCADE` hoặc các tùy chọn phù hợp khác
- [ ] Sử dụng `limit_choices_to` để giới hạn lựa chọn trong admin/Forms khi cần

### 5. Thêm Phương pháp Mô hình
- [ ] Luôn triển khai phương pháp `__str__()` trả về biểu diễn có thể đọc được
- [ ] Triển khai phương pháp `get_absolute_url()` nếu mô hình có chi tiết view
- [ ] Thêm các phương pháp tùy chỉnh cho các thao tác phổ biến
- [ ] Sử dụng trang trí `@property` cho các thuộc tính được tính toán
- [ ] Xem xét thêm quản trị mô hình cho các truy vấn phức tạp

### 6. Tùy chọn Meta Mô hình
- [ ] Đặt `app_label` nếu cần (thường không bắt buộc)
- [ ] Sử dụng `ordering` để xác định thứ tự mặc định
- [ ] Đặt `verbose_name` và `verbose_name_plural` cho giao diện admin
- [ ] Sử dụng `unique_together` hoặc `constraints` để duy nhất nhiều trường
- [ ] Thêm `indexes` cho các chỉ mục cơ sở dữ liệu tùy chỉnh
- [ ] Xem xét `get_latest_by` nếu thích hợp

### 7. Migration ban đầu
- [ ] Chạy `python manage.py makemigrations CastraServices`
- [ ] Kiểm tra file migration được tạo ra
- [ ] Chạy `python manage.py migrate` để áp dụng migration
- [ ] Kiểm tra bất kỳ cảnh báo hoặc lỗi migration nào

### 8. Đăng ký Admin
- [ ] Đăng ký mô hình trong `CastraServices/admin.py`
- [ ] Sử dụng trang trí `@admin.register` hoặc `admin.site.register`
- [ ] Cấu hình `list_display`, `list_filter`, `search_fields` như thích hợp
- [ ] Thêm `readonly_fields` cho các trường không nên được chỉnh sửa
- [ ] Xem xét sử dụng `inlines` cho các mô hình liên quan

### 9. Kiểm thử
- [ ] Tạo kiểm thử đơn vị cho mô hình trong `CastraServices/tests.py`
- [ ] Kiểm tra việc tạo mô hình, xác thực và các phương pháp
- [ ] Kiểm tra bất kỳ quản trị hoặc truy vấn tùy chỉnh nào
- [ ] Kiểm thử giao diện admin nếu được tùy chỉnh

### 10. Tài liệu
- [ ] Cập nhật bất kỳ tài liệu liên quan nào
- [ ] Thêm comment để giải thích logic phức tạp
- [ ] Đảm bảo tài liệu mô tả của mô hình được cập nhật

## Hướng dẫn Loại Trường

### Trường Văn bản
- `CharField`: Dành cho chuỗi ngắn (đặt max_length thích hợp)
- `TextField`: Dành cho nội dung văn bản dài
- `SlugField`: Dành cho chuỗi thân thiện với URL (thường là duy nhất)
- `URLField`: Dành để lưu trữ URL với xác thực

### Trường Số
- `IntegerField`: Dành cho số nguyên
- `PositiveIntegerField`: Dành cho số nguyên không âm
- `SmallIntegerField`: Dành cho số nguyên phạm vi nhỏ
- `BigIntegerField`: Dành cho số nguyên rất lớn
- `FloatField`: Dành cho số thực
- `DecimalField`: Dành cho số thập phân chính xác (sử dụng cho tiền tệ)

### Trường Ngày/Giờ
- `DateField`: Dành cho ngày chỉ
- `TimeField`: Dành cho giờ chỉ
- `DateTimeField`: Dành cho cả ngày và giờ
- Sử dụng `auto_now_add` và `auto_now` một cách thích hợp

### Trường Mối quan hệ
- `ForeignKey`: Nhiều-đến-một (thường dùng nhất)
- `ManyToManyField`: Nhiều-đến-nhiều
- `OneToOneField`: Một-đến-một

### Trường Đặc biệt
- `EmailField`: Dành cho địa chỉ email có xác thực
- `FileField`/`ImageField`: Dành cho tải lên file
- `BooleanField`: Dành cho giá trị true/false
- `JSONField`: Dành để lưu trữ dữ liệu JSON (PostgreSQL)

## Mẫu Thường見

### Mô hình có dấu thời gian
```python
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
```

### Mẫu Xóa mềm
```python
class SoftDeleteModel(models.Model):
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        abstract = True
        
    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()
```

### Mô hình có Trạng thái
```python
class StatusModel(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Nháp'),
        ('pending', 'Đang chờ'),
        ('approved', 'Đã duyệt'),
        ('rejected', 'Đã từ chối'),
    ]
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
```

## Hướng dẫn Xác thực
- Sử dụng validators ở mức trường khi thích hợp
- Triển khai phương pháp `clean()` để xác thực chéo trường
- Sử dụng phương법 `clean_<fieldname>()` để xác thực cụ thể trường
- Ném `ValidationError` với thông báo mô tả

## Xem xét Hiệu suất
- Xem xét chỉ mục cơ sở dữ liệu cho các trường thường được truy vấn
- Sử dụng `select_related()` và `prefetch_related()` trong các truy vấn
- Bảo chuẩn hóa suy nghĩ và chỉ khi cần thiết
- Xem xét việc lưu trữ cache cho các tính toán tốn kém

## Xem xét Bảo mật
- Xác thực tất cả đầu vào của người dùng
- Sử dụng sự bảo vệ tích hợp của Django chống lại các lỗ hổng phổ biến
- Cẩn thận với việc tải lên file (xác thực loại file, quét phần mềm độc hại)
- Không bao giờ tin tưởng vào xác thực phía client một mình