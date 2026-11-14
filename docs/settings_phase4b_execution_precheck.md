# Báo cáo Kiểm tra Môi trường Thực thi (Phase 4B Pre-check)
## Execution Environment Pre-check Report

> **Loại tài liệu**: Kiểm định môi trường thực thi chỉ đọc (Read-Only Runtime Pre-check).  
> **Mục tiêu**: Thẩm định đường dẫn import của Supabase Client, cơ chế chia sẻ phiên xác thực (Session Sharing), cấu trúc dữ liệu trả về từ RPC, kiểm tra kết nối dự án và xây dựng đoạn mã thực thi an toàn nhất để chuẩn bị khởi tạo Workspace trên trình duyệt mà không để lộ token.

---

## 1. Kết quả Khảo sát Môi trường Frontend Runtime

### 1.1. Đường dẫn Import và Tên Biến Xuất khẩu (Import Path & Export Name)
Kiểm tra tệp nguồn [CastraView/src/lib/supabase.js](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/src/lib/supabase.js):

- **Đường dẫn tệp thực tế**: `/src/lib/supabase.js` (hoặc alias `@/lib/supabase.js`).
- **Tên biến xuất khẩu**:
  - `export const supabase`: Đối tượng Supabase Client (bản ghi singleton).
  - `export function requireSupabase()`: Hàm tiện ích kiểm tra cấu hình và trả về client.
  - `export const supabaseConfigurationError`: Chuỗi thông báo lỗi nếu thiếu biến môi trường.
- **Biến toàn cục `window.__SUPABASE_CLIENT__`**:
  - **Xác nhận**: Hiện tại trong mã nguồn ứng dụng **CHƯA ĐƯỢC GẮN** vào đối tượng `window`.
  - Khuyến nghị: Không gọi qua `window.__SUPABASE_CLIENT__`, mà sử dụng lệnh `dynamic import` chuẩn ESM của trình duyệt.

### 1.2. Khả năng Thực thi trên Developer Console của Trình duyệt
- **Xác nhận**: Môi trường phát triển Vite (`npm run dev`) đang chạy tại cổng dev server (`http://localhost:5173`).
- Trình duyệt hỗ trợ đầy đủ cú pháp dynamic import ESM trên Console:
  ```javascript
  const { supabase } = await import('/src/lib/supabase.js');
  ```
- Lệnh import này nạp trực tiếp module ESM từ Vite dev server một cách tự nhiên và an toàn.

### 1.3. Tính Chia sẻ Phiên Đăng nhập (Session Sharing)
- Tại `CastraView/src/lib/supabase.js` (dòng 23–29):
  ```javascript
  export const supabase = supabaseConfigurationError
    ? null
    : createClient(url, publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
  ```
- **Cơ chế lưu trữ**: `@supabase/supabase-js` lưu trữ phiên đăng nhập vào `window.localStorage` theo key `sb-<project-ref>-auth-token`.
- **Đánh giá**:
  - Cả ứng dụng React và lệnh dynamic import trên Console đều sử dụng chung module cached singleton `supabase`.
  - Khi người dùng đăng nhập tài khoản `grfdonk@gmail.com` qua giao diện UI của ứng dụng, token xác thực được lưu vào `localStorage`.
  - Khi Console import `supabase`, client ngay lập tức nạp và sở hữu đúng phiên đăng nhập đó với đầy đủ quyền `auth.uid() = ad47c5c2-48df-4cd3-ba58-c9cc672ca960`.

---

## 2. Kiểm tra Đồng bộ Dự án Supabase (Project Alignment)

