# Kỹ năng Tạo Thành phần React

Kỹ năng này cung cấp hướng dẫn để tạo thành phần React theo các thực hành tốt nhất cho frontend CastraView.

## Khi nào nên sử dụng
Sử dụng kỹ năng này khi bạn cần tạo một thành phần React mới hoặc sửa đổi một thành phần hiện có trong thư mục CastraView/src.

## Các bước Thực hiện

### 1. Lập kế hoạch Thành phần
- [ ] Xác định thành phần nên làm gì và hiển thị gì
- [ ] Xác định các props cần thiết và 그들의 loại
- [ ] Lập kế hoạch về nhu cầu管理 state của thành phần
- [ ] Xem xét những sự kiện nào thành phần nên phát ra
- [ ] Fکر về khả năng tái sử dụng và tính composite
- [ ] Vาด cấu trúc thành phần nếu phức tạp

### 2. Tạo File Thành phần
- [ ] Tạo thành phần trong `CastraView/src/components/` hoặc thư mục con phù hợp
- [ ] Sử dụng PascalCase cho tên file thành phần (ví dụ: `MyComponent.jsx`)
- [ ] Chọn между `.jsx` và `.js` dựa trên quy ước dự án
- [ ] Đối với dự án TypeScript, sử dụng phần mở rộng `.tsx`
- [ ] Thêm chú thích ngắn gоля ở đầu mô tả mục đích của thành phần

### 3. Cấu trúc Thành phần
- [ ] Sử dụng thành phần chức năng với hooks (tránh thành phần lớp trừ khi duy trì mã héritage)
- [ ] Không cần `import React` (React 19 dùng automatic JSX runtime)
- [ ] Import bất kỳ hooks nào bạn sẽ sử dụng: `import { useState, useEffect } from 'react';`
- [ ] Import bất kỳ thư viện bên ngoài hoặc thành phần nào
- [ ] Import `cn` từ `@/lib/utils` và các component từ `@/components/ui/` nếu cần
- [ ] Xuất thành phần dưới dạng mặc định hoặc đặt tên dựa trên cách sử dụng

### 4. Định nghĩa Props
- [ ] Định nghĩa kiểu prop bằng PropTypes hoặc giao diện TypeScript
- [ ] Đánh dấu props bắt buộc là bắt buộc
- [ ] Cung cấp giá trị mặc định cho props tùy chọn bằng defaultProps hoặc tham số mặc định
- [ ] Sử dụng tên props có tính mô tả
- [ ] Xem xét sử dụng destructuring object trong tham số hàm
- [ ] Tài liệu mỗi prop được sử dụng để làm gì

### 5. Quản lý State
- [ ] Sử dụng `useState` cho state cục bộ của thành phần
- [ ] Sử dụng `useReducer` cho logic state phức tạp
- [ ] Xem xét nâng state lên khi nhiều thành phần cần chia sẻ state
- [ ] Sử dụng Context API hoặc thư viện quản lý state (Redux, Zustand, v.v.) để quản lý state toàn cục
- [ ] Tránh sao chép state có thể được rút ra từ props hoặc state khác
- [ ] Khởi tạo state với các giá trị mặc định thích hợp

### 6. Xử Lý Sự kiện
- [ ] Tạo hàm xử lý cho các tương tác của người dùng
- [ ] Sử dụng tên có tính mô tả cho hàm xử lý (ví dụ: `handleClick`, `handleSubmit`)
- [ ] Ràng buộc hàm xử lý sự kiện một cách thích hợp (mũi tên function trong JSX hoặc bind trong constructor)
- [ ] Ngăn chặn hành vi mặc định khi cần thiết bằng cách sử dụng `event.preventDefault()`
- [ ] Dừng lan truyền khi cần thiết bằng cách sử dụng `event.stopPropagation()`
- [ ] Truyền dữ liệu lên thành phần cha qua callback props

