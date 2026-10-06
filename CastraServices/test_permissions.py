from unittest.mock import patch
from uuid import UUID

from django.http import JsonResponse
from django.test import RequestFactory, SimpleTestCase

from .authentication import (
    AuthenticationError,
    RequestAuthContext,
    WorkspaceAuthorizationError,
)
from .permissions import request_auth, require_workspace_operator


class WorkspacePermissionTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.view = require_workspace_operator(
            lambda request: JsonResponse({"role": request_auth(request).role})
        )

    @patch("CastraServices.permissions.authenticate_request")
    def test_returns_401_for_invalid_identity(self, authenticate):
        authenticate.side_effect = AuthenticationError("INVALID_TOKEN", "Invalid")
        response = self.view(self.factory.get("/api/test"))
        self.assertEqual(response.status_code, 401)

    @patch("CastraServices.permissions.authenticate_request")
    def test_returns_403_when_workspace_is_missing(self, authenticate):
        authenticate.side_effect = WorkspaceAuthorizationError(
            "WORKSPACE_REQUIRED", "Onboarding required"
        )
        response = self.view(self.factory.get("/api/test"))
        self.assertEqual(response.status_code, 403)

    @patch("CastraServices.permissions.authenticate_request")
    def test_rejects_member_before_entering_view(self, authenticate):
        authenticate.return_value = RequestAuthContext(
            user_id=UUID("11111111-1111-1111-1111-111111111111"),
            workspace_id=UUID("22222222-2222-2222-2222-222222222222"),
            role="member",
            access_token="not-logged",
        )
        response = self.view(self.factory.get("/api/test"))
        self.assertEqual(response.status_code, 403)
        self.assertIn(b"PERMISSION_DENIED", response.content)

    @patch("CastraServices.permissions.authenticate_request")
    def test_attaches_validated_operator_context(self, authenticate):
        authenticate.return_value = RequestAuthContext(
            user_id=UUID("11111111-1111-1111-1111-111111111111"),
            workspace_id=UUID("22222222-2222-2222-2222-222222222222"),
            role="manager",
            access_token="not-logged",
        )
        response = self.view(self.factory.get("/api/test"))
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"manager", response.content)
