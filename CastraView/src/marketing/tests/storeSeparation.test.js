/**
 * storeSeparation.test.js — Targeted Verification for Marketing Data Store & Business Service Separation (Step 3)
 *
 * Verifies:
 * 1. Shared store singleton behavior across direct imports and facade
 * 2. Approval/rejection service integration directly from proposalDecisionService
 * 3. Department-wide Marketing Manager permissions
 * 4. Assigned-group Leader permissions
 * 5. Dynamic assignment revocation
 * 6. Cross-tenant denial
 * 7. Invalid proposal status transitions
 * 8. Audit event generation with official actor roles
 * 9. No state mutation on authorization failure
 */

import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

// Direct module imports (New architecture)
import {
  getActiveProposals,
  getActiveManagerAssignments,
  getActiveMarketingGroups,
  resetMarketingStore,
  subscribeToMarketingStore,
  setStoreManagerAssignments,
} from '../data/marketingStore.js'

import {
  getAssignedGroupIdsForManager,
  getAssignedGroupIdsForLeader,
  updateManagerAssignments,
  updateLeaderAssignments,
  canManagerAccessGroup,
  canLeaderAccessGroup,
} from '../services/groupAssignmentService.js'

import {
  PROPOSAL_STATUSES,
  VALID_STATUS_TRANSITIONS,
  isValidProposalTransition,
  authorizeProposalDecision,
  canMarketingManagerApproveProposal,
  canLeaderApproveProposal,
} from '../services/proposalAuthorization.js'

import {
  executeProposalDecision,
  approveProposal,
  rejectProposal,
  updateProposalRevision,
  getProposalVersionHistory,
} from '../services/proposalDecisionService.js'

// Facade import (Backward compatibility verification)
import * as Facade from '../data/marketingGroupsData.js'

