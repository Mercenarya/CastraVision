import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Globe, ChevronRight, Check } from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'

/**
 * LanguageDropdownSubmenu
 * Submenu item for selecting application language (EN/VI) inside avatar dropdown menus.
 * Conforms to CastraVision's design system with high-contrast active indicator.
 */
export function LanguageDropdownSubmenu({ onLanguageChange, variant = 'tailwind' }) {
  const { language, setLanguage, t, languages } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const itemRef = useRef(null)

  const handleSelect = (code, e) => {
    e.stopPropagation()
    setLanguage(code)
    onLanguageChange?.(code)
    setIsOpen(false)
  }

  // Close submenu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (itemRef.current && !itemRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (variant === 'system-admin') {
    return (
      <div
        ref={itemRef}
        className="sa-profile-dropdown-item-wrapper"
        style={{ position: 'relative' }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        <button
          type="button"
          className="sa-profile-dropdown-item"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen((prev) => !prev)
          }}
          aria-haspopup="true"
          aria-expanded={isOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={14} />
            <span>{t('language.label')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                padding: '2px 5px',
                borderRadius: '4px',
                background: '#262a35',
                color: '#8083ff',
                textTransform: 'uppercase',
              }}
            >
              {language}
            </span>
            <ChevronRight size={12} style={{ color: '#c7c4d7' }} />
          </div>
        </button>

        {isOpen && (
          <div
            className="sa-profile-dropdown-submenu"
            style={{
              position: 'absolute',
              right: '100%',
              top: '0',
              marginRight: '6px',
              minWidth: '150px',
              background: '#171b26',
              border: '1px solid #464554',
              borderRadius: '10px',
              padding: '6px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              zIndex: 60,
            }}
          >
            {languages.map((item) => {
              const isSelected = language === item.code
              return (
                <button
                  key={item.code}
                  type="button"
                  className="sa-profile-dropdown-item"
                  onClick={(e) => handleSelect(item.code, e)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: isSelected ? '#262a35' : 'transparent',
                    color: isSelected ? '#dfe2f1' : '#c7c4d7',
                    fontWeight: isSelected ? '600' : 'normal',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '12px' }}>{item.label}</span>
                  {isSelected && <Check size={14} style={{ color: '#8083ff' }} />}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Standard Tailwind / Stitched Layouts (Manager, Leader, Member)
  return (
    <div
      ref={itemRef}
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        className="w-full text-left px-3 py-2 text-[#c7c4d7] hover:text-[#dfe2f1] hover:bg-[#262a35] transition-colors flex items-center justify-between cursor-pointer text-[13px] rounded-lg"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen((prev) => !prev)
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <Globe size={15} className="text-[#8083ff] flex-shrink-0" />
          <span>{t('language.label')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#262a35] text-[#8083ff] uppercase leading-none border border-[#8083ff]/30">
            {language}
          </span>
          <ChevronRight size={13} className="text-[#c7c4d7]/70" />
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute right-full top-0 mr-1.5 w-44 rounded-xl bg-[#171b26] border border-[#464554] shadow-2xl py-1.5 z-50 text-[13px]"
          role="menu"
        >
          <div className="px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-[#c7c4d7]/60 border-b border-[#464554]/40 mb-1">
            {t('language.selectLanguage')}
          </div>
          {languages.map((item) => {
            const isSelected = language === item.code
            return (
              <button
                key={item.code}
                type="button"
                className={`w-full text-left px-3 py-2 flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'text-[#dfe2f1] font-semibold bg-[#262a35]'
                    : 'text-[#c7c4d7] hover:text-[#dfe2f1] hover:bg-[#262a35]/60'
                }`}
                onClick={(e) => handleSelect(item.code, e)}
                role="menuitem"
              >
                <span>{item.label}</span>
                {isSelected && (
                  <Check size={14} className="text-[#8083ff] flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

LanguageDropdownSubmenu.propTypes = {
  onLanguageChange: PropTypes.func,
  variant: PropTypes.oneOf(['tailwind', 'system-admin']),
}

export default LanguageDropdownSubmenu
