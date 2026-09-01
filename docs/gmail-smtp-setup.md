# Gmail SMTP setup (retired)

Gmail SMTP and application passwords are no longer supported by the website. Do not add `SMTP_*`, `GMAIL_*`, `MAIL_FROM`, or `MAIL_TO` values to a deployment.

Outbound website mail is asynchronous and uses the transactional PostgreSQL outbox plus the Azure Communication Services Email SDK. Configure the managed-identity deployment described in [`backend-admin-foundation.md`](./backend-admin-foundation.md#email-outbox). The staff recipient is fixed in application code as `vivekshivaliya10@gmail.com`, while the verified public sender is `support@audiosen.com`.

Revoke any historical Gmail application password that was created for the website and remove it from every secret store.
