from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, EmailStr
import smtplib
import os
from email.message import EmailMessage

router = APIRouter()

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: str | None = None
    message: str

SUPPORT_EMAIL = os.getenv("CONTACT_RECIPIENT_EMAIL", "oliver.t.perrin@gmail.com")
SENDER_EMAIL = os.getenv("CONTACT_SENDER_EMAIL")  # e.g. an SMTP-enabled no-reply
SENDER_PASSWORD = os.getenv("CONTACT_SENDER_PASSWORD")
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))


def send_email(name: str, email: str, subject: str | None, content: str):
    if not (SENDER_EMAIL and SENDER_PASSWORD):
        # In dev, just log to console instead of failing
        print("[contact] SENDER_EMAIL or password not set; message captured:")
        print({"from": email, "name": name, "message": content})
        return
    msg = EmailMessage()
    subj_core = subject.strip() if subject else name
    msg["Subject"] = f"PlayAxis Contact: {subj_core}"[:180]
    msg["From"] = SENDER_EMAIL
    msg["To"] = SUPPORT_EMAIL
    msg.set_content(f"From: {name} <{email}>\n\n{content}")
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        print("[contact] email send failed", e)
        raise

@router.post("/", status_code=202)
async def submit_contact(req: ContactRequest, background: BackgroundTasks):
    if len(req.message.strip()) < 5:
        raise HTTPException(status_code=400, detail="Message too short")
    background.add_task(send_email, req.name, req.email, req.subject, req.message)
    return {"ok": True}
