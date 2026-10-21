# API Development Skill for CastraVision

This skill provides guidance for developing RESTful APIs following best practices for the CastraVision project, primarily using Django REST Framework (DRF).

## When to Use
Use this skill when you need to create new API endpoints, modify existing ones, or design API contracts for the CastraVision backend.

## Steps to Follow

### 1. API Design Planning
- [ ] Identify the resource(s) this API will expose
- [ ] Determine the required HTTP methods (GET, POST, PUT, PATCH, DELETE)
- [ ] Plan the API endpoints following REST conventions
- [ ] Define the request/response schemas
- [ ] Consider authentication and authorization requirements
- [ ] Plan for filtering, sorting, and pagination needs
- [ ] Think about versioning strategy if needed

### 2. Setting Up DRF (if not already configured)
- [ ] Ensure `rest_framework` is in `INSTALLED_APPS`
- [ ] Configure default authentication classes in settings
- [ ] Configure default permission classes
- [ ] Set up pagination defaults
- [ ] Configure throttling if needed
- [ ] Set up parser and renderer classes

### 3. Creating Serializers
- [ ] Create serializer in `CastraServices/serializers.py` or app-specific serializers file
- [ ] Import necessary modules: `from rest_framework import serializers`
- [ ] Choose appropriate serializer type:
  - `ModelSerializer` for model-based APIs (most common)
  - `Serializer` for custom/apagregate data
  - `ListSerializer` for lists of objects
- [ ] Explicitly list fields rather than using `'__all__'` for security
- [ ] Add validation methods for complex validations
- [ ] Use `SerializerMethodField` for computed fields
- [ ] Use nested serializers for relationships when appropriate
- [ ] Use `PrimaryKeyRelatedField` or `SlugRelatedField` for simple relationships
- [ ] Add `read_only_fields` for fields that shouldn't be modified via API
- [ ] Consider using `extra_kwargs` for field-level options

### 4. Creating Views/ViewSets
- [ ] Create views in `CastraServices/views.py` or app-specific views file
- [ ] Choose appropriate view type:
  - `APIView` for custom/low-level control
  - `GenericAPIView` for common patterns
  - `ModelViewSet` for full CRUD operations (most common)
  - `ReadOnlyModelViewSet` for read-only endpoints
- [ ] Set `queryset` attribute or override `get_queryset()`
- [ ] Set `serializer_class` attribute
- [ ] Configure permission classes (`permission_classes`)
- [ ] Configure authentication classes (`authentication_classes`)
- [ ] Implement custom methods for special actions (`@action` decorator)
- [ ] Override `perform_create`, `perform_update`, `perform_destroy` when needed
- [ ] Consider using mixins for custom combinations of behavior

### 5. URL Configuration
- [ ] Register viewsets with router in `CastraServices/urls.py` or app urls
- [ ] Use `DefaultRouter` or `SimpleRouter` from DRF
- [ ] Manually define URLs for custom views if needed
- [ ] Include app URLs in project's main `urls.py`
- [ ] Consider API versioning in URLs (`/api/v1/`, `/api/v2/`)
- [ ] Use meaningful URL names for reverse lookups

### 6. Authentication and Authorization
- [ ] Choose appropriate authentication method:
  - `TokenAuthentication` for simple token-based auth
  - `SessionAuthentication` for web clients
  - `JWTAuthentication` (requires external package) for stateless auth
  - Custom authentication for special requirements
- [ ] Set permission classes appropriately:
  - `IsAuthenticated` for authenticated-only access
  - `IsAdminUser` for admin-only access
  - `IsAuthenticatedOrReadOnly` for public read, auth required for write
  - Custom permissions for business logic
- [ ] Implement object-level permissions when needed
- [ ] Use Django's permission system or create custom permission classes