Kiểm tra cấu hình tại [CastraView/vite.config.js](file:///d:/essclip/CAPSTONE2APP/CastraVision/CastraView/vite.config.js) (dòng 10–26):
```javascript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, ['VITE_', 'SUPABASE_'])
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || ''
  const supabaseKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_KEY ||
    ''

  return {
    envDir: projectRoot,
    envPrefix: ['VITE_', 'SUPABASE_'],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(supabaseKey),
    },
```
- **Xác nhận**: Vite dev server đọc trực tiếp tệp `.env` tại thư mục gốc của repository (`projectRoot`).
- Môi trường frontend trình duyệt và các script backend/kiểm thử đều sử dụng chung một dự án Supabase, bảo đảm tài khoản `grfdonk@gmail.com` đăng nhập trên giao diện hoàn toàn thuộc cùng cơ sở dữ liệu với các tài khoản `tranthanhtri2@gmail.com` và `Bengin2@gmail.com`.

---

## 3. Cấu trúc Trả về Chính xác của RPC (Output Shape of RPC)

### 3.1. Định nghĩa SQL tại Cơ sở Dữ liệu
Tại `supabase/migrations/20261013041250_rls_helpers_and_onboarding_rpc.sql` (dòng 58–59, 120–121):
```sql
create or replace function public.create_workspace_with_admin(workspace_name text)
returns table (workspace_id uuid, role public.workspace_role)
...
  return query
  select created_workspace_id, 'admin'::public.workspace_role;
end;
$$;
```

### 3.2. Cấu trúc dữ liệu trên Supabase Client (`rpcResult`)
Do hàm SQL trả về kiểu `TABLE`, PostgREST chuyển đổi kết quả thành một **Mảng JSON chứa các đối tượng**:

```javascript
{
  data: [
    {
      workspace_id: "00000000-0000-0000-0000-000000000000", // Chuỗi UUID của Workspace mới
      role: "admin"                                         // Vai trò khởi tạo của người gọi
    }
  ],
  error: null
}
```

- **Cách truy xuất Workspace ID an toàn**:
  ```javascript
  const newWorkspaceId = rpcResult.data?.[0]?.workspace_id;
  ```
  *(Khớp hoàn toàn với cách xử lý tại `CastraView/src/lib/workspace.js:94`: `data?.[0]?.workspace_id`).*

---

## 4. Phương pháp Trích xuất Định danh An toàn (Token Leak Prevention)

> **CẢNH BÁO BẢO MẬT**: Không bao giờ thực thi `console.log(await supabase.auth.getSession())` hoặc in toàn bộ đối tượng `session` ra Console, vì đối tượng đó chứa `access_token` và `refresh_token`.

### Cách trích xuất an toàn (Chỉ lấy User ID và Email):
Sử dụng hàm `supabase.auth.getUser()` hoặc destructure chỉ lấy các thuộc tính không nhạy cảm:

```javascript
// Phương pháp an toàn 1: Qua API getUser() (Không chứa access_token/refresh_token)
const { data: { user } } = await supabase.auth.getUser();
console.log('ID người dùng:', user?.id, '| Email:', user?.email);

// Phương pháp an toàn 2: Destructure có chọn lọc từ getSession()
const { data: { session } } = await supabase.auth.getSession();
const safeIdentity = {
  id: session?.user?.id,
  email: session?.user?.email
};
console.log('Xác thực danh tính:', safeIdentity);
```

---

## 5. Quy trình và Đoạn mã Thực thi Khuyến nghị (Recommended Safe Execution Snippet)

Dưới đây là kịch bản hoàn chỉnh, an toàn, có bẫy lỗi và kiểm tra nghiêm ngặt danh tính trước khi gọi RPC. Kịch bản này được thiết kế để chạy trực tiếp trên Developer Console của trình duyệt khi đã đăng nhập tài khoản `grfdonk@gmail.com`.

```javascript
(async () => {
  console.log('=== BẮT ĐẦU QUY TRÌNH THIẾT LẬP WORKSPACE KIỂM THỬ ===');

  // 1. Dynamic import client Supabase từ Vite dev server
  const { supabase } = await import('/src/lib/supabase.js');
  if (!supabase) {
    throw new Error('Không thể kết nối Supabase Client. Kiểm tra cấu hình môi trường.');
  }

  // 2. Kiểm tra danh tính phiên đăng nhập hiện tại (Bảo vệ không in token)
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Chưa đăng nhập! Vui lòng đăng nhập với grfdonk@gmail.com trước khi chạy.');
  }

  const expectedAdminId = 'ad47c5c2-48df-4cd3-ba58-c9cc672ca960';
  if (user.id !== expectedAdminId) {
    throw new Error(`Phiên hiện tại (${user.email}) không phải là tài khoản grfdonk@gmail.com (${expectedAdminId}). Hủy thao tác.`);
  }
  console.log('✓ Xác thực phiên chính xác:', user.email, `(${user.id})`);

  // 3. Gọi RPC chính thức tạo Workspace
  console.log('Đang gọi RPC create_workspace_with_admin...');
  const { data: rpcData, error: rpcError } = await supabase.rpc('create_workspace_with_admin', {
    workspace_name: 'CastraVision Test Workspace'
  });

  if (rpcError) {
    console.error('Lỗi khởi tạo Workspace:', rpcError);
    throw rpcError;
  }

  const workspaceId = rpcData?.[0]?.workspace_id;
  if (!workspaceId) {
    throw new Error('RPC thành công nhưng không trả về workspace_id hợp lệ.');
  }
  console.log('✓ Khởi tạo Workspace thành công! ID:', workspaceId);

  // 4. Thêm Leader và Employee với tư cách Workspace Admin (Chính sách RLS: workspace_members_admin_insert)
  console.log('Đang thêm thành viên Leader và Employee...');
  const membersToInsert = [
    {
      workspace_id: workspaceId,
      user_id: '3fd5254e-7caa-4178-a1f9-77d729c28945', // tranthanhtri2@gmail.com
      role: 'manager',
      invited_email: 'tranthanhtri2@gmail.com'
    },
    {
      workspace_id: workspaceId,
      user_id: 'b4a9c8a3-59e6-477c-bf68-59fbc4326eb1', // Bengin2@gmail.com
      role: 'member',
      invited_email: 'Bengin2@gmail.com'
    }
  ];

  const { data: insertedMembers, error: insertError } = await supabase
    .from('workspace_members')
    .insert(membersToInsert)
    .select('workspace_id, user_id, role, invited_email');

  if (insertError) {
    console.error('Lỗi khi thêm thành viên:', insertError);
    throw insertError;
  }
  console.log('✓ Đã thêm thành công các thành viên:', insertedMembers);

  // 5. Đọc lại dữ liệu để xác minh danh sách thành viên (Verification Read-back)
  const { data: roster, error: rosterError } = await supabase
    .from('workspace_members')
    .select('workspace_id, user_id, role, invited_email, workspaces(id, name)')
    .eq('workspace_id', workspaceId);

  if (rosterError) {
    console.error('Lỗi xác minh danh sách:', rosterError);
    throw rosterError;
  }

  console.log('=== KẾT QUẢ THIẾT LẬP WORKSPACE HOÀN TẤT ===');
  console.table(roster.map(m => ({
    Workspace: m.workspaces?.name,
    WorkspaceID: m.workspace_id,
    UserID: m.user_id,
    Role: m.role,
    Email: m.invited_email || user.email
  })));

  return { workspaceId, roster };
})();
```

---

## 6. Kết luận (Conclusion)

- **Đường dẫn Client**: `/src/lib/supabase.js` xuất khẩu `supabase`.
- **Hỗ trợ Console**: Có (Vite dev server hỗ trợ dynamic import ESM trực tiếp).
- **Chia sẻ phiên**: Có (Dùng chung bộ nhớ `localStorage` với giao diện ứng dụng).
- **Cấu trúc trả về RPC**: Mảng 1 phần tử `[{ workspace_id: '<uuid>', role: 'admin' }]`.
- **Bảo mật**: Kịch bản thực thi hoàn toàn qua phiên xác thực của `grfdonk@gmail.com`, tuân thủ 100% chính sách RLS, không để lộ token, không dùng superuser.

Hệ thống đã sẵn sàng cho bước cấp phát (Provisioning) khi có lệnh thực hiện.
