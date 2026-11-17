import { api } from './api'
import { createMembershipService } from './membershipService'
export const membershipService = createMembershipService(api)
