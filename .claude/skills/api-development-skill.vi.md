# Kỹ năng Phát triển API cho CastraVision

Kỹ năng này cung cấp hướng dẫn để phát triển API RESTful theo các thực hành tốt nhất cho dự án CastraVision,主要 sử dụng Django REST Framework (DRF).

## Khi nào nên sử dụng
Sử dụng kỹ năng này khi bạn cần tạo endpoints API mới, sửa đổi endpoints hiện có, hoặc thiết kế hợp đồng API cho backend CastraVision.

## Các bước Thực hiện

### 1. Lập kế hoạch Thiết kế API
- [ ] Xác định tài nguyên(s) mà API này sẽ cung cấp
- [ ] Xác định các phương thức HTTP cần be (GET, POST, PUT, PATCH, DELETE)
- [ ] Lập kế hoạch các endpoints API tuân theo các ước định REST
- [ ] Định nghĩa schemas yêu cầu/phản hồi
- [ ] Xem xét yêu cầu về xác thực và ủy quyền
- [ ] Lập kế hoạch cho nhu cầu lọc, sắp xếp và phân trang
- [ ] Fikir về chiến lược phiên bản nếu cần

### 2. Thiết lập DRF (nếu chưa được cấu hình)
- [ ] Đảm bảo `rest_framework` nằm trong `INSTALLED_APPS`
- [ ] Cấu hình các lớp xác thực mặc định trong settings
- [ ] Cập nhật các lớp.permission mặc định
- [ ] Thiết lập mặc định cho phân trang
- [ ] Cấu hình giới hạn tốc độ nếu cần
- [ ] Thiết lập lớp phân tích và kết xuất

### 3. Tạo Serializer
- [ ] Tạo serializer trong `CastraServices/serializers.py` hoặc file serializers dành riêng cho ứng dụng
- [ ] Import các mô-đun cần thiết: `from rest_framework import serializers`
- [ ] Chọn loại serializer phù hợp:
  - `ModelSerializer` cho API dựa trên mô hình (thường dùng nhất)
  - `Serializer` cho dữ liệu tùy chỉnh/tổng hợp
  - `ListSerializer` cho danh sách các đối tượng
- [ ] Liệt kê rõ ràng các trường thay vì sử dụng `'__all__'` vì lý do bảo mật
- [ ] Thêm phương pháp xác thực cho các trường hợp xác thực phức tạp
- [ ] Sử dụng `SerializerMethodField` cho các trường được tính toán
- [ ] Sử dụng serializer lồng nhau cho mối quan hệ khi thích hợp
- [ ] Sử dụng `PrimaryKeyRelatedField` hoặc `SlugRelatedField` cho mối quan hệ đơn giản
- [ ] Thêm `read_only_fields` cho các trường không nên được sửa đổi qua API
- [ ] Xem xét sử dụng `extra_kwargs` để tùy chỉnh trường theo mức

### 4. Tạo Views/ViewSets
- [ ] Tạo views trong `CastraServices/views.py` hoặc file views dành riêng cho ứng dụng
- [ ] Chọn loại view phù hợp:
  - `APIView` để kiểm soát tùy chỉnh/độ thấp
  - `GenericAPIView` cho các mẫu phổ biến
  - `ModelViewSet` cho các thao tác CRUD đầy đủ (thường dùng nhất)
  - `ReadOnlyModelViewSet` cho các endpoints chỉ đọc
- [ ] Đặt thuộc tính `queryset` hoặc ghi đè phương thức `get_queryset()`
- [ ] Đặt thuộc tính `serializer_class`
- [ ] Cấu hình các lớp permission (`permission_classes`)
- [ ] Cấu hình các lớp xác thực (`authentication_classes`)
- [ ] Triển khai các phương thức tùy chỉnh cho các hành động đặc biệt (decorator `@action`)
- [ ] Ghi đè `perform_create`, `perform_update`, `perform_destroy` khi cần
- [ ] Xem xét sử dụng mixins cho các kết hợp hành vi tùy chỉnh

