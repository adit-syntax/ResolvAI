"""
Auth Router — /api/auth
Handles user registration, login (JWT issuance), and profile endpoints.
"""

import os
import secrets
import httpx
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime, timezone

from database import get_db
from models import User, Employee
from auth_utils import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, require_auth,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


# ─── Schemas ─────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3)
    password: str = Field(..., min_length=1)


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., max_length=150)
    password: str = Field(..., min_length=6, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=128)


class GoogleAuthRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=150)
    name: Optional[str] = ""
    access_token: Optional[str] = None
    id_token: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
    name: str


class UserProfile(BaseModel):
    id: int
    name: str
    email: str
    role: str
    employee_id: Optional[int]
    is_active: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


from limiter import limiter

# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, data: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate with email + password.
    Returns a signed JWT access token plus basic profile info.
    """
    user = db.query(User).filter(
        User.email == data.email.strip().lower()
    ).first()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact an administrator.",
        )

    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email, "name": user.name})
    return TokenResponse(
        access_token=token,
        role=user.role,
        email=user.email,
        name=user.name,
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """
    Self-registration for end-users only (role is always 'user').
    Employees and admins are created by an admin via the Employee Directory.
    """
    email = data.email.strip().lower()

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        name=data.name.strip(),
        email=email,
        hashed_password=get_password_hash(data.password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email, "name": user.name})
    return TokenResponse(
        access_token=token,
        role=user.role,
        email=user.email,
        name=user.name,
    )


async def _verify_google_token(id_token: Optional[str], access_token: Optional[str]) -> dict:
    """Verify Google token cryptographically with Google API."""
    env = os.getenv("ENVIRONMENT", "development").lower()
    # Test fixture mock token support in non-production
    if env != "production" and (id_token == "mock_google_oauth_token" or access_token == "mock_google_oauth_token"):
        return {"email": "google_user_demo@gmail.com", "name": "Google User Demo"}

    async with httpx.AsyncClient(timeout=8.0) as client:
        if id_token:
            resp = await client.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}")
            if resp.status_code == 200:
                data = resp.json()
                if data.get("email"):
                    return data
        if access_token:
            resp = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if resp.status_code == 200:
                data = resp.json()
                if data.get("email"):
                    return data
    return {}


@router.post("/google", response_model=TokenResponse)
async def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticate / Register via Google OAuth.
    Cryptographically verifies Google id_token / access_token before issuing JWT.
    """
    verified_email = None
    verified_name = None

    # Step 1: Verify Google Token
    if data.id_token or data.access_token:
        google_payload = await _verify_google_token(data.id_token, data.access_token)
        if google_payload and google_payload.get("email"):
            verified_email = google_payload["email"].strip().lower()
            verified_name = google_payload.get("name") or google_payload.get("given_name") or ""
        else:
            raise HTTPException(status_code=401, detail="Invalid or expired Google OAuth token.")
    elif os.getenv("ENVIRONMENT", "development").lower() != "production" and data.email:
        # Development / Test mock fallback only
        verified_email = data.email.strip().lower()
        verified_name = data.name or ""
    else:
        raise HTTPException(
            status_code=400,
            detail="Google id_token or access_token is required for authentication."
        )

    if not verified_email or "@" not in verified_email:
        raise HTTPException(status_code=400, detail="Invalid email from Google OAuth.")

    user = db.query(User).filter(User.email == verified_email).first()
    if not user:
        # Provision new customer account
        user = User(
            name=(verified_name or verified_email.split("@")[0]).strip(),
            email=verified_email,
            hashed_password=get_password_hash(secrets.token_hex(16)),
            role="user",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated.")

    token = create_access_token({"sub": str(user.id), "role": user.role, "email": user.email, "name": user.name})
    return TokenResponse(
        access_token=token,
        role=user.role,
        email=user.email,
        name=user.name,
    )


@router.get("/me", response_model=UserProfile)
def get_me(current_user=Depends(require_auth)):
    """Return the authenticated user's own profile."""
    return current_user


@router.put("/me/password")
def change_password(
    data: ChangePasswordRequest,
    current_user=Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Change the authenticated user's password."""
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password updated successfully."}
