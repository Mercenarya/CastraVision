import React from 'react'
import PropTypes from 'prop-types'

/**
 * SettingsHeader
 * Shared header section with breadcrumb title and role-aware tab navigation pills.
 */
export function SettingsHeader({
  title = 'Cài đặt',
  subtitle = 'Quản lý thông tin tài khoản, bảo mật cá nhân và tùy chọn thông báo.',
  tabs = [],
  activeTab,
  onTabChange,
}) {
  return (
    <div className="flex flex-col space-y-6">
      {/* Title & Description */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#464554]/50">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-[#dfe2f1] tracking-tight leading-tight font-sans">
            {title}
          </h1>
          <p className="text-sm text-[#c7c4d7] mt-1 font-sans">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Dynamic Tab Navigation Strip */}
      <div className="flex items-center gap-2 border-b border-[#464554]/50 overflow-x-auto custom-scrollbar pb-[2px]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const IconComponent = tab.icon

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-2.5 px-5 py-3 text-sm font-semibold transition-all -mb-[2px] rounded-t-lg select-none whitespace-nowrap ${
                isActive
                  ? 'bg-[#262a35] text-[#dfe2f1] border-b-2 border-[#8083ff]'
                  : 'text-[#c7c4d7] hover:text-[#dfe2f1] hover:bg-[#262a35]/40 border-b-2 border-transparent'
              }`}
            >
              {IconComponent && (
                <IconComponent
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-[#8083ff]' : 'text-[#908fa0]'
                  }`}
                />
              )}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#8083ff]/15 text-[#8083ff] border border-[#8083ff]/30">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

SettingsHeader.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType,
      badge: PropTypes.string,
    })
  ).isRequired,
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
}

export default SettingsHeader