### 7. Logic Hiển thị
- [ ] Sử dụng render có điều kiện thích hợp (toán tử ternary, logic AND)
- [ ] Sử dụng `.map()` để render danh sách với key độc nhất
- [ ] Giữ JSX dễ đọc bằng cách rút ra logic phức tạp thành biến hoặc hàm
- [ ] Tránh biểu thức phức tạp trong JSX; di chuyển chúng thành biến ở trên câu lệnh return
- [ ] Sử dụng fragments (`<>...</>`) khi trả về nhiều phần tử mà không cần bao bọc
- [ ] Cân nhắc sử dụng SWR hoặc React Query để lấy dữ liệu

### 8. Hiệu ứng Phụ
- [ ] Sử dụng `useEffect` cho các hiệu ứng phụ (lấy dữ liệu, đăng ký, thao tác DOM)
- [ ] Đóng gói hiệu ứng đúng cách khi cần thiết (trả về hàm làm sạch)
- [ ] Chỉ định mảng phụ thuộc chính xác để tránh đóng cửa cũ hoặc vòng lặp vô hạn
- [ ] Sử dụng `useLayoutEffect` để đo đạc DOM đồng bộ khi cần
- [ ] Xem xét việc sử dụng hook tùy chỉnh cho logic hiệu ứng phụ có thể tái sử dụng

### 9. Phong cách (Styling)
- [ ] Dùng class Tailwind trong JSX; ưu tiên component shadcn trong `components/ui/`
- [ ] Thêm component nền bằng `npx shadcn@latest add <tên>`, không tự chép code
- [ ] Dùng `cva` cho biến thể và `cn()` để gộp class
- [ ] Màu/khoảng cách lấy từ token theme (`tokens.css`), không hard-code hex
- [ ] Không tạo file `.css` riêng, không dùng CSS modules/styled-components cho code mới
- [ ] Không dùng style inline cho giao diện phức tạp
- [ ] Đảm bảo responsive (`sm:`, `md:`, `lg:`)

### 10. Tối ưu Hiệu suất
- [ ] Sử dụng `React.memo` cho các thành phần render thường xuyên với cùng props
- [ ] Sử dụng `useMemo` cho các tính toán tốn kém
- [ ] Sử dụng `useCallback` cho các hàm được truyền dưới dạng props để các thành phần đã được ghi nhớ
- [ ] Xem xét chia mã với `React.lazy` và `Suspense` cho các thành phần lớn
- [ ] Tối ưu hình ảnh và tài nguyên
- [ ] Tránh rendering lại không cần thiết bằng cách kiểm tra lý do tại sao các thành phần đang được render lại

### 11. Truy cập (a11y)
- [ ] Sử dụng các phần tử HTML có ngữ nghĩa khi có thể
- [ ] Thêm các thuộc tính `aria-label`, `aria-labelledby`, v.v. thích hợp
- [ ] Đảm bảo khả năng điều hướng bằng bàn phím
- [ ] Quản lý tập trung thích hợp cho các hộp thoại modal
- [ ] Đảm bảo độ tương phản màu đủ
- [ ] Thêm liên kết bypass cho màn hình đọc khi thích hợp
- [ ] Kiểm tra với các trình đọc màn hình nếu có thể

### 12. Kiểm thử
- [ ] Tạo kiểm thử đơn vị bằng Jest và React Testing Library
- [ ] Kiểm tra thành phần render đúng với các props khác nhau
- [ ] Kiểm tra các tương tác của người dùng và các thay đổi state
- [ ] Kiểm tra các trường hợp đặc biệt và điều kiện lỗi
- [ ] Giả lập các cuộc gọi API và các phụ thuộc bên ngoài
- [ ] Mục tiêu đạt mức độ bao phủ kiểm thử có ý nghĩa, không chỉ là tỷ lệ dòng code

### 13. Tài liệu
- [ ] Thêm chú thích JSDoc cho các thành phần phức tạp
- [ ] Tài liệu các loại prop và các giá trị mà họ mong đợi
- [ ] Bao gồm ví dụ sử dụng nếu thành phần phức tạp hoặc có thể tái sử dụng
- [ ] Ghi chú bất kỳ cân nhắc hoặc hạn chế quan trọng nào

## Mẫu Thành phần

