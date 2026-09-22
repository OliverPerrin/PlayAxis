"""Optional SMTP contact endpoint. Never reports success for an unsent message."""

import smtplib
from email.message import EmailMessage
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field
from app.core.config import settings

router = APIRouter()


class ContactRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field(default="Website enquiry", max_length=150)
    message: str = Field(min_length=5, max_length=3000)


@router.post("")
@router.post("/")
def contact(body: ContactRequest):
    if not all(
        [
            settings.SMTP_HOST,
            settings.CONTACT_SENDER_EMAIL,
            settings.CONTACT_SENDER_PASSWORD,
            settings.CONTACT_RECIPIENT_EMAIL,
        ]
    ):
        raise HTTPException(
            503,
            "Email delivery is not configured. Use the email draft on the Contact page.",
        )
    message = EmailMessage()
    message["Subject"] = "PlayAxis: " + body.subject.replace("\r", " ").replace(
        "\n", " "
    )
    message["From"] = settings.CONTACT_SENDER_EMAIL
    message["To"] = settings.CONTACT_RECIPIENT_EMAIL
    message["Reply-To"] = str(body.email)
    message.set_content(f"From: {body.name} <{body.email}>\n\n{body.message}")
    try:
        with smtplib.SMTP(
            settings.SMTP_HOST, settings.SMTP_PORT or 587, timeout=15
        ) as smtp:
            smtp.starttls()
            smtp.login(settings.CONTACT_SENDER_EMAIL, settings.CONTACT_SENDER_PASSWORD)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        raise HTTPException(
            502,
            "The email provider did not accept your message. Please use your email app.",
        ) from exc
    return {
        "accepted": True,
        "detail": "The mail provider accepted the message. Final delivery is not confirmed.",
    }