describe('CastraVision Step 3: Marketing Data Store & Business Service Separation', () => {
  beforeEach(() => {
    resetMarketingStore()
  })

  // ─── 1. SHARED STORE SINGLETON BEHAVIOR ──────────────────────────────────────
  describe('1. Shared Store Singleton Verification', () => {
    it('verifies marketingStore.js and marketingGroupsData facade share the exact same runtime store instance', () => {
      const storeProposalsBefore = getActiveProposals()
      const facadeProposalsBefore = Facade.getActiveProposals()
      assert.strictEqual(storeProposalsBefore, facadeProposalsBefore, 'Store and facade must reference same proposals array')

      // Mutate via decision service
      const targetId = 'PRP-8403'
      const res = executeProposalDecision({
        proposalId: targetId,
        action: 'approve',
        user: { id: 'mem-001', role: 'marketing_manager', name: 'Sarah Jenkins' },
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      })
      assert.strictEqual(res.success, true)

      // Both direct store selector and facade selector must reflect the updated proposal
      const storeProposalsAfter = getActiveProposals()
      const facadeProposalsAfter = Facade.getActiveProposals()
      const directApproved = storeProposalsAfter.find(p => p.id === targetId)
      const facadeApproved = facadeProposalsAfter.find(p => p.id === targetId)

      assert.strictEqual(directApproved.status, 'approved')
      assert.strictEqual(facadeApproved.status, 'approved')
      assert.strictEqual(directApproved, facadeApproved, 'Singleton store proposal object must match across imports')
    })

    it('subscribers registered via marketingStore.js or facade fire synchronously on decisions', () => {
      let storeNotified = 0
      let facadeNotified = 0

      const unsubStore = subscribeToMarketingStore(() => { storeNotified++ })
      const unsubFacade = Facade.subscribeToMarketingStore(() => { facadeNotified++ })

      executeProposalDecision({
        proposalId: 'PRP-8403',
        action: 'approve',
        user: { id: 'mem-001', role: 'marketing_manager', name: 'Sarah Jenkins' },
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      })

      assert.strictEqual(storeNotified, 1, 'Direct store subscriber must receive notification')
      assert.strictEqual(facadeNotified, 1, 'Facade subscriber must receive notification')

      unsubStore()
      unsubFacade()
    })
  })

  // ─── 2. DEPARTMENT-WIDE MARKETING MANAGER PERMISSIONS ───────────────────────
  describe('2. Department-Wide Marketing Manager Permissions', () => {
    it('grants Marketing Manager approval across any marketing group in the company/workspace', () => {
      const proposals = getActiveProposals()
      const group1Proposal = proposals.find(p => p.groupId === 'grp-growth-01')
      const group2Proposal = proposals.find(p => p.groupId === 'grp-brand-03')

      const mmUser = {
        id: 'mem-001',
        email: 'sarah.jenkins@acmecorp.com',
        role: 'marketing_manager',
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      }

      const auth1 = canMarketingManagerApproveProposal({
        user: mmUser,
        proposal: group1Proposal,
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      })
      assert.strictEqual(auth1.allowed, true)
      assert.strictEqual(auth1.scope, 'department_wide')

      const auth2 = canMarketingManagerApproveProposal({
        user: mmUser,
        proposal: group2Proposal,
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      })
      assert.strictEqual(auth2.allowed, true)
      assert.strictEqual(auth2.scope, 'department_wide')
    })
  })

  // ─── 3. ASSIGNED-GROUP LEADER PERMISSIONS & SCOPING ─────────────────────────
  describe('3. Assigned-Group Leader Permissions & Scoping', () => {
    it('allows Leader to approve only proposals in assigned groups and denies unassigned groups', () => {
      const leaderUser = {
        id: 'usr-ldr-01',
        memberId: 'mem-004',
        role: 'leader',
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      }

      const assignedGroupIds = getAssignedGroupIdsForLeader('mem-004')
      assert.ok(assignedGroupIds.includes('grp-growth-01'), 'Leader must be initially assigned to grp-growth-01')

      const proposals = getActiveProposals()
      const assignedProposal = proposals.find(p => p.groupId === 'grp-growth-01')
      const unassignedProposal = proposals.find(p => p.groupId === 'grp-brand-03') // Assigned to Elena, not David

      const authAssigned = canLeaderApproveProposal({
        user: leaderUser,
        proposal: assignedProposal,
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      })
      assert.strictEqual(authAssigned.allowed, true)
      assert.strictEqual(authAssigned.scope, 'group_scoped')

      const authUnassigned = canLeaderApproveProposal({
        user: leaderUser,
        proposal: unassignedProposal,
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      })
      assert.strictEqual(authUnassigned.allowed, false)
      assert.strictEqual(authUnassigned.code, 'UNASSIGNED_GROUP')
    })
  })

  // ─── 4. DYNAMIC ASSIGNMENT REVOCATION ───────────────────────────────────────
  describe('4. Dynamic Assignment Revocation', () => {
    it('immediately blocks Leader approval upon assignment removal in groupAssignmentService', () => {
      const leaderUser = {
        id: 'usr-ldr-01',
        memberId: 'mem-004',
        role: 'leader',
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      }

      const proposal = getActiveProposals().find(p => p.groupId === 'grp-growth-01')

      // Verify initially allowed
      const authBefore = canLeaderApproveProposal({
        user: leaderUser,
        proposal,
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      })
      assert.strictEqual(authBefore.allowed, true)

      // Revoke assignment via updateLeaderAssignments
      updateLeaderAssignments({
        managerId: 'mem-004',
        groupIds: [], // Unassign all groups
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
        performedBy: { role: 'company_admin' },
      })

      // Decision attempt must now fail closed
      const authAfter = canLeaderApproveProposal({
        user: leaderUser,
        proposal,
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      })
      assert.strictEqual(authAfter.allowed, false)
      assert.strictEqual(authAfter.code, 'UNASSIGNED_GROUP')

      const execResult = executeProposalDecision({
        proposalId: proposal.id,
        action: 'approve',
        user: leaderUser,
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      })
      assert.strictEqual(execResult.success, false)
      assert.strictEqual(execResult.error, 'UNASSIGNED_GROUP')
    })
  })

  // ─── 5. CROSS-TENANT DENIAL ─────────────────────────────────────────────────
  describe('5. Cross-Tenant Denial (Company & Workspace Boundaries)', () => {
    it('denies decisions when target proposal belongs to a different company or workspace', () => {
      const mmUser = {
        id: 'mem-001',
        role: 'marketing_manager',
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      }

      const proposal = getActiveProposals()[0]

      // Cross-company
      const crossCompanyAuth = authorizeProposalDecision({
        user: mmUser,
        proposal: { ...proposal, companyId: 'comp-foreign-tenant' },
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      })
      assert.strictEqual(crossCompanyAuth.allowed, false)
      assert.strictEqual(crossCompanyAuth.code, 'CROSS_COMPANY_FORBIDDEN')

      // Cross-workspace
      const crossWorkspaceAuth = authorizeProposalDecision({
        user: mmUser,
        proposal: { ...proposal, workspaceId: 'ws-foreign-space' },
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      })
      assert.strictEqual(crossWorkspaceAuth.allowed, false)
      assert.strictEqual(crossWorkspaceAuth.code, 'CROSS_WORKSPACE_FORBIDDEN')
    })
  })

  // ─── 6. INVALID PROPOSAL STATUS TRANSITIONS ─────────────────────────────────
  describe('6. Invalid Proposal Status Transitions', () => {
    it('prevents duplicate approvals on already approved proposals', () => {
      const mmUser = {
        id: 'mem-001',
        role: 'marketing_manager',
        name: 'Sarah Jenkins',
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      }

      // First approval
      const firstRes = executeProposalDecision({
        proposalId: 'PRP-8403',
        action: 'approve',
        user: mmUser,
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      })
      assert.strictEqual(firstRes.success, true)

      // Duplicate approval
      const secondRes = executeProposalDecision({
        proposalId: 'PRP-8403',
        action: 'approve',
        user: mmUser,
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      })
      assert.strictEqual(secondRes.success, false)
      assert.strictEqual(secondRes.error, 'ALREADY_APPROVED')
    })

    it('prevents approving an already rejected proposal without resubmission', () => {
      const mmUser = {
        id: 'mem-001',
        role: 'marketing_manager',
        name: 'Sarah Jenkins',
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      }

      // First reject
      const rejectRes = executeProposalDecision({
        proposalId: 'PRP-8403',
        action: 'reject',
        user: mmUser,
        rejectionReason: 'Needs complete overhaul of target audience tone.',
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      })
      assert.strictEqual(rejectRes.success, true)

      // Try approve rejected proposal
      const approveRes = executeProposalDecision({
        proposalId: 'PRP-8403',
        action: 'approve',
        user: mmUser,
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      })
      assert.strictEqual(approveRes.success, false)
      assert.strictEqual(approveRes.error, 'CANNOT_APPROVE_REJECTED')
    })
  })

  // ─── 7. AUDIT EVENT GENERATION ──────────────────────────────────────────────
  describe('7. Audit Event Generation', () => {
    it('records accurate official actor role, operator name, and timestamp in proposal history', () => {
      const mmUser = {
        id: 'mem-001',
        role: 'marketing_manager',
        name: 'Sarah Jenkins',
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      }

      const res = executeProposalDecision({
        proposalId: 'PRP-8403',
        action: 'approve',
        user: mmUser,
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
        justification: 'Approved for Q4 multi-channel blast.',
      })

      assert.strictEqual(res.success, true)
      const history = getProposalVersionHistory('PRP-8403')
      assert.ok(history.length > 0)
      const topEvent = history[0]
      assert.strictEqual(topEvent.type, 'approved')
      assert.strictEqual(topEvent.operator, 'Sarah Jenkins')
      assert.strictEqual(topEvent.operatorRole, 'Marketing Manager')
      assert.strictEqual(topEvent.justification, 'Approved for Q4 multi-channel blast.')
    })
  })

  // ─── 8. NO STATE MUTATION ON AUTHORIZATION FAILURE ──────────────────────────
  describe('8. No State Mutation on Authorization Failure', () => {
    it('leaves proposal state untouched when authorization fails', () => {
      const originalProposal = { ...getActiveProposals().find(p => p.id === 'PRP-8403') }

      const employeeUser = {
        id: 'mem-005',
        role: 'member',
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      }

      const res = executeProposalDecision({
        proposalId: 'PRP-8403',
        action: 'approve',
        user: employeeUser,
        companyId: 'comp-acme-global',
        workspaceId: 'ws-acme-8920',
      })

      assert.strictEqual(res.success, false)
      assert.strictEqual(res.error, 'FORBIDDEN_ROLE')

      const currentProposal = getActiveProposals().find(p => p.id === 'PRP-8403')
      assert.strictEqual(currentProposal.status, originalProposal.status)
      assert.strictEqual(currentProposal.approvedAt, originalProposal.approvedAt)
      assert.strictEqual(currentProposal.history?.length || 0, originalProposal.history?.length || 0)
    })
  })
})
