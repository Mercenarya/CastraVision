from unittest.mock import Mock, patch
from uuid import UUID

import jwt
from django.test import RequestFactory, SimpleTestCase, override_settings

from .authentication import (
    AuthenticationError,
    WorkspaceAuthorizationError,
    _bearer_token,
    _verified_subject,
    authenticate_request,
)
from .identity import verified_identity
from .supabase_client import MembershipNotFound, WorkspaceMembership


class BearerTokenTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_requires_a_well_formed_bearer_header(self):
        with self.assertRaises(AuthenticationError) as caught:
            _bearer_token(self.factory.get("/api/test"))
        self.assertEqual(caught.exception.code, "AUTH_REQUIRED")

        with self.assertRaises(AuthenticationError) as caught:
            _bearer_token(
                self.factory.get("/api/test", HTTP_AUTHORIZATION="Basic value")
            )
        self.assertEqual(caught.exception.code, "AUTH_REQUIRED")

    def test_extracts_token_without_logging_or_decoding_it(self):
        request = self.factory.get(
            "/api/test", HTTP_AUTHORIZATION="Bearer signed-token"
        )
        self.assertEqual(_bearer_token(request), "signed-token")


class ActiveWorkspaceTests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.user_id = UUID("11111111-1111-1111-1111-111111111111")
        self.workspace_id = UUID("22222222-2222-2222-2222-222222222222")

    @patch("CastraServices.authentication.user_client")
    @patch("CastraServices.identity.verified_identity")
    def test_verifies_the_explicit_active_workspace(
        self, verified_subject, user_client
    ):
        verified_subject.return_value = ("signed-token", {"id": str(self.user_id)})
        user_client.return_value.workspace_membership.return_value = (
            WorkspaceMembership(workspace_id=self.workspace_id, role="admin")
        )
        request = self.factory.get(
            "/api/test",
            HTTP_AUTHORIZATION="Bearer signed-token",
            HTTP_X_WORKSPACE_ID=str(self.workspace_id),
        )

        context = authenticate_request(request)

        self.assertEqual(context.workspace_id, self.workspace_id)
        user_client.return_value.workspace_membership.assert_called_once_with(
            self.user_id, self.workspace_id
        )

    @patch("CastraServices.authentication.user_client")
    @patch("CastraServices.identity.verified_identity")
    def test_requires_a_membership_when_no_workspace_header(self, verified_subject, user_client):
        verified_subject.return_value = ("signed-token", {"id": str(self.user_id)})
        user_client.return_value.single_workspace_membership.side_effect = MembershipNotFound(
            "missing"
        )
        request = self.factory.get(
            "/api/test", HTTP_AUTHORIZATION="Bearer signed-token"
        )

        with self.assertRaises(WorkspaceAuthorizationError) as caught:
            authenticate_request(request)

        self.assertEqual(caught.exception.code, "WORKSPACE_REQUIRED")


@override_settings(
    SUPABASE_JWT_ALGORITHMS=["ES256"],
    SUPABASE_JWT_AUDIENCE="authenticated",
    SUPABASE_JWT_ISSUER="https://example.supabase.co/auth/v1",
    SUPABASE_JWKS_URL="https://example.supabase.co/auth/v1/.well-known/jwks.json",
)
class JWTVerificationTests(SimpleTestCase):
    @patch("CastraServices.authentication.jwt.decode")
    @patch("CastraServices.authentication.jwt.get_unverified_header")
    @patch("CastraServices.authentication._jwk_client")
    def test_validates_signature_registered_claims_and_subject(
        self, jwk_client, get_header, decode
    ):
        get_header.return_value = {"alg": "ES256"}
        jwk_client.return_value.get_signing_key_from_jwt.return_value = Mock(
            key="public-key"
        )
        expected = UUID("11111111-1111-1111-1111-111111111111")
        decode.return_value = {"sub": str(expected)}

        self.assertEqual(_verified_subject("signed-token"), expected)
        decode.assert_called_once_with(
            "signed-token",
            "public-key",
            algorithms=["ES256"],
            audience="authenticated",
            issuer="https://example.supabase.co/auth/v1",
            options={"require": ["exp", "iat", "sub", "aud", "iss"]},
        )

    @patch("CastraServices.authentication.jwt.get_unverified_header")
    def test_rejects_unapproved_algorithms_before_key_lookup(self, get_header):
        get_header.return_value = {"alg": "none"}
        with self.assertRaises(AuthenticationError) as caught:
            _verified_subject("unsigned-token")
        self.assertEqual(caught.exception.code, "INVALID_TOKEN")

    @patch("CastraServices.authentication.jwt.get_unverified_header")
    @patch("CastraServices.authentication._jwk_client")
    def test_sanitizes_signature_failures(self, jwk_client, get_header):
        get_header.return_value = {"alg": "ES256"}
        jwk_client.return_value.get_signing_key_from_jwt.side_effect = (
            jwt.PyJWKClientError("sensitive upstream details")
        )
        with self.assertRaises(AuthenticationError) as caught:
            _verified_subject("bad-token")
        self.assertEqual(str(caught.exception), "The access token is invalid.")

    @override_settings(
        SUPABASE_JWT_ALGORITHMS=["HS256"],
        SUPABASE_URL="https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY="publishable-test-key",
    )
    @patch("CastraServices.identity.httpx.get")
    def test_verifies_opaque_token_through_supabase_auth(self, get):
        expected = UUID("11111111-1111-1111-1111-111111111111")
        get.return_value.status_code = 200
        get.return_value.json.return_value = {
            "id": str(expected), "email_confirmed_at": "2026-01-01"
        }

        request = RequestFactory().get('/api/test', HTTP_AUTHORIZATION='Bearer legacy-signed-token')
        self.assertEqual(verified_identity(request)[1]['id'], str(expected))
        get.assert_called_once_with(
            "https://example.supabase.co/auth/v1/user",
            headers={
                "apikey": "publishable-test-key",
                "Authorization": "Bearer legacy-signed-token",
            },
            timeout=10,
        )

    @override_settings(
        SUPABASE_JWT_ALGORITHMS=["HS256"],
        SUPABASE_URL="https://example.supabase.co",
        SUPABASE_PUBLISHABLE_KEY="publishable-test-key",
    )
    @patch("CastraServices.identity.httpx.get")
    def test_rejects_token_rejected_by_supabase(self, get):
        get.return_value.status_code = 401

        with self.assertRaises(AuthenticationError) as caught:
            verified_identity(
                RequestFactory().get('/api/test', HTTP_AUTHORIZATION='Bearer rejected-token')
            )
        self.assertEqual(caught.exception.code, "INVALID_TOKEN")