### Thành phần Trình bày (Presentational Component)
```jsx
import PropTypes from 'prop-types'
import { cn } from '@/lib/utils'
import { Button as UiButton } from '@/components/ui/button'

// Nút hành động chính của trang; bọc shadcn Button để thống nhất API trong dự án.
const ActionButton = ({ variant = 'default', size = 'default', className, children, onClick }) => (
  <UiButton variant={variant} size={size} className={cn('gap-2', className)} onClick={onClick}>
    {children}
  </UiButton>
)

ActionButton.propTypes = {
  variant: PropTypes.oneOf(['default', 'secondary', 'outline']),
  size: PropTypes.oneOf(['sm', 'default', 'lg']),
  className: PropTypes.string,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
}

export default ActionButton
```

### Thành phần chứa (Container Component) (Lấy dữ liệu)
```jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Spinner from './Spinner';
import ErrorMessage from './ErrorMessage';

const UserProfile = ({ userId }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}/`);
        if (!response.ok) throw new Error('Failed to fetch user');
        const data = await response.json();
        setUser(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!user) return <div>Người dùng không được chọn</div>;

  return (
    <div>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      {/* ... */}
    </div>
  );
};

UserProfile.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default UserProfile;
```

### Thành phần cấp cao hơn (Higher-Order Component - HOC)
```jsx
import React from 'react';

const withLoading = (WrappedComponent) => {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = { isLoading: false };
    }

    componentDidUpdate(prevProps) {
      // Triển khai logic tải dựa trên thay đổi prop
    }

    render() {
      const { isLoading } = this.state;
      if (isLoading) {
        return <div>Đang tải...</div>;
      }
      return <WrappedComponent {...this.props} />;
    }
  };
};

export default withLoading;
```

### Hook tùy chỉnh (Custom Hook)
```jsx
import { useState, useEffect } from 'react';

const useForm = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
    // Xóa lỗi cho trường này khi người dùng bắt đầu gõ
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const validate = () => {
    // Triển khai logic xác thực
    // Đặt trạng thái lỗi
    return Object.keys(errors).length === 0;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
  };

  return {
    values,
    errors,
    handleChange,
    validate,
    reset
  };
};

export default useForm;
```

## Cách tiếp cận Phong cách

CastraView dùng **Tailwind CSS v4 + shadcn/ui** (JavaScript, không TypeScript).

- Thêm component nền: `npx shadcn@latest add button` (sinh vào `src/components/ui/`).
- Component tự viết nằm ở `src/components/`, ghép từ các component trong `ui/`.
- Biến thể dùng `cva`; gộp class dùng `cn()` (`src/lib/utils.js`).
- Token màu nằm ở `src/styles/tokens.css` (biến theme của shadcn + `success`/`warning`/`info`/`violet`/`coral`), không hard-code màu.
- Không tạo file `.css` riêng cho từng component mới.

### Ví dụ biến thể bằng cva
```jsx
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex rounded-full px-2 py-0.5 text-xs font-medium', {
  variants: {
    tone: {
      success: 'bg-success/15 text-success',
      danger: 'bg-destructive/15 text-destructive',
    },
  },
  defaultVariants: { tone: 'success' },
})

