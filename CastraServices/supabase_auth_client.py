"""Supabase Auth client for user authentication."""

from __future__ import annotations

import os
from typing import Any

from django.conf import settings
from supabase import Client, create_client


class SupabaseAuthError(Exception):
    """Base exception for Supabase Auth errors."""


class SupabaseAuthClient:
    def __init__(self):
        self._client: Client | None = None
        self._initialize_client()

    def _initialize_client(self) -> None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
            raise SupabaseAuthError("Supabase URL and ANON key must be set in settings.")
        self._client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY,
        )

    @property
    def client(self) -> Client:
        if self._client is None:
            self._initialize_client()
        return self._client

    def sign_up(self, email: str, password: str) -> dict[str, Any]:
        """Sign up a new user with email and password."""
        try:
            response = self.client.auth.sign_up(
                {"email": email, "password": password}
            )
            return response
        except Exception as e:
            raise SupabaseAuthError(f"Sign up failed: {e}") from e

    def sign_in(self, email: str, password: str) -> dict[str, Any]:
        """Sign in user with email and password."""
        try:
            response = self.client.auth.sign_in_with_password(
                {"email": email, "password": password}
            )
            return response
        except Exception as e:
            raise SupabaseAuthError(f"Sign in failed: {e}") from e

    def sign_out(self, access_token: str) -> None:
        """Sign out the user by invalidating the session."""
        try:
            # We need to set the access token on the client to call logout
            # Alternatively, we can use the admin API with service role to terminate session
            # But for user-initiated logout, we can use the user's token.
            # Create a temporary client with the user's access token
            temp_client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_ANON_KEY,
                access_token=access_token,
            )
            temp_client.auth.logout()
        except Exception as e:
            raise SupabaseAuthError(f"Sign out failed: {e}") from e

    def get_user(self, access_token: str) -> dict[str, Any]:
        """Get user data from access token."""
        try:
            # Set the access token on the client
            temp_client = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_ANON_KEY,
                access_token=access_token,
            )
            user = temp_client.auth.get_user()
            return user
        except Exception as e:
            raise SupabaseAuthError(f"Get user failed: {e}") from e


# Singleton instance
supabase_auth_client = SupabaseAuthClient()