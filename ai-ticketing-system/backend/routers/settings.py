"""
Settings API Router
Handles dynamic Web UI configuration for Groq AI API Key, Slack Webhook URL, and System Settings.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import os
import json
import urllib.request

from database import get_db
from models import SystemSetting
from auth_utils import require_admin

router = APIRouter(prefix="/api/settings", tags=["Settings"])


class SettingsUpdate(BaseModel):
    groq_api_key: Optional[str] = None
    slack_webhook_url: Optional[str] = None
    groq_model: Optional[str] = None


class TestSlackRequest(BaseModel):
    webhook_url: Optional[str] = None


def get_setting_value(db: Session, key: str, env_key: str = None) -> Optional[str]:
    """Retrieve setting from DB table system_settings first, falling back to .env variable."""
    record = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if record and record.value and record.value.strip():
        return record.value.strip()
    if env_key:
        env_val = os.getenv(env_key)
        if env_val and env_val.strip():
            return env_val.strip()
    return None


def set_setting_value(db: Session, key: str, value: str):
    """Save setting key-value pair into system_settings DB table."""
    record = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    val_to_save = value.strip() if value else ""
    if record:
        record.value = val_to_save
    else:
        db.add(SystemSetting(key=key, value=val_to_save))


def mask_secret(secret: Optional[str]) -> str:
    """Mask sensitive string like gsk_123456789 -> gsk_123...6789."""
    if not secret or len(secret) < 8:
        return secret or ""
    return f"{secret[:5]}...{secret[-4:]}"


@router.get("/")
def get_settings(db: Session = Depends(get_db)):
    """Get current Web UI system settings and integration status."""
    groq_key = get_setting_value(db, "groq_api_key", "GROQ_API_KEY")
    slack_url = get_setting_value(db, "slack_webhook_url", "SLACK_WEBHOOK_URL")
    groq_model = get_setting_value(db, "groq_model", "GROQ_MODEL") or "llama-3.3-70b-versatile"

    return {
        "groq_api_key": mask_secret(groq_key),
        "is_groq_configured": bool(groq_key and groq_key.startswith("gsk_")),
        "slack_webhook_url": slack_url or "",
        "is_slack_configured": bool(slack_url and slack_url.startswith("http")),
        "groq_model": groq_model,
        "raw_groq_set": bool(groq_key),
    }


@router.post("/")
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """Update dynamic system settings from Web UI. Admin only."""
    if data.groq_api_key is not None:
        set_setting_value(db, "groq_api_key", data.groq_api_key)
    if data.slack_webhook_url is not None:
        set_setting_value(db, "slack_webhook_url", data.slack_webhook_url)
    if data.groq_model is not None:
        set_setting_value(db, "groq_model", data.groq_model)

    db.commit()
    return {"message": "Settings updated successfully"}


@router.post("/test-slack")
def test_slack_webhook(data: TestSlackRequest, db: Session = Depends(get_db), current_user=Depends(require_admin)):
    """Send a test message to the Slack webhook URL to verify connection. Admin only."""
    webhook_url = data.webhook_url or get_setting_value(db, "slack_webhook_url", "SLACK_WEBHOOK_URL")
    if not webhook_url or not webhook_url.startswith("http"):
        raise HTTPException(status_code=400, detail="Please provide a valid Slack Webhook URL")

    payload = {
        "text": "🎉 *ResolvAI Integration Test*: Slack webhooks are successfully configured and working!",
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "✅ ResolvAI Connection Test",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Your ResolvAI ticketing system is now connected to Slack! You will receive live alerts for urgent tickets and escalations here."
                }
            }
        ]
    }

    try:
        req_data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(webhook_url, data=req_data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status in [200, 204]:
                return {"message": "Slack test message sent successfully!"}
            raise HTTPException(status_code=400, detail=f"Slack returned status {response.status}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to post to Slack: {str(e)}")