### 5. Cấu hình URL
- [ ] Đăng ký viewsets với router trong `CastraServices/urls.py` hoặc urls dành riêng cho ứng dụng
- [ ] Sử dụng `DefaultRouter` hoặc `SimpleRouter` từ DRF
- [ ] Xác định URL thủ công cho các views tùy chỉnh nếu cần
- [ ] Bao gồm URLs của ứng dụng vào file `urls.py` chính của dự án
- [ ] Xem xét phiên bản API trong URLs (`/api/v1/`, `/api/v2/`)
- [ ] Sử dụng tên URL có ý nghĩa để tìm ngược lại

### 6. Xác thực và Ủy quyền
- [ ] Chọn phương pháp xác thực thích hợp:
  - `TokenAuthentication` để xác thực dựa trên token đơn giản
  - `SessionAuthentication` cho khách hàng web
  - `JWTAuthentication` (cần gói bên ngoài) để xác thực stateless
  - Xác thực tùy chỉnh cho yêu cầu đặc biệt
- [ ] Thiết lập các lớp permission thích hợp:
  - `IsAuthenticated` để chỉ cho phép truy cập đã xác thực
  - `IsAdminUser` để chỉ cho phép truy cập admin
  - `IsAuthenticatedOrReadOnly` để cho phép đọc công khai, yêu cầu xác thực để ghi
  - Các permission tùy chỉnh cho logic kinh doanh
- [ ] Triển khai 권한 mức đối tượng khi cần
- [ ] Sử dụng hệ thống permission của Django hoặc tạo các lớp permission tùy chỉnh

### 7. Xác thực và Xử lý lỗi
- [ ] Sử dụng xác thực của serializer cho dữ liệu đầu vào
- [ ] Triển khai phương thức `validate()` để xác thực chéo trường
- [ ] Triển khai phương thức `validate_<fieldname>()` để xác thực cụ thể trường
- [ ] Ném `serializers.ValidationError` với thông báo mô tả
- [ ] Xử lý ngoại lệ toàn cục hoặc theo từng view khi cần
- [ ] Trả về mã trạng thái HTTP thích hợp:
  - 200 OK cho GET/PUT/PATCH thành công
  - 201 Created cho POST thành công
  - 204 No Content cho DELETE thành công
  - 400 Bad Request cho lỗi xác thực
  - 401 Unauthorized cho lỗi xác thực
  - 403 Forbidden cho lỗi authorize
  - 404 Not Found cho tài nguyên không tồn tại
  - 405 Method Not Allowed cho phương thức không được hỗ trợ
  - 429 Too Many Requests cho giới hạn tốc độ
  - 500 Internal Server Error cho lỗi máy chủ

### 8. Phân trang, Lọc và Sắp xếp
- [ ] Cấu hình phân trang:
  - `PageNumberPagination` (mặc định)
  - `LimitOffsetPagination`
  - `CursorPagination` cho các tập dữ liệu lớn
- [ ] Đặt kích thước trang hợp lý
- [ ] Cho phép clients ghi đè kích thước trang trong giới hạn
- [ ] Triển khai lọc:
  - Sử dụng `DjangoFilterBackend` để khớp chính xác
  - Sử dụng `SearchFilter` để tìm kiếm văn bản
  - Sử dụng `OrderingFilter` để sắp xếp
  - Xem xét `django-filter` để lọc phức tạp
- [ ] Tài liệu các tham số lọc có sẵn

### 9. Tài liệu API
- [ ] Sử dụng tài liệu tích hợp của DRF hoặc tích hợp với:
  - `drf-yasg` (Yet Another Swagger Generator)
  - `drf-spectacular` (lựa chọn hiện đại)
  - Tài liệu CoreAPI
