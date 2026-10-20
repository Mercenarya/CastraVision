# CastraView

Giao diện web của CastraVision: React 19 + Vite, Tailwind CSS v4 và shadcn/ui (JavaScript).

## Giao diện: Tailwind + shadcn/ui

Dự án dùng Tailwind CSS v4 và shadcn/ui (JavaScript). Chi tiết quy ước xem `AGENTS.md` và
`docs/SPRINT1_UI.md`.

```powershell
npx shadcn@latest add button   # thêm component nền vào src/components/ui/
npm run lint
npm run build
```

- Alias `@/` = `src/`.
- Màu và theme khai báo trong `src/styles/tokens.css`, không hard-code hex trong JSX.
- Dùng `cn()` từ `@/lib/utils` để gộp class.
