import PropTypes from 'prop-types'
import LeaderLayout from '../leader/LeaderLayout'
import MemberLayout from '../member/MemberLayout'

/**
 * StandardDashboardShell
 * Backward-compatible delegator to role-specific layouts (LeaderLayout & MemberLayout).
 */
export default function StandardDashboardShell({
  user,
  profile,
  page = 'overview',
  setPage,
  logout,
  children,
}) {
  const isLeader = user?.role === 'manager'

  if (isLeader) {
    return (
      <LeaderLayout
        user={user}
        profile={profile}
        page={page}
        setPage={setPage}
        logout={logout}
      >
        {children}
      </LeaderLayout>
    )
  }

  return (
    <MemberLayout
      user={user}
      profile={profile}
      page={page}
      setPage={setPage}
      logout={logout}
    >
      {children}
    </MemberLayout>
  )
}

StandardDashboardShell.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string,
    role: PropTypes.string,
  }),
  profile: PropTypes.object,
  page: PropTypes.string,
  setPage: PropTypes.func,
  logout: PropTypes.func,
  children: PropTypes.node,
}
