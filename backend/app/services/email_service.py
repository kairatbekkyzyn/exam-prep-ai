import os
import random
import string
import httpx
from datetime import datetime, timedelta

BREVO_API_KEY   = os.getenv("BREVO_API_KEY", "")
FROM_EMAIL      = os.getenv("FROM_EMAIL", "")
FROM_NAME       = "ExamAI"
OTP_EXPIRE_MINS = 10


def generate_otp() -> tuple[str, datetime]:
    code    = "".join(random.choices(string.digits, k=6))
    expires = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINS)
    return code, expires


async def send_otp_email(to_email: str, name: str, code: str) -> bool:
    if not BREVO_API_KEY or not FROM_EMAIL:
        print(f"\n{'='*40}")
        print(f"  OTP for {to_email}: {code}")
        print(f"{'='*40}\n")
        return True

    html = f"""
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#06080d;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
             style="background:#0c0f18;border:1px solid rgba(255,255,255,0.07);
                    border-radius:20px;overflow:hidden;">
        <tr>
          <td style="padding:28px 36px;border-bottom:1px solid rgba(255,255,255,0.07);">
            <span style="font-size:18px;font-weight:800;color:white;">🎓 ExamAI</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 36px;">
            <p style="color:#94a3b8;font-size:14px;margin:0 0 6px;">Hi {name} 👋</p>
            <h1 style="color:white;font-size:20px;font-weight:700;margin:0 0 14px;">
              Verify your email address
            </h1>
            <p style="color:#64748b;font-size:14px;line-height:1.7;margin:0 0 28px;">
              Enter this code to activate your ExamAI account.
              Expires in {OTP_EXPIRE_MINS} minutes.
            </p>
            <div style="background:#111522;border:1px solid rgba(34,211,238,0.2);
                        border-radius:14px;padding:24px;text-align:center;margin-bottom:28px;">
              <p style="color:#64748b;font-size:11px;text-transform:uppercase;
                         letter-spacing:0.1em;margin:0 0 10px;">Verification code</p>
              <p style="font-family:monospace;font-size:40px;font-weight:700;
                         color:#22d3ee;letter-spacing:0.25em;margin:0;">{code}</p>
            </div>
            <p style="color:#334155;font-size:12px;margin:0;">
              If you didn't create an ExamAI account, ignore this email.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.brevo.com/v3/smtp/email",
                headers={
                    "api-key": BREVO_API_KEY,
                    "Content-Type": "application/json",
                },
                json={
                    "sender":      {"name": FROM_NAME, "email": FROM_EMAIL},
                    "to":          [{"email": to_email, "name": name}],
                    "subject":     f"Your ExamAI verification code: {code}",
                    "htmlContent": html,
                },
                timeout=10,
            )
        if response.status_code in (200, 201):
            return True
        print(f"Brevo error: {response.status_code} {response.text}")
        return False
    except Exception as e:
        print(f"Email send failed: {e}")
        return False