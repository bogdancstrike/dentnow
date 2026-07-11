"""In-test RSA keypair + JWT signing helpers for IAM tests."""
from __future__ import annotations

import time
from typing import Any

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from jose import jwk, jwt

from src.config import Config


def make_keypair(kid: str) -> tuple[bytes, dict]:
    """Return (private_pem, public_jwk_with_kid)."""
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    priv_pem = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    )
    pub_pem = key.public_key().public_bytes(
        serialization.Encoding.PEM,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    jwk_dict = jwk.construct(pub_pem, "RS256").to_dict()
    jwk_dict["kid"] = kid
    jwk_dict["alg"] = "RS256"
    return priv_pem, jwk_dict


def base_claims(**overrides: Any) -> dict[str, Any]:
    now = int(time.time())
    claims: dict[str, Any] = {
        "sub": "user-123",
        "iss": Config.KEYCLOAK_ISSUER,
        "aud": Config.KEYCLOAK_AUDIENCE,
        "azp": Config.KEYCLOAK_AUTHORIZED_PARTY,
        "exp": now + 300,
        "iat": now,
        "preferred_username": "alice",
        "email": "alice@example.com",
        "realm_access": {"roles": ["dentnow_editor"]},
    }
    claims.update(overrides)
    return claims


def sign(claims: dict[str, Any], private_pem: bytes, kid: str) -> str:
    return jwt.encode(claims, private_pem, algorithm="RS256", headers={"kid": kid})