### 7. Validation and Error Handling
- [ ] Use serializer validation for input data
- [ ] Implement `validate()` method for cross-field validation
- [ ] Implement `validate_<fieldname>()` for field-specific validation
- [ ] Raise `serializers.ValidationError` with descriptive messages
- [ ] Handle exceptions globally or per-view as needed
- [ ] Return appropriate HTTP status codes:
  - 200 OK for successful GET/PUT/PATCH
  - 201 Created for successful POST
  - 204 No Content for successful DELETE
  - 400 Bad Request for validation errors
  - 401 Unauthorized for authentication failures
  - 403 Forbidden for authorization failures
  - 404 Not Found for missing resources
  - 405 Method Not Allowed for unsupported methods
  - 429 Too Many Requests for rate limiting
  - 500 Internal Server Error for server errors

### 8. Pagination, Filtering, and Sorting
- [ ] Configure pagination:
  - `PageNumberPagination` (default)
  - `LimitOffsetPagination`
  - `CursorPagination` for large datasets
- [ ] Set page size appropriately
- [ ] Allow clients to override page size within limits
- [ ] Implement filtering:
  - Use `DjangoFilterBackend` for exact matches
  - Use `SearchFilter` for text search
  - Use `OrderingFilter` for sorting
  - Consider `django-filter` for complex filtering
- [ ] Document available filter parameters

### 9. API Documentation
- [ ] Use DRF's built-in documentation or integrate with:
  - `drf-yasg` (Yet Another Swagger Generator)
  - `drf-spectacular` (modern alternative)
  - CoreAPI documentation
- [ ] Ensure all endpoints are documented
- [ ] Document request/response schemas
- [ ] Document authentication requirements
- [ ] Document rate limiting if applicable
- [ ] Keep documentation up to date with code changes

### 10. Testing
- [ ] Create API tests in `CastraServices/tests.py` or test file
- [ ] Use `APIClient` or `APITestCase` from DRF
- [ ] Test authentication and authorization
- [ ] Test all CRUD operations
- [ ] Test validation and error responses
- [ ] Test filtering, sorting, and pagination
- [ ] Test edge cases and boundary conditions
- [ ] Test performance with large datasets if applicable
- [ ] Use factories (like `factory_boy`) for test data

### 11. Performance Considerations
- [ ] Use `select_related()` and `prefetch_related()` in querysets
- [ ] Add database indexes for frequently queried fields
- [ ] Consider caching for expensive operations
- [ ] Implement pagination to avoid large responses
- [ ] Use streaming responses for large file downloads
- [ ] Consider using `django-elasticsearch-dsl` for search-heavy APIs
- [ ] Monitor API performance and optimize slow endpoints