- [ ] Đảm bảo tất cả endpoints được tài liệu hoá
- [ ] Tài liệu schemas yêu cầu/phản hồi
- [ ] Tài liệu yêu cầu xác thực
- [ ] Tài liệu giới hạn tốc độ nếu áp dụng
- [ ] Giữ tài liệu luôn cập nhật theo thay đổi code

### 10. Kiểm thử
- [ ] Tạo kiểm thử API trong `CastraServices/tests.py` hoặc file test
- [ ] Sử dụng `APIClient` hoặc `APITestCase` từ DRF
- [ ] Kiểm thử xác thực và ủy quyền
- [ ] Kiểm thử tất cả các thao tác CRUD
- [ ] Kiểm thử xác thực và phản hồi lỗi
- [ ] Kiểm thử lọc, sắp xếp và phân trang
- [ ] Kiểm thử các trường hợp đặc biệt và điều kiện biên
- [ ] Kiểm thử hiệu suất với các tập dữ liệu lớn nếu thích hợp
- [ ] Sử dụng nhà máy (như `factory_boy`) để tạo dữ liệu test

### 11. Cân nhắc Hiệu suất
- [ ] Sử dụng `select_related()` và `prefetch_related()` trong queryset
- [ ] Thêm chỉ mục cơ sở dữ liệu cho các trường thường được truy vấn
- [ ] Xem xét caching cho các hoạt động tốn kém
- [ ] Triển khai phân trang để tránh phản hồi quá lớn
- [ ] Sử dụng phản hồi stream cho các file download lớn
- [ ] Xem xét sử dụng `django-elasticsearch-dsl` cho API tìm kiếm-intensive
- [ ] Giám sát hiệu suất API và tối ưu các endpoints chậm

### 12. Cân nhắc Bảo mật
- [ ] Triển khai giới hạn tốc độ/throttling để ngăn chặn lạm dụng
- [ ] Sử dụng HTTPS trong môi trường sản xuất
- [ ] Xác thực và làm sạch tất cả các đầu vào
- [ ] Bảo vệ chống lại các lỗ hổng phổ biến:
  - SQL Injection (ORM bảo vệ, nhưng cẩn thận với các truy vấn thô)
  - XSS (DRF cung cấp bảo vệ, nhưng cẩn thận với các mẫu tùy chỉnh)
  - CSRF (DRF có xử lý thích hợp cho các phương thức xác thực khác nhau)
  - Lộ thông tin (alô không rò rỉ dữ liệu nhạy cảm trong lỗi)
- [ ] Triển khai chính sách CORS thích hợp nếu cần
- [ ] Xem xét sử dụng HTTPS chỉ cho các endpoints nhạy cảm
- [ ] Xác thực tải lên file về loại và kích thước
- [ ] Triển khai giới hạn chiều dài đầu vào để ngăn chặn DoS

### 13. Chiến lược Phiên bản
- [ ] Chọn phương pháp phiên bản:
  - Phiên bản trong URL (`/api/v1/resource/`)
  - Phiên bản trong header (`Accept: application/vnd.myapi.v1+json`)
  - Phiên bản trong tham số truy vấn (`?version=1.0`)
- [ ] Tài liệu chính sách bất mãn
- [ ] Lập kế hoạch cho khả năng tương thích ngược
- [ ] Xem xét sử dụng các lược đồ phiên bản của DRF

## Hướng dẫn Serializer

### Truyên принять ModelSerializer Best Practices
```python
from rest_framework import serializers
from .models import MyModel

class MyModelSerializer(serializers.ModelSerializer):
    # Liệt kê rõ ràng các trường vì lý do bảo mật và tính rõ ràng
    class Meta:
        model = MyModel
        fields = ['id', 'name', 'email', 'created_at', 'is_active']
        read_only_fields = ['id', 'created_at']  # Các trường khách hàng không thể sửa đổi
    
    # Xác thực mức trường
    def validate_email(self, value):
        if not value.endswith('@example.com'):
            raise serializers.ValidationError("Email phải từ domain example.com")
        return value
    
    # Xác thực chéo trường
    def validate(self, attrs):
        if attrs.get('is_active') and not attrs.get('email'):
            raise serializers.ValidationError({
                'email': 'Email là bắt buộc khi tài khoản được kích hoạt'
            })
        return attrs
    
    # Trường được tính toán
    def get_display_name(self, obj):
        return f"{obj.name} ({obj.email})"
    
    # Ghi đè create/update nếu cần
    def create(self, validated_data):
        # Logic tùy chỉnh tạo
        return super().create(validated_data)
```

