import { expect, it } from 'vitest'
import { validateCompany, companySlug } from './companyValidation'

const company = { name: 'Công ty mới', accountEmail: 'operator@gmail.com', slug: 'cong-ty-moi', domain: 'example.test' }
it('allows Gmail and a shared domain or manager email with a different unique slug', () => {
  expect(validateCompany(company, [{ ...company, slug: 'other' }])).toBeNull()
})
it('rejects an existing normalized slug before submitting', () => {
  expect(validateCompany({ ...company, slug: ' TAKEN ' }, [{ tenantId: 'tenant_taken' }])).toMatchObject({ id: 'duplicate-tenant' })
})
it('rejects malformed email and invalid slug', () => {
  expect(validateCompany({ ...company, accountEmail: 'one@@example.test' })).toMatchObject({ id: 'invalid-email' })
  expect(validateCompany({ ...company, slug: 'invalid / path' })).toMatchObject({ id: 'invalid-slug' })
})
it('generates a usable slug from a Vietnamese business name', () => {
  expect(companySlug('  Điện Máy Đà Nẵng ')).toBe('dien-may-da-nang')
})
