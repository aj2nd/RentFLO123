# RentFLO Billing Caps and Usage Alerts

## Scope and recommended order

This guide covers the billable services found in RentFLO’s production source: **Railway** for hosting and PostgreSQL, **OpenAI** for the authenticated chatbot, **Didit** for KYC verification, and **Cashfree** for payment processing. Google OAuth is used for sign-in, but the current application does not call a paid Google API. The Leegality backend integration was removed, and Web Push uses VAPID rather than a paid email or messaging provider.

Set up a dedicated mailbox or alias such as `billing@yourdomain` first, and add it as a recipient wherever a provider permits multiple recipients. This creates a record independent of a single administrator’s inbox.

| Service | Billing exposure in RentFLO | Hard cap available? | Early-alert support | Priority |
| --- | --- | --- | --- | --- |
| Railway | Application, database, storage, egress | **Yes**; stops workloads at the limit | **Yes**; custom email alert plus 75%, 90%, and 100% hard-limit reminders | First |
| OpenAI API | `gpt-4o-mini` chatbot calls | **Yes**; organization and project hard spend limits | **Yes**; configurable spend alerts | First |
| Didit | KYC-session and status-provider calls | **Practical prepaid cap**; disable auto-refill and credits eventually run out | Balance endpoint and auto-refill status; provider documents failed-auto-refill email | Second |
| Cashfree Payment Gateway | Payment-processing fees and API usage | No documented dollar billing cap for Payment Gateway | **Yes**; payment-success, API-error, and rate-limit alerts | Second |

## 1. Railway: set the infrastructure ceiling

Railway supports a **custom email alert** and a **hard compute limit** at the workspace level. Its hard limit is a true protection: it takes workloads offline after the billing-cycle usage reaches the amount, preventing more resource charges. This means the hard amount must be high enough to avoid a preventable RentFLO outage, but low enough to bound the invoice.[1]

