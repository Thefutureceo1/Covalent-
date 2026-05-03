# Covalent ⚡

> Browser-based JSON converter. Privacy-first. No server uploads. No database.

Convert JSON to CSV, YAML, XML, SQL, Markdown, and Excel — entirely in your browser. Clerk handles auth. PayPal handles payments. Zero backend infrastructure required.

---

## Stack

- **Vite + React + TypeScript** — frontend build
- **Tailwind CSS** — styling
- **Monaco Editor** — JSON input
- **Clerk** — authentication (Google, GitHub, Email)
- **PayPal JS SDK** — subscription payments
- **SheetJS (xlsx)** — Excel export
- **yaml / xmlbuilder2** — YAML and XML conversion

---

## Quickstart

```bash
# 1. Clone and install
git clone https://github.com/your-username/covalent
cd covalent
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Clerk and PayPal keys

# 3. Run
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | From Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | From Clerk Dashboard → API Keys (server only) |
| `VITE_PAYPAL_CLIENT_ID` | From PayPal Developer Dashboard |
| `VITE_PAYPAL_PLUS_PLAN_ID` | PayPal subscription plan ID for Plus Monthly |
| `VITE_PAYPAL_PLUS_ANNUAL_PLAN_ID` | PayPal subscription plan ID for Plus Annual |
| `VITE_PAYPAL_PRO_PLAN_ID` | PayPal subscription plan ID for Pro Monthly |
| `VITE_PAYPAL_PRO_ANNUAL_PLAN_ID` | PayPal subscription plan ID for Pro Annual |
| `VITE_PAYPAL_PRO_LIFETIME_PLAN_ID` | PayPal plan ID for Pro Lifetime (one-time) |

---

## Clerk Setup

1. Create a Clerk app at [clerk.com](https://clerk.com)
2. Enable **Google** and **GitHub** social login in Clerk Dashboard
3. Copy your **Publishable Key** and **Secret Key** to `.env`
4. To set a user's plan manually (for testing):
   - Clerk Dashboard → Users → Select user → Edit public metadata
   - Set: `{ "plan": "pro", "billing": "monthly", "expires": null }`

---

## PayPal Setup

1. Create a PayPal Developer account at [developer.paypal.com](https://developer.paypal.com)
2. Create a REST app to get your Client ID
3. Create **5 subscription plans** in PayPal Dashboard:

| Plan | Price | Billing |
|---|---|---|
| Plus Monthly | $10.00 | Monthly |
| Plus Annual | $99.00 | Annual |
| Pro Monthly | $20.00 | Monthly |
| Pro Annual | $199.00 | Annual |
| Pro Lifetime | $150.00 | One-time* |

> *PayPal doesn't natively support one-time payments as "subscriptions". For Lifetime, create a plan billed once with no recurrence, or use PayPal Orders API instead.

4. Copy each Plan ID to the corresponding `VITE_PAYPAL_*_PLAN_ID` env variable
5. Update `index.html` — replace `__PAYPAL_CLIENT_ID__` with your actual Client ID, or use Vite's HTML env replacement

---

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel --prod
```

Add all environment variables in Vercel Dashboard → Settings → Environment Variables.

The `/api/update-plan.ts` serverless function deploys automatically.

### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

Move `api/update-plan.ts` to `netlify/functions/update-plan.ts` and update the fetch URL in `PricingModal.tsx` to `/.netlify/functions/update-plan`.

---

## Plan Tier Summary

| Feature | Free | Plus | Pro |
|---|---|---|---|
| CSV, YAML, XML, SQL, Markdown | ✅ | ✅ | ✅ |
| File size limit | 1 MB | 100 MB | 500 MB |
| Daily conversions | 10 | Unlimited | Unlimited |
| Excel (.xlsx) export | ❌ | ✅ | ✅ |
| Batch conversion | ❌ | ❌ | ✅ |
| GeoJSON / JSON-LD / Schema | ❌ | ❌ | ✅ |
| API key access | ❌ | ❌ | ✅ |

---

## Architecture

```
src/
├── components/
│   ├── Header.tsx          # Logo, auth buttons, plan badge
│   ├── EditorPanel.tsx     # Monaco JSON input
│   ├── OutputPanel.tsx     # Converted output + copy/download
│   ├── TabBar.tsx          # Format tabs with lock states
│   ├── Footer.tsx          # Privacy badge + daily usage
│   ├── UpgradeModal.tsx    # Triggered by limit/feature gates
│   ├── PricingModal.tsx    # Full pricing + PayPal buttons
│   └── PayPalButtons.tsx   # PayPal SDK wrapper
├── converters/
│   ├── toCSV.ts
│   ├── toYAML.ts
│   ├── toXML.ts
│   ├── toSQL.ts
│   ├── toMarkdown.ts
│   └── toExcel.ts          # Plus/Pro only
├── hooks/
│   ├── useUserPlan.ts      # Reads Clerk publicMetadata
│   └── useConversionLimit.ts # localStorage daily counter
├── lib/
│   └── utils.ts
├── types.ts
└── App.tsx                 # Main layout + conversion orchestration

api/
└── update-plan.ts          # Serverless: updates Clerk metadata post-payment
```

---

## Privacy

All conversion logic runs in your browser using JavaScript. No JSON data is ever sent to any server. The only network requests made are:

- Clerk auth (login/session)
- PayPal payment processing
- `/api/update-plan` (sends only your Clerk user ID + plan choice after payment)

---

## License

MIT