export default function StatusBadge({ tone, className, children }) {
  return <span className={cn(badgeVariants({ tone }), className)}>{children}</span>
}
```

## Các cân nhắc Hiệu suất

### Tối ưu Gói (Bundle Optimization)
- Chỉ nhập những gì bạn cần từ các thư viện
- Sử dụng import động cho các thành phần không quan trọng
- Xem xét sử dụng `React.lazy` để tách mã
- Phân tích gói bằng các công cụ như Webpack Bundle Analyzer

### Tối ưu Hiển thị lại (Render Optimization)
- Sử dụng `React.memo` để ngăn các render lại không cần thiết
- Sử dụng `useCallback` cho các hàm được truyền dưới dạng props
- Sử dụng `useMemo` cho các tính toán tốn kiệm
- Tránh tạo các đối tượng/mảng mới trong render trừ khi cần thiết
- Sử dụng key ổn định và có thể dự đoán cho các danh sách

### Lấy dữ liệu (Data Fetching)
- Sử dụng React Query hoặc SWR để lấy dữ liệu và caching
- Triển khai chiến lược caching thích hợp
- Sử dụng phân trang và cuộn vô hạn cho các danh sách lớn
- Hủy bỏ các yêu cầu không cần thiết khi thành phần được huỷ

## Danh sách kiểm tra Truy cập

### HTML có Ngữ nghĩa
- Sử dụng `<button>` cho nút, không phải `<div>` hoặc `<span>`
- Sử dụng `<input>`, `<select>`, `<textarea>` cho các phần tử form
- Sử dụng phần tử `<label>` liên kết với các điều khiển form
- Sử dụng dấu hiệu ngữ nghĩa: `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`

### Điều hướng bằng Bàn phím
- Đảm bảo tất cả các phần tử tương tác đều có thể truy cập bằng bàn phím
- Sử dụng `tabindex` một cách thích hợp (tránh giá trị dương)
- Quản lý tập trung trong các menu dropdown và modal
- Cung cấp dấu hiệu tập중 nhìn thấy được

### Thuộc tính ARIA
- Sử dụng `aria-label` khi văn bản phần tử không đủ mô tả
- Sử dụng `aria-labelledby` hoặc `aria-describedby` cho các mối quan hệ phức tạp
- Sử dụng `aria-live` để cập nhật nội dung động
- Sử dụng `aria-expanded` cho các phần tử có thể thu gọn
- Sử dụng `aria-controls` để chỉ ra phần tử nào được kiểm soát

### Hỗ trợ Trình đọc Màn hình
- Kiểm tra với trình đọc màn hình (NVDA, VoiceOver, TalkBack)
- Đảm bảo tất cả hình ảnh có văn bản thay thế thích hợp
- Sử dụng `<svg>` có `<title>` và `<desc>` cho biểu tượng có thể truy cập
- Cung cấp bảnsôi cho nội dung âm thanh
- Đảm bảo độ tương phản màu đủ (WCAG 2.1 AA)

## Hướng dẫn Kiểm thử

### Kiểm thử Đơn vị với React Testing Library
```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

test('render button with correct text', () => {
  render(<Button>Click me</Button>);
  const button = screen.getByRole('button', { name: /click me/i });
  expect(button).toBeInTheDocument();
});

test('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  fireEvent.click(screen.getByRole('button', { name: /click me/i }));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Kiểm thử Hooks tùy chỉnh
```jsx
import { renderHook, act } from '@testing-library/react-hooks';
import useForm from './useForm';

test('useForm updates values on change', () => {
  const { result } = renderHook(() => useForm({ name: '' }));
  
  act(() => {
    result.current.handleChange({ target: { name: 'name', value: 'John' } });
  });
  
  expect(result.current.values.name).toBe('John');
});
```

## Quy ước Đặt tên

### Các tệp và Thư mục
- Sử dụng PascalCase cho các tệp thành phần: `MyComponent.jsx`
- Sử dụng kebab-case cho các tệp tiện ích: `utils/helpers.js`
- Nhóm các thành phần liên quan trong các thư mục
- Sử dụng index.js để xuất các thành phần khi thích hợp

### Tên Thành phần
- Sử dụng tên có tính mô tả cho biết thành phần làm gì
- Sử dụng tiền tố cho các loại thành phần: `Button`, `Modal`, `Form`, `Card`
- Tránh sử dụng tên chung chung như `Item`, `Data`, `Component`

### Prop và State
- Sử dụng camelCase cho tên prop và state
- Sử dụng tên có tính mô tả: `isLoading`, `userData`, `onSubmit`
- Sử dụng tiền tố `on` cho các trình xử lý sự kiện: `onClick`, `onChange`
- Sử dụng tiền tố `is` hoặc `has` cho các giá trị boolean: `isVisible`, `hasError`

### Lớp CSS (Tailwind)
- Dùng class tiện ích Tailwind trực tiếp trong JSX; không đặt tên lớp BEM mới
- Gộp class có điều kiện bằng `cn()` từ `@/lib/utils`
- Màu/khoảng cách lấy từ token theme (`bg-primary`, `text-muted-foreground`), không dùng giá trị hex tự do
- Lặp lại một nhóm class ở nhiều nơi thì tách thành component hoặc variant `cva`