1. On iPhone, open [Railway Workspace Usage](https://railway.com/workspace/usage) and select the workspace that owns RentFLO.
2. Tap **Set Usage Limits** under **Compute Usage**.
3. Set a **Custom email alert** at roughly **50–60%** of your monthly infrastructure budget.
4. Set the **Hard limit** at your absolute maximum permitted monthly infrastructure cost, normally at least 20% above your expected monthly Railway usage.
5. Save the change. Railway sends additional reminders at 75%, 90%, and 100% of the hard limit; at 100%, workloads are taken offline.[1]
6. In each service, review **Settings → Deploy → Replica Limits**. This is useful for controlling CPU and RAM exposure per replica, but setting it too low can crash the service.[1]

> **Starting point:** if you have not measured a full billing month, use a low soft alert and a hard limit that you can comfortably approve without interrupting production. Review the limit after the first complete month rather than guessing a permanent number.

## 2. OpenAI API: use both project and organization controls

RentFLO’s chatbot makes OpenAI API calls from the server only. OpenAI supports alerts and hard monthly spend limits at both the organization and project levels. A hard limit causes affected API requests to return `429` after the tracked spend reaches the cap; enforcement can lag slightly, so a small overage is still possible.[2]

1. Open [Organization limits](https://platform.openai.com/settings/organization/limits) in the API Platform.
2. Under **Spend**, choose **Edit spend limit**.
3. Set an organization-wide **Monthly spend limit** as a backstop across every OpenAI project.
4. Turn on **Enforce a hard limit** and save.
5. Open the RentFLO project in [Project settings](https://platform.openai.com/settings/), select **Limits**, and repeat the process with a lower project-specific hard limit.
6. Add spend alerts at **50%**, **80%**, and **95%** of the project limit. OpenAI keeps alerts active when a hard limit exists, so you receive notice before traffic is stopped.[2]
7. In the same project, restrict model access to only the models RentFLO needs and use a project-scoped service-account key. OpenAI’s project controls support both model usage restrictions and project-scoped keys.[3]

The project cap protects RentFLO’s chatbot; the organization cap protects you if a different project or key is created later. RentFLO already has a server-side chatbot cap of **3 requests per verified account per 15 minutes**, plus an IP backstop, so the billing limit is a second, independent layer.

## 3. Didit: treat prepaid credit as the KYC spending boundary

Didit uses prepaid USD credits. Its documented balance endpoint returns the organization-wide balance plus `auto_refill_enabled`, refill amount, and refill threshold. Auto-refill is configured under **Console → Billing** and charges the saved payment method when the balance falls below the threshold.[4]

1. Open the Didit Business Console and go to **Billing**.
2. For the strictest spending ceiling, **turn auto-refill off** and purchase only the credit balance you are willing to spend. When the balance is exhausted, new paid verification work cannot continue until you top up.
3. If uninterrupted KYC is more important than a strict ceiling, enable auto-refill only after setting a small **refill amount** and a **threshold** that represents your operating reserve. Remember that every automatic refill is a charge.
4. Check the available balance at least weekly while volume is low. If you need automatic early warning, monitor the documented `GET /v3/billing/balance/` endpoint from a secure server-side job and alert when the balance falls below your chosen reserve; never expose the Didit API key in the browser.[4]
5. Treat a failed auto-refill email as an incident: Didit documents an email to organization contacts for each declined automatic recharge, followed by a pause after two consecutive failures.[5]

RentFLO also limits Didit creation to **3 KYC starts per verified account per hour**, with additional IP and polling controls. This prevents a user from translating repeated client requests into uncontrolled verification-provider use.

## 4. Cashfree Payment Gateway: configure operational alerts, not a vendor spend cap

Cashfree’s official Payment Gateway documentation confirms alerting for API performance, payment-success rate, and API-rate-limit pressure. It does **not** document a merchant-facing dollar spend cap for Payment Gateway fees, so treat its alerting and RentFLO’s server-side order limits as the primary safeguards.[6] [7]

1. Sign in to the [Cashfree Merchant Dashboard](https://merchant.cashfree.com/auth/login).
2. Go to **Payment Gateway → Settings → Notifications → Success Rate Alerts**. Add an alert for a payment success rate below your normal baseline; a sensible initial operational rule is a drop below **85%** over a short window, then tune it after observing actual traffic.[7]
3. Go to **Payment Gateway → Developers → API Logs and Alerts → Alerts**. Create:
   - a **Rate Limit Warning** for Cashfree order and payment lookup endpoints;
   - an **API Alert** for recurring 4XX or 5XX outcomes; and
   - at least a medium/high-severity rule with all required billing/operations recipients.
4. Test each alert after creation; Cashfree supports alert testing and allows multiple recipients through communication preferences.[6]
5. Review **Developers → Rate Limits** weekly during launch. Cashfree exposes rate, latest usage, average usage, burst, request-count, and violation metrics there.[8]

RentFLO now limits Cashfree order creation to **3 requests per verified account per 15 minutes** and provider verification to **10 per verified account per 15 minutes**, with IP backstops. Do not request a Cashfree rate-limit increase until real merchant traffic demonstrates a need.

### Optional: Cashfree Payouts, only if you enable it later

The current RentFLO code uses Payment Gateway, not Cashfree Payouts. If you later activate Payouts, use **Payouts → Settings → Email Notifications** to enable low-balance threshold emails, transfer reports, and credit-confirmation emails; Cashfree supports up to ten email recipients per category.[9]

## 5. Review rhythm and incident actions

Create a recurring 10-minute weekly review for the first two months. Compare Railway usage, OpenAI project usage, Didit credit balance, and Cashfree rate-limit metrics against the thresholds above. If a hard limit is reached, treat that as a service-impacting incident: Railway will stop workloads, while OpenAI returns `429` errors to affected API requests.[1] [2]

| Signal | Immediate action |
| --- | --- |
| Railway soft alert | Check usage by service; reduce idle resource size or egress; decide whether the hard limit remains appropriate. |
| OpenAI 80% alert | Inspect project usage and Chatbot 429s; keep hard limit unless a deliberate budget increase is approved. |
| Didit low balance or refill failure | Pause KYC promotion, investigate volume, and only make a deliberate manual top-up or revise refill settings. |
| Cashfree rate or success-rate alert | Check API logs and checkout health; do not increase provider limits until the cause is understood. |

## References

[1]: https://docs.railway.com/pricing/cost-control "Railway Cost Control"
[2]: https://developers.openai.com/api/docs/guides/spend-limits "OpenAI API Spend Limits"
[3]: https://help.openai.com/en/articles/9186755-managing-projects-in-the-api-platform "Managing Projects in the OpenAI API Platform"
[4]: https://docs.didit.me/management-api/billing/balance "Didit Get Credit Balance"
[5]: https://docs.didit.me/getting-started/pricing "Didit Pricing and Auto-Recharge FAQ"
[6]: https://www.cashfree.com/docs/payments/online/go-live/api-logs "Cashfree API Logs and Metrics"
[7]: https://www.cashfree.com/docs/payments/manage/monitor "Cashfree Monitoring and Observability"
[8]: https://www.cashfree.com/docs/api-reference/payments/rate-limits "Cashfree API Limits"
[9]: https://www.cashfree.com/docs/payouts/payouts/dashboard/set-email-notifications "Cashfree Payouts Email Notifications"
