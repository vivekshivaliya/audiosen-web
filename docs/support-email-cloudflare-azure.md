# Audiosen support email architecture

This setup gives Audiosen a professional support address without running an
inbound mail server:

- Incoming: `support@audiosen.com` -> Cloudflare Email Routing -> verified owner inbox.
- Outgoing: website or approved mail client -> Azure Communication Services SMTP.
- Public sender: `Audiosen Support <support@audiosen.com>`.

Azure Communication Services Email is outbound-only. Cloudflare Email Routing
forwards messages but does not provide a mailbox or outbound SMTP service.

## Current Azure resources

- Resource group: `audiosen-rg1`
- Communication Service: `audiosen-comms`
- Email Communication Service: `audiosen-email`
- Customer-managed domain: `audiosen.com`

## Azure domain-authentication records

Add these exact records in Cloudflare and keep both DKIM records DNS-only:

| Purpose | Type | Cloudflare name | Value |
| --- | --- | --- | --- |
| Domain ownership | TXT | `@` | `ms-domain-verification=b16eee30-f0b7-4eec-934f-1522f3323d2f` |
| DKIM 1 | CNAME | `selector1-azurecomm-prod-net._domainkey` | `selector1-azurecomm-prod-net._domainkey.azurecomm.net` |
| DKIM 2 | CNAME | `selector2-azurecomm-prod-net._domainkey` | `selector2-azurecomm-prod-net._domainkey.azurecomm.net` |

Only one SPF TXT record is allowed at `@`. When Cloudflare Email Routing is
enabled, the intended combined record is:

```text
v=spf1 include:_spf.mx.cloudflare.net include:spf.protection.outlook.com ~all
```

Remove the obsolete `v=spf1 mx a -all` record when the combined record is
created. Do not publish Azure's SPF value as a second SPF record.

## Cloudflare inbound routing

1. Add and verify the destination Gmail or Outlook address.
2. Create an explicit route from `support@audiosen.com` to that inbox.
3. Create a route from `dmarc@audiosen.com` to the same inbox so DMARC reports
   are received.
4. Keep catch-all disabled initially.
5. Let Cloudflare install its three apex MX records.
6. Remove the old apex MX record that points to `mail.audiosen.com`.
7. Keep all mail-related DNS records DNS-only.

## Azure outbound SMTP

After the Azure domain shows verified for Domain, SPF, DKIM, and DKIM2:

1. Connect the email domain to `audiosen-comms`.
2. Create a Microsoft Entra application and client secret.
3. Assign the least-privilege Azure Communication Email SMTP role.
4. Create an SMTP Username linked to the Entra application.
5. Create or approve `support@audiosen.com` as a MailFrom sender.
6. Configure the Azure Web App with these settings:

```text
SMTP_HOST=smtp.azurecomm.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<Azure SMTP Username>
SMTP_PASS=<Entra client-secret value>
MAIL_FROM=Audiosen Support <support@audiosen.com>
MAIL_TO=<verified forwarding inbox>
```

Store the SMTP password only in Azure App Service configuration or Key Vault.
Never commit it to Git.

## Verification checklist

- Receive an external test at `support@audiosen.com` in the destination inbox.
- Send an Azure SMTP test from `support@audiosen.com` to an unrelated inbox.
- Confirm SPF, DKIM, and DMARC pass in the received message headers.
- Submit the website contact form and confirm both the owner notification and
  customer confirmation arrive.
- Reply through the approved `support@audiosen.com` send-as configuration and
  confirm the recipient sees the support address, not the private inbox.
