# Deploy Audiosen on Google Cloud Run

This is the fastest production path for your Next.js app with API routes.

## 1) Prerequisites

- Google Cloud project created
- Billing enabled
- `gcloud` CLI installed and authenticated
- Domain ready (optional, recommended)

## 2) Set project and region

```powershell
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud config set run/region asia-south1
```

## 3) Enable required services

```powershell
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## 4) Deploy from source

Run this in `C:\Users\vivek\audiosen\audiosen-web`:

```powershell
gcloud run deploy audiosen-web `
  --source . `
  --allow-unauthenticated `
  --port 8080 `
  --set-env-vars "SMTP_HOST=smtp.gmail.com,SMTP_PORT=465,SMTP_SECURE=true,SMTP_USER=vivekshivaliya@gmail.com,MAIL_FROM=Audiosen <vivekshivaliya@gmail.com>,MAIL_TO=vivekshivaliya@gmail.com" `
  --set-secrets "SMTP_PASS=SMTP_PASS:latest"
```

## 5) Store SMTP password securely

```powershell
echo -n "YOUR_GMAIL_APP_PASSWORD" | gcloud secrets create SMTP_PASS --data-file=-
gcloud secrets add-iam-policy-binding SMTP_PASS --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
gcloud services enable secretmanager.googleapis.com
```

If secret already exists, use:

```powershell
echo -n "YOUR_GMAIL_APP_PASSWORD" | gcloud secrets versions add SMTP_PASS --data-file=-
```

## 6) Map custom domain

```powershell
gcloud run domain-mappings create --service audiosen-web --domain www.audiosen.com
```

Then add the DNS records shown by Google.

## 7) Verify

- Open Cloud Run URL
- Submit contact form
- Confirm:
  - enquiry mail reaches `vivekshivaliya@gmail.com`
  - patient mail reaches submitted patient address
