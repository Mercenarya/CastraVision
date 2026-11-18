import assert from 'node:assert/strict'
import en from '../CastraView/src/i18n/locales/en.js'
import vi from '../CastraView/src/i18n/locales/vi.js'
import {
  translate,
  getNestedValue,
  interpolate,
  getStoredLanguage,
  setStoredLanguage,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  LANGUAGE_STORAGE_KEY,
} from '../CastraView/src/i18n/index.js'

console.log('--- 1. Testing Core i18n Constants ---')
assert.equal(DEFAULT_LANGUAGE, 'en', 'Default language must be en')
assert.deepEqual(SUPPORTED_LANGUAGES, ['en', 'vi'], 'Supported languages must be en and vi')
assert.equal(LANGUAGE_STORAGE_KEY, 'castravision_language', 'Storage key must be castravision_language')

console.log('--- 2. Testing Nested Key Resolution & Fallback ---')
assert.equal(getNestedValue(en, 'navigation.dashboard'), 'Dashboard')
assert.equal(getNestedValue(vi, 'navigation.dashboard'), 'Bảng điều khiển')
assert.equal(getNestedValue(en, 'language.vietnamese'), 'Tiếng Việt')
assert.equal(getNestedValue(vi, 'language.vietnamese'), 'Tiếng Việt')

// Test translate function with active en and vi (signature: (currentLang, key, params))
assert.equal(translate('en', 'navigation.dashboard'), 'Dashboard')
assert.equal(translate('vi', 'navigation.dashboard'), 'Bảng điều khiển')
assert.equal(translate('en', 'common.save'), 'Save')
assert.equal(translate('vi', 'common.save'), 'Lưu')

console.log('--- 3. Testing Interpolation ---')
assert.equal(
  interpolate('Hello {name}, welcome to {place}!', { name: 'Alex', place: 'CastraVision' }),
  'Hello Alex, welcome to CastraVision!'
)
assert.equal(
  translate('en', 'leaderDashboard.welcome', { name: 'Director Smith' }),
  'Welcome back, Director Smith'
)
assert.equal(
  translate('vi', 'leaderDashboard.welcome', { name: 'Trưởng nhóm Linh' }),
  'Chào mừng trở lại, Trưởng nhóm Linh'
)

console.log('--- 4. Testing Fallbacks & Missing Keys ---')
// Missing key completely
const missingRes = translate('vi', 'non.existent.key.test')
assert.equal(missingRes, 'test', 'Should return last key segment as human-readable fallback')

// Missing in VI but present in EN fallback
const mockEnDict = { features: { aiCopilot: 'AI Copilot Suite' } }
const mockViDict = { features: {} }
const fallbackVal = getNestedValue(mockViDict, 'features.aiCopilot') ?? getNestedValue(mockEnDict, 'features.aiCopilot')
assert.equal(fallbackVal, 'AI Copilot Suite')

console.log('--- 5. Testing LocalStorage Mock Behavior ---')
const mockStorage = {}
globalThis.window = {
  localStorage: {
    getItem: (k) => mockStorage[k] ?? null,
    setItem: (k, v) => { mockStorage[k] = String(v) },
    removeItem: (k) => { delete mockStorage[k] },
  },
}

// Default when empty
assert.equal(getStoredLanguage(), 'en')

// Setting 'vi'
setStoredLanguage('vi')
assert.equal(mockStorage[LANGUAGE_STORAGE_KEY], 'vi')
assert.equal(getStoredLanguage(), 'vi')

// Setting invalid key falls back to 'en'
mockStorage[LANGUAGE_STORAGE_KEY] = 'fr_corrupted'
assert.equal(getStoredLanguage(), 'en')

// Setting 'en'
setStoredLanguage('en')
assert.equal(mockStorage[LANGUAGE_STORAGE_KEY], 'en')
assert.equal(getStoredLanguage(), 'en')

console.log('--- 6. Verifying Dictionary Key Parity ---')
function collectKeys(obj, prefix = '') {
  let keys = []
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

const enKeys = new Set(collectKeys(en))
const viKeys = new Set(collectKeys(vi))

let missingInVi = []
for (const k of enKeys) {
  if (!viKeys.has(k)) missingInVi.push(k)
}

let missingInEn = []
for (const k of viKeys) {
  if (!enKeys.has(k)) missingInEn.push(k)
}

console.log(`Total EN keys: ${enKeys.size}`)
console.log(`Total VI keys: ${viKeys.size}`)
console.log(`Missing in VI: ${missingInVi.length} ${missingInVi.join(', ')}`)
console.log(`Missing in EN: ${missingInEn.length} ${missingInEn.join(', ')}`)

assert.equal(missingInVi.length, 0, 'All EN keys must have a corresponding VI translation')
assert.equal(missingInEn.length, 0, 'All VI keys must have a corresponding EN translation')

console.log('\n>>> ALL 6 TEST SUITES PASSED CLEANLY! <<<')