### 12. Security Considerations
- [ ] Implement rate limiting/throttling to prevent abuse
- [ ] Use HTTPS in production
- [ ] Validate and sanitize all inputs
- [ ] Protect against common vulnerabilities:
  - SQL Injection (ORM protects, but be careful with raw queries)
  - XSS (DRF provides protection, but be careful with custom templates)
  - CSRF (DRF has appropriate handling for different auth methods)
  - Information exposure (don't leak sensitive data in errors)
- [ ] Implement proper CORS policies if needed
- [ ] Consider using HTTPS only for sensitive endpoints
- [ ] Validate file uploads for type and size
- [ ] Implement input length limits to prevent DoS

### 13. Versioning Strategy
- [ ] Choose versioning method:
  - URL versioning (`/api/v1/resource/`)
  - Header versioning (`Accept: application/vnd.myapi.v1+json`)
  - Query parameter versioning (`?version=1.0`)
- [ ] Document deprecation policy
- [ ] Plan for backward compatibility
- [ ] Consider using DRF's versioning schemes

## Serializer Guidelines

### ModelSerializer Best Practices
```python
from rest_framework import serializers
from .models import MyModel

class MyModelSerializer(serializers.ModelSerializer):
    # Explicitly list fields for security and clarity
    class Meta:
        model = MyModel
        fields = ['id', 'name', 'email', 'created_at', 'is_active']
        read_only_fields = ['id', 'created_at']  # Fields clients can't modify
    
    # Field-level validation
    def validate_email(self, value):
        if not value.endswith('@example.com'):
            raise serializers.ValidationError("Email must be from example.com domain")
        return value
    
    # Cross-field validation
    def validate(self, attrs):
        if attrs.get('is_active') and not attrs.get('email'):
            raise serializers.ValidationError({
                'email': 'Email is required when account is active'
            })
        return attrs
    
    # Computed fields
    def get_display_name(self, obj):
        return f"{obj.name} ({obj.email})"
    
    # Override create/update if needed
    def create(self, validated_data):
        # Custom create logic
        return super().create(validated_data)
```

### Handling Relationships
```python
# Option 1: Primary key (simple and efficient)
class AuthorSerializer(serializers.ModelSerializer):
    books = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Book.objects.all()
    )
    
    class Meta:
        model = Author
        fields = ['id', 'name', 'books']

# Option 2: Nested serialization (more detailed but heavier)
class AuthorSerializer(serializers.ModelSerializer):
    books = BookSerializer(many=True, read_only=True)
    
    class Meta:
        model = Author
        fields = ['id', 'name', 'books']

# Option 3: Hyperlinked relationships (RESTful)
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

## ViewSet Patterns

### Basic ModelViewSet
```python
from rest_framework import viewsets, permissions
from .models import MyModel
from .serializers import MyModelSerializer

class MyModelViewSet(viewsets.ModelViewSet):
    queryset = MyModel.objects.all()
    serializer_class = MyModelSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # Override get_queryset for filtering based on user
    def get_queryset(self):
        queryset = MyModel.objects.all()
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(owner=self.request.user)
    
    # Custom action
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        instance = self.get_object()
        instance.is_active = True
        instance.save()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
```

### ReadOnly ViewSet
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

## Pagination Examples

### Custom PageNumberPagination
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

### CursorPagination for Infinite Scroll
```python
from rest_framework.pagination import CursorPagination

class ProductCursorPagination(CursorPagination):
    page_size = 10
    ordering = '-created_at'
    cursor_query_param = 'cursor'
```

## Filtering Examples

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

## Testing API Endpoints

### Basic APITestCase
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

## Performance Optimization Tips

### Query Optimization
```python
# In ViewSet
def get_queryset(self):
    return MyModel.objects.select_related(
        'author',  # ForeignKey
        'category'  # Another ForeignKey
    ).prefetch_related(
        'tags',     # ManyToMany
        'comments__author'  # Reverse ForeignKey with depth
    )
```

### Caching Strategies
```python
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page

class MyModelViewSet(viewsets.ModelViewSet):
    @method_decorator(cache_page(60 * 5))  # Cache for 5 minutes
    def list(self, request):
        return super().list(request)
    
    def retrieve(self, request, pk=None):
        # Cache individual objects
        cache_key = f'mymodel_{pk}'
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)
        
        response = super().retrieve(request, pk)
        cache.set(cache_key, response.data, 60 * 5)  # Cache for 5 minutes
        return response
```

## Security Checklist

### Authentication
- [ ] Use appropriate authentication method for your use case
- [ ] Implement proper logout/invalidation for token-based auth
- [ ] Use HTTPS to protect tokens in transit
- [ ] Implement rate limiting on auth endpoints

### Authorization
- [ ] Check permissions on all endpoints
- [ ] Implement object-level permissions when needed
- [ ] Use Django's permission system effectively
- [ ] Regularly audit permission assignments

### Input Validation
- [ ] Validate all inputs through serializers
- [ ] Implement sanitization for free-text fields
- [ ] Use HTML escaping when returning user-generated content
- [ ] Validate file uploads (type, size, content)
- [ ] Implement upload virus scanning if handling files

### Data Protection
- [ ] Never expose sensitive data in API responses
- [ ] Hash passwords and never return them
- [ ] Encrypt sensitive data at rest if required
- [ ] Use environment variables for secrets
- [ ] Implement proper error handling that doesn't leak stack traces

### Rate Limiting
- [ ] Implement throttling to prevent abuse
- [ ] Use different rates for different endpoint types
- [ ] Consider user-based vs IP-based throttling
- [ ] Monitor and adjust rates based on usage patterns

### CORS and Security Headers
- [ ] Configure CORS properly if API is consumed by different domains
- [ ] Implement security headers (HSTS, CSP, etc.)
- [ ] Consider using django-secure or similar package
- [ ] Regularly scan for vulnerabilities with tools like bandit or safety