# Gmail SMTP Setup for Contact Enquiries

The app now sends:
- enquiry details to `vivekshivaliya@gmail.com`
- confirmation mail to the patient email entered in "Get in touch"

## 1) Create `.env` file

In `C:\Users\vivek\audiosen\audiosen-web`, create `.env` and copy:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=vivekshivaliya@gmail.com
SMTP_PASS=your_gmail_app_password
MAIL_FROM=Audiosen <vivekshivaliya@gmail.com>
MAIL_TO=vivekshivaliya@gmail.com
```

## 2) Generate Gmail App Password

1. Open Google Account settings.
2. Turn on 2-Step Verification.
3. Go to App Passwords.
4. Create an app password for "Mail".
5. Use that 16-character password as `SMTP_PASS`.

## 3) Run app

```powershell
cd C:\Users\vivek\audiosen\audiosen-web
npm run dev
```

## 4) Test flow

1. Open `http://127.0.0.1:3000`
2. Submit "Get in touch" form with a real patient email.
3. Verify:
   - enquiry arrives at `vivekshivaliya@gmail.com`
   - patient receives congratulation confirmation email
