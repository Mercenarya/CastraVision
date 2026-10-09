# Django Model Creation Skill

This skill provides guidance for creating Django models following best practices for the CastraVision project.

## When to Use
Use this skill when you need to create a new Django model or modify an existing one in the CastraServices app.

## Steps to Follow

### 1. Planning the Model
- [ ] Identify the entity this model represents
- [ ] List all required fields and their types
- [ ] Determine relationships with other models
- [ ] Consider what database indexes might be needed
- [ ] Plan for any custom methods or properties

### 2. Creating the Model File
- [ ] Create the model in `CastraServices/models.py`
- [ ] Add proper imports at the top of the file
- [ ] Follow the naming convention: CamelCase for model names
- [ ] Add a descriptive docstring explaining the model's purpose

### 3. Defining Fields
For each field:
- [ ] Choose the appropriate field type (CharField, IntegerField, etc.)
- [ ] Set `null=True` only if the field can truly be NULL in the database
- [ ] Set `blank=True` only if the field can be empty in forms
- [ ] Provide descriptive `verbose_name` and `help_text` when needed
- [ ] Use `choices` parameter for fields with limited options
- [ ] Consider using `default` values where appropriate
- [ ] Add `db_index=True` for fields that will be frequently queried
- [ ] Use `unique=True` for fields that must be unique

### 4. Setting Up Relationships
- [ ] Use `ForeignKey` for many-to-one relationships
- [ ] Use `ManyToManyField` for many-to-many relationships
- [ ] Use `OneToOneField` for one-to-one relationships
- [ ] Always specify `related_name` to avoid reverse accessor conflicts
- [ ] Consider using `on_delete=models.CASCADE` or other appropriate options
- [ ] Use `limit_choices_to` to restrict choices in admin/forms when needed

### 5. Adding Model Methods
- [ ] Always implement `__str__()` method returning a human-readable representation
- [ ] Implement `get_absolute_url()` if the model has a detail view
- [ ] Add custom methods for common operations
- [ ] Use `@property` decorator for computed attributes
- [ ] Consider adding model managers for complex queries

### 6. Model Meta Options
- [ ] Set `app_label` if needed (usually not required)
- [ ] Use `ordering` to define default ordering
- [ ] Set `verbose_name` and `verbose_name_plural` for admin interface
- [ ] Use `unique_together` or `constraints` for multi-field uniqueness
- [ ] Add `indexes` for custom database indexes
- [ ] Consider `get_latest_by` if applicable

### 7. Initial Migration
- [ ] Run `python manage.py makemigrations CastraServices`
- [ ] Review the generated migration file
- [ ] Run `python manage.py migrate` to apply the migration
- [ ] Check for any migration warnings or errors

### 8. Admin Registration
- [ ] Register the model in `CastraServices/admin.py`
- [ ] Use `@admin.register` decorator or `admin.site.register`
- [ ] Configure `list_display`, `list_filter`, `search_fields` as appropriate
- [ ] Add `readonly_fields` for fields that should not be edited
- [ ] Consider using `inlines` for related models

### 9. Testing
- [ ] Create unit tests for the model in `CastraServices/tests.py`
- [ ] Test model creation, validation, and methods
- [ ] Test any custom managers or querysets
- [ ] Test admin interface if customized

### 10. Documentation
- [ ] Update any relevant documentation
- [ ] Add comments to explain complex logic
- [ ] Ensure the model docstring is up to date

## Field Type Guidelines

### Text Fields
- `CharField`: For short strings (set max_length appropriately)
- `TextField`: For long text content
- `SlugField`: For URL-friendly strings (often unique)
- `URLField`: For storing URLs with validation

### Number Fields
- `IntegerField`: For whole numbers
- `PositiveIntegerField`: For non-negative whole numbers
- `SmallIntegerField`: For small range integers
- `BigIntegerField`: For very large integers
- `FloatField`: For floating point numbers
- `DecimalField`: For precise decimal numbers (use for money)

### Date/Time Fields
- `DateField`: For dates only
- `TimeField`: For times only
- `DateTimeField`: For both date and time
- Use `auto_now_add` and `auto_now` appropriately

### Relationship Fields
- `ForeignKey`: Many-to-one (most common)
- `ManyToManyField`: Many-to-many
- `OneToOneField`: One-to-one

### Special Fields
- `EmailField`: For email addresses with validation
- `FileField`/`ImageField`: For file uploads
- `BooleanField`: For true/false values
- `JSONField`: For storing JSON data (PostgreSQL)

## Common Patterns

### Timestamp Models
```python
class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
```

### Soft Delete Pattern
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

### Model with Status
```python
class StatusModel(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
```

## Validation Guidelines
- Use field-level validators when appropriate
- Implement `clean()` method for cross-field validation
- Use `clean_<fieldname>()` methods for field-specific validation
- Raise `ValidationError` with descriptive messages

## Performance Considerations
- Consider database indexes for frequently queried fields
- Use `select_related()` and `prefetch_related()` in queries
- Denormalize cautiously and only when necessary
- Consider caching for expensive computations

## Security Considerations
- Validate all user input
- Use Django's built-in protection against common vulnerabilities
- Be careful with file uploads (validate file types, scan for malware)
- Never trust client-side validation alone