### Xử lý Mối quan hệ
```python
# Lựa chọn 1: Khóa chính (đơn giản và hiệu quả)
class AuthorSerializer(serializers.ModelSerializer):
    books = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Book.objects.all()
    )
    
    class Meta:
        model = Author
        fields = ['id', 'name', 'books']

# Lựa chọn 2: Serializer lồng nhau (chi tiết hơn nhưng nặng hơn)
class AuthorSerializer(serializers.ModelSerializer):
    books = BookSerializer(many=True, read_only=True)
    
    class Meta:
        model = Author
        fields = ['id', 'name', 'books']

# Lựa chọn 3: Quan hệ siêu liên kết (tuân thủ REST)
class AuthorSerializer(serializers.ModelSerializer):
    books = serializers.HyperlinkedRelatedField(
        many=True,
        view_name='book-detail',
        read_only=True
    )
    
    class Meta:
        model = Author
        fields = ['id', 'name', 'books']
```

## Mẫu ViewSet

### ModelViewSet Cơ bản
```python
from rest_framework import viewsets, permissions
from .models import MyModel
from .serializers import MyModelSerializer

class MyModelViewSet(viewsets.ModelViewSet):
    queryset = MyModel.objects.all()
    serializer_class = MyModelSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # Ghi đè get_queryset để lọc dựa trên người dùng
    def get_queryset(self):
        queryset = MyModel.objects.all()
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(owner=self.request.user)
    
    # Hành động tùy chỉnh
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        instance = self.get_object()
        instance.is_active = True
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
```

### ViewSet Chỉ đọc
```python
class PublicProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_published=True)
    serializer_class = PublicProductSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'price_range']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'created_at']
    ordering = ['-created_at']
```

## Ví dụ Phân trang

### PageNumberPagination Tuỳ chỉnh
```python
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            'links': {
                'next': self.get_next_link(),
                'previous': self.get_previous_link()
            },
            'count': self.page.paginator.count,
            'results': data
        })
```

### CursorPagination cho Cuộn Vô hạn
```python
from rest_framework.pagination import CursorPagination

class ProductCursorPagination(CursorPagination):
    page_size = 10
    ordering = '-created_at'
    cursor_query_param = 'cursor'
```

## Ví dụ Lọc

### DjangoFilterBackend
```python
import django_filters
from rest_framework import filters
from .models import Product

class ProductFilter(django_filters.FilterSet):
    price_min = django_filters.NumberFilter(field_name="price", lookup_expr='gte')
    price_max = django_filters.NumberFilter(field_name="price", lookup_expr='lte')
    category = django_filters.ModelChoiceFilter(queryset=Category.objects.all())
    is_available = django_filters.BooleanFilter(method='filter_is_available')
    
    class Meta:
        model = Product
        fields = ['name', 'category', 'price_min', 'price_max', 'is_available']
    
    def filter_is_available(self, queryset, name, value):
        if value:
            return queryset.filter(stock__gt=0)
        return queryset

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'created_at']
```

## Kiểm thử Endpoints API

