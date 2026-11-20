export function companySlug(name) {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 63).replace(/-$/, '')
}

export function validateCompany(data, existing = []) {
  const error = (id, message) => ({ id, type: 'error', title: 'Thông tin chưa hợp lệ', message, tag: 'REJECTED' })
  if (!data.name.trim() || data.name.trim().length > 120) return error('invalid-name', 'Tên doanh nghiệp cần từ 1 đến 120 ký tự.')
  const email = data.accountEmail.trim().toLowerCase()
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error('invalid-email', 'Nhập email Marketing Manager hợp lệ; có thể dùng Gmail.')
  const slug = data.slug.trim().toLowerCase()
  if (slug.length > 63 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return error('invalid-slug', 'Slug cần 1–63 ký tự chữ thường, số và dấu gạch ngang.')
  if (existing.some(item => String(item.slug || item.tenantId || '').trim().toLowerCase().replace(/^tenant_/, '') === slug)) return error('duplicate-tenant', 'Slug đã tồn tại. Chọn slug khác để tiếp tục.')
  if ((data.domain || '').trim().length > 253 || (data.notes || '').length > 2000) return error('invalid-details', 'Domain tối đa 253 ký tự; ghi chú tối đa 2.000 ký tự.')
  return null
}
