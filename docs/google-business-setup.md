# Google Business Profile: owner-only read and approval setup

Audiosen V1 reads Business Profile data, stages field differences, and copies only fields that an
authenticated Owner explicitly approves into the public `BusinessProfile` record. It does not write
changes to Google.

## External prerequisites

1. Submit the Google project for Business Profile API access and wait for approval. A project can
   show zero quota until Google grants access.
2. Enable My Business Account Management API, My Business Business Information API, and the Google
   My Business API used for verified-location reviews.
3. Create a separate Web OAuth client for the owner grant. Add the exact production callback URI,
   normally `https://audiosen.com/api/admin/google-business/callback`, and the staging callback URI
   to the appropriate staging client. Do not reuse the admin-login client secret in production.
4. Configure Azure Key Vault access for the App Service managed identity. Production refresh tokens
   are stored as Key Vault secrets; the database stores only the secret reference.
5. Confirm the owner Google account has management access to the intended Business Profile.

Required application configuration:

```text
GOOGLE_BUSINESS_CLIENT_ID=
GOOGLE_BUSINESS_CLIENT_SECRET=
GOOGLE_BUSINESS_REDIRECT_URI=https://audiosen.com/api/admin/google-business/callback
GOOGLE_BUSINESS_KEY_VAULT_URL=https://<vault-name>.vault.azure.net/
```

Local development may use a separate 32-byte base64 `GOOGLE_BUSINESS_TOKEN_KEY`. This fallback is
rejected in production.

## First connection and approval

1. Sign in to Audiosen Admin as the allowlisted Owner.
2. Open `/admin/google-business` and start the separate Google Business authorization. The requested
   scope is `https://www.googleapis.com/auth/business.manage`.
3. Select the exact account and location returned by Google. Never identify the profile by guessing
   a name or address.
4. Run a read sync. Review phone, address, regular hours, Maps URI, review URI, timestamp, and every
   difference. A blank or incomplete Google value cannot be approved over website data.
5. Explicitly approve Address and Hours separately. A phone mismatch remains an alert and must not
   silently change the approved public number `8923092563`.
6. Select genuine cached reviews without changing reviewer text. If the API is unavailable or the
   location is unverified, leave the public review section hidden.
7. Check `/review`, structured data, contact pages, and the generated sitemap in staging before a
   production slot swap.

Google provides no Business Profile sandbox. Use recorded fixtures and read-only staging checks; do
not test by changing live profile data. Official references: [basic setup](https://developers.google.com/my-business/content/basic-setup),
[Business Information API](https://developers.google.com/my-business/reference/businessinformation/rest),
and [review data](https://developers.google.com/my-business/content/review-data).
