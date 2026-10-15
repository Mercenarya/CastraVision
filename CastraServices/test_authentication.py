from unittest.mock import Mock, patch
from uuid import UUID

import jwt
from django.test import RequestFactory, SimpleTestCase, override_settings

from .authentication import AuthenticationError, _bearer_token, _verified_subject


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
    @patch("CastraServices.authentication.httpx.get")
    @patch("CastraServices.authentication.jwt.get_unverified_header")
    def test_verifies_hs256_token_through_supabase_auth(self, get_header, get):
        get_header.return_value = {"alg": "HS256"}
        expected = UUID("11111111-1111-1111-1111-111111111111")
        get.return_value.status_code = 200
        get.return_value.json.return_value = {"id": str(expected)}

        self.assertEqual(_verified_subject("legacy-signed-token"), expected)
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
    @patch("CastraServices.authentication.httpx.get")
    @patch("CastraServices.authentication.jwt.get_unverified_header")
    def test_rejects_hs256_token_rejected_by_supabase(self, get_header, get):
        get_header.return_value = {"alg": "HS256"}
        get.return_value.status_code = 401

        with self.assertRaises(AuthenticationError) as caught:
            _verified_subject("rejected-token")
        self.assertEqual(caught.exception.code, "INVALID_TOKEN")