### APITestCase Cơ bản
```python
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import MyModel

User = get_user_model()

class MyModelAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.mymodel = MyModel.objects.create(
            name='Test Object',
            owner=self.user
        )
    
    def test_list_mymodels(self):
        response = self.client.get('/api/mymodels/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_create_mymodel(self):
        data = {'name': 'New Object'}
        response = self.client.post('/api/mymodels/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(MyModel.objects.count(), 2)
    
    def test_retrieve_mymodel(self):
        response = self.client.get(f'/api/mymodels/{self.mymodel.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Object')
    
    def test_update_mymodel(self):
        data = {'name': 'Updated Object'}
        response = self.client.put(f'/api/mymodels/{self.mymodel.id}/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.mymodel.refresh_from_db()
        self.assertEqual(self.mymodel.name, 'Updated Object')
    
    def test_delete_mymodel(self):
        response = self.client.delete(f'/api/mymodels/{self.mymodel.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(MyModel.objects.count(), 0)
```

## Mẹo Tối ưu Hiệu suất

### Tối ưu Truy vấn
```python
# Trong ViewSet
def get_queryset(self):
    return MyModel.objects.select_related(
        'author',  # ForeignKey
        'category'  # Một ForeignKey khác
    ).prefetch_related(
        'tags',     # Nhiều-đến-nhiều
        'comments__author'  # Ngược ForeignKey với độ sâu
    )
```

### Chiến lược Lưu trữ Cache
```python
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

class MyModelViewSet(viewsets.ModelViewSet):
    @method_decorator(cache_page(60 * 5))  # Lưu trữ cache trong 5 phút
    def list(self, request):
        return super().list(request)
    
    def retrieve(self, request, pk=None):
        # Lưu trữ cache cho các đối tượng riêng lẻ
        cache_key = f'mymodel_{pk}'
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)
        
        response = super().retrieve(request, pk)
        cache.set(cache_key, response.data, 60 * 5)  # Lưu trữ cache trong 5 phút
        return response
```

## Danh sách kiểm tra Bảo mật

### Xác thực
- [ ] Sử dụng phương pháp xác thực thích hợp cho trường hợp sử dụng của bạn
- [ ] Triển khai logout/invalidation thích hợp cho xác thực dựa trên token
- [ ] Sử dụng HTTPS để bảo vệ token trong quá trình truyền
- [ ] Triển khai giới hạn tốc độ trên endpoints xác thực

### Ủy quyền
- [ ] Kiểm tra quyền trên tất cả các endpoints
- [ ] Triển khai permission mức đối tượng khi cần thiết
- [ ] Sử dụng hệ thống permission của Django hiệu quả
- [ ] Kiểm tra thường xuyên về việc cấp quyền

### Xác thực đầu vào
- [ ] Xác thực tất cả các đầu vào thông qua serializers
- [ ] Triển khai làm sạch cho các trường văn bản 자유
- [ ] Sử dụng thoát HTML khi trả về nội dung do người dùng tạo ra
- [ ] Xác thực tải lên file (loại, kích thước, nội dung)
- [ ] Triển khai quét virus cho file upload nếu xử lý file

### Bảo vệ Dữ liệu
- [ ] Không bao giờ hiển thị dữ liệu nhạy cảm trong phản hồi API
- [ ] Băm mật khẩu và không bao giờ trả về chúng
- [ ] Mã hóa dữ liệu nhạy cảm khi lưu trữ nếu bắt buộc
- [ ] Sử dụng biến môi trường cho secret
- [ ] Triển khai xử lý ngoại lệ thích hợp mà không rò rỉ stack traces

### Giới hạn Tốc độ
- [ ] Triển khai throttling để ngăn chặn lạm dụng
- [ ] Sử dụng mức suất khác nhau cho các loại endpoints khác nhau
- [ ] Xem xét dựa trên người dùng so với dựa trên IP cho throttling
- [ ] Giám sát và điều chỉnh mức suất dựa trên các mẫu sử dụng

### CORS và Tiêu đề Bảo mật
- [ ] Cấu hình CORS thích hợp nếu API được tiêu thụ bởi các domain khác nhau
- [ ] Triển khai tiêu đề bảo mật (HSTS, CSP, v.v.)
- [ ] Xem xét sử dụng gói django-secure hoặc tương tự
- [ ] Thường xuyên quét lỗ hổng bằng công cụ như bandit hoặc safety