# Power-flavours Redirect Service

Minimal backend for managing affiliate product links with redirect capability.

## Features

- 🔗 **Smart redirects** with UTM tracking
- 🛡️ **Affiliate support** (Skimlinks ready)
- 📊 **Click logging** for analytics
- 🔒 **Admin API** with bearer token auth
- ⚡ **Link health checks** to detect broken links
- 💾 **SQLite database** for persistence

## Quick Start

### Installation

```bash
cd /app/redirect-service
yarn install
```

### Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=3001
ADMIN_TOKEN=your-secret-token-here
AFFIL_MODE=off              # or 'skimlinks'
AFFIL_ID=                   # your Skimlinks ID
BASE_URL=http://localhost:3001
ALLOWED_ORIGIN=http://localhost:3000
```

### Seed Database

```bash
yarn seed
```

### Run Development Server

```bash
yarn dev
```

### Run Tests

```bash
yarn test
```

### Build for Production

```bash
yarn build
yarn start
```

## API Endpoints

### Public Endpoints

#### `GET /go/:mappingId`

Redirects to the product link.

**Example:**
```bash
curl -L http://localhost:3001/go/sodastream-pepsi-440ml
```

**Response:** 302 redirect to product URL with UTM parameters

**Fallback:** If no active option, redirects to category page

#### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "db": true
}
```

### Admin Endpoints (Require `Authorization: Bearer <ADMIN_TOKEN>`)

#### `POST /admin/mapping`

Create or update a mapping with options.

**Request:**
```json
{
  "mapping": {
    "id": "sodastream-cola-440ml",
    "name": "SodaStream Cola 440 ml",
    "ean": "1234567890"
  },
  "options": [
    {
      "id": "opt_cola_power",
      "supplier": "power",
      "title": "SodaStream Cola 440 ml",
      "url": "https://www.power.dk/product/...",
      "status": "active",
      "priceLastSeen": 39.95
    }
  ]
}
```

**Response:**
```json
{
  "mapping": { "id": "...", "name": "...", "ean": "..." },
  "options": [{ "id": "...", "mappingId": "...", ... }]
}
```

#### `GET /admin/mapping/:id`

Get mapping with all options.

**Example:**
```bash
curl -H "Authorization: Bearer dev-token" \
  http://localhost:3001/admin/mapping/sodastream-pepsi-440ml
```

#### `PATCH /admin/option/:id`

Update an option (e.g., change status, URL, or price).

**Request:**
```json
{
  "status": "inactive",
  "priceLastSeen": 42.50
}
```

**Response:**
```json
{
  "id": "opt_pepsi_power",
  "status": "inactive",
  "priceLastSeen": 42.50,
  ...
}
```

#### `POST /admin/link-health`

Check all active links and deactivate broken ones.

**Example:**
```bash
curl -X POST \
  -H "Authorization: Bearer dev-token" \
  http://localhost:3001/admin/link-health
```

**Response:**
```json
{
  "changed": [
    {
      "id": "opt_broken",
      "url": "https://...",
      "status": 404,
      "reason": "HTTP error"
    }
  ]
}
```

## Database Schema

### `mapping`
- `id` (TEXT, PK): Unique identifier (e.g., "sodastream-pepsi-440ml")
- `name` (TEXT): Display name
- `ean` (TEXT): Optional EAN/barcode

### `option`
- `id` (TEXT, PK): Unique identifier
- `mappingId` (TEXT, FK): Reference to mapping
- `supplier` (TEXT): Supplier name (e.g., "power")
- `title` (TEXT): Product title at supplier
- `url` (TEXT): Product URL
- `status` (TEXT): "active" or "inactive"
- `priceLastSeen` (REAL): Last observed price (optional)
- `updatedAt` (TEXT): ISO timestamp

### `click`
- `id` (TEXT, PK): Unique identifier
- `mappingId` (TEXT): Reference to mapping
- `ts` (TEXT): ISO timestamp
- `userAgent` (TEXT): User agent string
- `referer` (TEXT): Referer URL

## Affiliate Integration

### Skimlinks

Set in `.env`:
```env
AFFIL_MODE=skimlinks
AFFIL_ID=your-skimlinks-id
```

Links will be automatically wrapped:
```
https://go.skimresources.com/?id=YOUR_ID&url=ENCODED_PRODUCT_URL
```

### Other Networks

To add Sovrn or other networks, modify `wrapAffiliate()` in `src/routes/go.routes.ts`.

## Usage in App

### Add "Buy" Button

```tsx
// In your React component
<button
  onClick={() => window.open(`${REDIRECT_API}/go/sodastream-pepsi-440ml`, '_blank')}
>
  Køb hos Power
</button>
```

### Category Link

```tsx
<button
  onClick={() => window.open(`${REDIRECT_API}/go/power-flavours-category`, '_blank')}
>
  Se alle smage
</button>
```

## Rate Limiting

- Admin endpoints: **30 requests/minute** per IP
- Public endpoints: No limit

## Acceptance Criteria ✅

1. ✅ `GET /go/sodastream-pepsi-440ml` returns 302 to Power product link
2. ✅ `PATCH /admin/option/:id` can deactivate option, causing fallback redirect
3. ✅ `POST /admin/mapping` creates/updates mapping + options
4. ✅ `POST /admin/link-health` deactivates broken links
5. ✅ 6 Jest tests pass
6. ✅ README with setup instructions

## Development

### Project Structure

```
redirect-service/
├── src/
│   ├── db.ts                 # Database setup
│   ├── index.ts              # Express app
│   ├── seed.ts               # Seed script
│   ├── middleware/
│   │   └── auth.ts           # Auth middleware
│   ├── routes/
│   │   ├── admin.routes.ts   # Admin endpoints
│   │   └── go.routes.ts      # Redirect endpoint
│   └── services/
│       └── db.service.ts     # Database operations
├── tests/
│   └── redirect.test.ts      # Integration tests
├── seed.json                 # Seed data
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT
