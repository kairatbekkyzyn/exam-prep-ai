import os
import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
from app.auth import create_access_token, hash_password
import secrets

router = APIRouter()

FRONTEND_URL    = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL     = os.getenv("BACKEND_URL",  "http://localhost:8000")

GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

GITHUB_CLIENT_ID     = os.getenv("GITHUB_CLIENT_ID", "")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "")


# ── Google ────────────────────────────────────────────────────────────────────

@router.get("/google")
async def google_login():
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=501, detail="Google OAuth not configured.")
    params = (
        f"client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={BACKEND_URL}/api/auth/oauth/google/callback"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        f"&access_type=offline"
    )
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{params}")


@router.get("/google/callback")
async def google_callback(code: str, db: AsyncSession = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        # Exchange code for tokens
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": f"{BACKEND_URL}/api/auth/oauth/google/callback",
                "grant_type": "authorization_code",
            },
        )
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        if not access_token:
            return RedirectResponse(f"{FRONTEND_URL}/login?error=google_failed")

        # Get user info
        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        info = user_res.json()

    email = info.get("email")
    name  = info.get("name") or email.split("@")[0]

    if not email:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=no_email")

    return await _get_or_create_user(db, email, name)


# ── GitHub ────────────────────────────────────────────────────────────────────

@router.get("/github")
async def github_login():
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=501, detail="GitHub OAuth not configured.")
    params = (
        f"client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={BACKEND_URL}/api/auth/oauth/github/callback"
        f"&scope=user:email"
    )
    return RedirectResponse(f"https://github.com/login/oauth/authorize?{params}")


@router.get("/github/callback")
async def github_callback(code: str, db: AsyncSession = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_res = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": f"{BACKEND_URL}/api/auth/oauth/github/callback",
            },
            headers={"Accept": "application/json"},
        )
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        if not access_token:
            return RedirectResponse(f"{FRONTEND_URL}/login?error=github_failed")

        # Get user profile
        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        )
        info = user_res.json()

        # GitHub may hide email — fetch separately
        email = info.get("email")
        if not email:
            emails_res = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
            )
            emails = emails_res.json()
            primary = next((e for e in emails if e.get("primary") and e.get("verified")), None)
            email = primary["email"] if primary else None

    if not email:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=no_email")

    name = info.get("name") or info.get("login") or email.split("@")[0]
    return await _get_or_create_user(db, email, name)


# ── Shared ────────────────────────────────────────────────────────────────────

async def _get_or_create_user(db: AsyncSession, email: str, name: str):
    """Find or create an OAuth user (always verified), return redirect with JWT."""
    result = await db.execute(select(User).where(User.email == email.lower()))
    user   = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email.lower(),
            name=name,
            password_hash=hash_password(secrets.token_hex(32)),  # random unusable password
            is_verified=True,  # OAuth = pre-verified
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    elif not user.is_verified:
        # Existing unverified account — verify it via OAuth
        user.is_verified = True
        await db.commit()

    jwt = create_access_token(user.id)
    return RedirectResponse(f"{FRONTEND_URL}/oauth/callback?token={jwt}")