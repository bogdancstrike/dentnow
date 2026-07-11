"""JWT verification: signature, exp, issuer, audience, azp, sub, kid rotation."""
from __future__ import annotations

import pytest

from src.core.errors import AuthenticationError
from src.iam import token_verifier
from tests.iam_helpers import base_claims, make_keypair, sign


@pytest.fixture()
def key():
    priv, jwk_dict = make_keypair("k1")
    token_verifier.install_test_jwks([jwk_dict])
    yield priv
    token_verifier._jwks.clear()


def test_valid_token_returns_claims(key):
    token = sign(base_claims(), key, "k1")
    claims = token_verifier.verify_token(token)
    assert claims["sub"] == "user-123"
    assert claims["azp"] == "dentnow-admin-spa"


def test_missing_token():
    with pytest.raises(AuthenticationError):
        token_verifier.verify_token("")


def test_unknown_kid(key):
    token = sign(base_claims(), key, "does-not-exist")
    with pytest.raises(AuthenticationError, match="unknown signing key"):
        token_verifier.verify_token(token)


def test_bad_signature():
    good_priv, good_jwk = make_keypair("k1")
    other_priv, _ = make_keypair("k1")  # same kid, different key
    token_verifier.install_test_jwks([good_jwk])
    token = sign(base_claims(), other_priv, "k1")
    with pytest.raises(AuthenticationError):
        token_verifier.verify_token(token)
    token_verifier._jwks.clear()


def test_expired_token(key):
    token = sign(base_claims(exp=1), key, "k1")
    with pytest.raises(AuthenticationError):
        token_verifier.verify_token(token)


def test_wrong_issuer(key):
    token = sign(base_claims(iss="https://evil.example/realms/x"), key, "k1")
    with pytest.raises(AuthenticationError):
        token_verifier.verify_token(token)


def test_wrong_audience(key):
    token = sign(base_claims(aud="some-other-api"), key, "k1")
    with pytest.raises(AuthenticationError):
        token_verifier.verify_token(token)


def test_wrong_azp(key):
    token = sign(base_claims(azp="malicious-client"), key, "k1")
    with pytest.raises(AuthenticationError, match="authorized party"):
        token_verifier.verify_token(token)


def test_missing_azp(key):
    claims = base_claims()
    claims.pop("azp")
    token = sign(claims, key, "k1")
    with pytest.raises(AuthenticationError, match="authorized party"):
        token_verifier.verify_token(token)


def test_missing_sub(key):
    token = sign(base_claims(sub=""), key, "k1")
    with pytest.raises(AuthenticationError, match="subject"):
        token_verifier.verify_token(token)
