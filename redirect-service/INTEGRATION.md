# Integration with Slushice App

## Running the Redirect Service

1. Start the service:
```bash
cd /app/redirect-service
yarn dev
```

Service runs on `http://localhost:3002`

## Adding "Buy" Buttons to Slushice App

### Option 1: In PantryPage (Ingredients List)

Add a "Køb" button next to each ingredient:

```tsx
// In /app/frontend/src/pages/PantryPage.js

<button
  onClick={() => window.open(`http://localhost:3002/go/sodastream-pepsi-440ml`, '_blank')}
  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
>
  Køb
</button>
```

### Option 2: In ShoppingListPage

Add link to buy missing ingredients:

```tsx
// In /app/frontend/src/pages/ShoppingListPage.js

<a
  href={`http://localhost:3002/go/${item.mappingId}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-blue-500 hover:underline"
>
  Køb hos Power
</a>
```

### Option 3: Category Link (All Products)

```tsx
<button
  onClick={() => window.open('http://localhost:3002/go/power-flavours-category', '_blank')}
  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg"
>
  Se alle smagsekstrakter
</button>
```

## Mapping Ingredients to Products

When adding ingredients, you can map them to Power products:

1. Create mapping via API:

```bash
curl -X POST http://localhost:3002/admin/mapping \
  -H "Authorization: Bearer dev-token-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{
    "mapping": {
      "id": "my-ingredient-slug",
      "name": "My Ingredient Name"
    },
    "options": [{
      "id": "opt_unique_id",
      "supplier": "power",
      "title": "Product Title at Power",
      "url": "https://www.power.dk/product/...",
      "status": "active"
    }]
  }'
```

## Environment Configuration

For production, update `.env`:

```env
PORT=3002
ADMIN_TOKEN=your-secure-token-here
AFFIL_MODE=skimlinks        # Enable affiliate
AFFIL_ID=your-skimlinks-id   # Your affiliate ID
BASE_URL=https://redirect.yourdomain.com
ALLOWED_ORIGIN=https://yourdomain.com
```

## Deployment

Deploy as a separate service alongside your Slushice app. Can run on same server or separate.

### Supervisor Config (if running on same server)

Add to `/etc/supervisor/conf.d/redirect.conf`:

```ini
[program:redirect-service]
directory=/app/redirect-service
command=/usr/bin/yarn dev
autostart=true
autorestart=true
stderr_logfile=/var/log/redirect.err.log
stdout_logfile=/var/log/redirect.out.log
```

Then:
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start redirect-service
```

## Analytics

All clicks are logged in the `click` table. Query for analytics:

```sql
SELECT 
  mappingId,
  COUNT(*) as clicks,
  DATE(ts) as date
FROM click
GROUP BY mappingId, DATE(ts)
ORDER BY clicks DESC;
```

## Admin Management

Use the admin API to:
- Add new products
- Update URLs when they change
- Deactivate broken links
- Run link health checks

See README.md for full API documentation.
