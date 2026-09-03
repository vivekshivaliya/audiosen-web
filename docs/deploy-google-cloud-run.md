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
  --set-env-vars "AZURE_COMMUNICATION_EMAIL_SENDER=support@audiosen.com" `
  --set-secrets "AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING=AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING:latest"
```

## 5) Store the ACS fallback credential securely

```powershell
echo -n "YOUR_ACS_CONNECTION_STRING" | gcloud secrets create AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING --data-file=-
gcloud secrets add-iam-policy-binding AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
gcloud services enable secretmanager.googleapis.com
```

If secret already exists, use:

```powershell
echo -n "YOUR_ACS_CONNECTION_STRING" | gcloud secrets versions add AZURE_COMMUNICATION_EMAIL_CONNECTION_STRING --data-file=-
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
  - staff enquiry mail reaches `vivekshivaliya10@gmail.com`
  - patient mail reaches submitted patient address
  - patient-facing messages are sent by the verified provider sender `support@audiosen.com` and use `contactaudiosen@gmail.com` as their public reply-to address
