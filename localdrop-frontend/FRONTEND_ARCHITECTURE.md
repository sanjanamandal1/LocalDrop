# LocalDrop Frontend Architecture

## Backend Models

- `users`: authentication identity with `role` as `creator`, `business`, or `admin`.
- `creator_profiles`: creator public profile, geo location, payout details, earnings counters.
- `business_profiles`: business public profile, location, social links, payout details, verification.
- `campaigns`: business-owned offer, budget, geo radius, validity, status, denormalized stats.
- `campaign_creators`: creator joins a campaign.
- `qr_codes`: one QR per creator per campaign, with scan and claim counters.
- `redemptions`: public claim and business confirmation lifecycle.
- `earnings`: one row per confirmed redemption.
- `payouts`: creator withdrawal requests.
- `disputes`: business/admin dispute workflow.

## API Map

- Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`.
- Campaigns: `POST /campaigns`, `GET /campaigns/business/mine`, `GET /campaigns/creator/mine`, `GET /campaigns/nearby`, `GET /campaigns/:id`, `PUT /campaigns/:id`, `PATCH /campaigns/:id/status`, `POST /campaigns/:id/join`.
- QR and redemption: `GET /qr/campaign/:campaignId`, `GET /qr/scan/:qrToken`, `POST /qr/claim`, `POST /qr/redeem`, `POST /qr/redeem/manual`.
- Analytics: creator overview/campaigns/heatmap and business overview/campaigns/redemptions/timeline/cities.
- Earnings: creator summary/list/timeline/by-campaign and business earnings summary.
- Payouts: creator eligibility, request, history.
- Profile/settings: creator/business profile get/update, payout method update.

## Page Mapping

- Business dashboard: business overview, timeline, campaigns, cities.
- Business campaigns/create: business campaign list, create, update status.
- Business analytics: business overview, campaign stats, timeline, city chart.
- Business earnings: business earnings summary plus campaign stats.
- Business payouts: payout exposure from analytics and business earnings.
- Business redemptions/redeem: redemptions feed plus scan/manual confirmation.
- Business profile/settings: profile and payout method APIs.
- Creator dashboard: creator overview, joined campaigns, campaign stats, heatmap.
- Creator available/joined campaigns: nearby discovery, join campaign, creator campaigns.
- Creator QR: campaign list plus `GET /qr/campaign/:campaignId`.
- Creator analytics: overview, campaign funnel, heatmap.
- Creator earnings/payouts: earnings APIs and payout request/history.
- Creator profile/settings: profile and payout method APIs.
- Public claim: `GET /qr/scan/:token` and `POST /qr/claim`.

## UI System

The UI follows the screenshots: white SaaS canvas, fixed left sidebar, purple active states, 8px cards, dense metric grids, line/donut charts, tables, and mobile collapse into a top-first stacked layout.
