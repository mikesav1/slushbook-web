# Production Environment Variables

This document lists the environment variables that MUST be set correctly for production deployment on Emergent.

## Backend Service

Set these in the Deployment Settings > Environment Variables for the **backend** service:

```bash
# MongoDB Connection
MONGO_URL=mongodb://mongodb:27017
DB_NAME=flavor_sync

# CORS - Add your production domains
CORS_ORIGINS=https://your-production-domain.com,https://slushbook.itopgaver.dk

# Redirect Service URL - CRITICAL FOR PRODUCTION
REDIRECT_SERVICE_URL=http://redirect-service:3001
```

## Redirect Service

Set these in the Deployment Settings > Environment Variables for the **redirect-service**:

```bash
# Port
PORT=3001

# Admin Token
ADMIN_TOKEN=dev-token-change-in-production

# MongoDB Connection
MONGO_URL=mongodb://mongodb:27017
DB_NAME=flavor_sync

# CORS - Allow production domains
ALLOWED_ORIGIN=https://your-production-domain.com,https://slushbook.itopgaver.dk

# Base URL
BASE_URL=https://your-production-domain.com

# Affiliate Settings
AFFIL_MODE=off
AFFIL_ID=
```

## Frontend Service

Set these in the Deployment Settings > Environment Variables for the **frontend**:

```bash
# Backend API URL - Your production backend URL
REACT_APP_BACKEND_URL=https://your-production-domain.com

# Upgrade URL (if different from default)
REACT_APP_UPGRADE_URL=https://slushbook.dk/upgrade
```

## Important Notes

### 1. Kubernetes Service Names
In Emergent's Kubernetes environment:
- Services communicate using Kubernetes DNS service names
- Use `http://service-name:port` for inter-service communication
- Example: `http://redirect-service:3001`, `http://mongodb:27017`

### 2. Database Naming
- Production uses `flavor_sync` database
- Preview/local uses `slushbook_db` or `test_database`
- Ensure `DB_NAME` is set to `flavor_sync` in production

### 3. Service Discovery
- Backend → Redirect Service: `http://redirect-service:3001`
- Backend → MongoDB: `mongodb://mongodb:27017`
- Frontend → Backend: Use public production URL (set in REACT_APP_BACKEND_URL)

### 4. Deployment Checklist

Before deploying to production:
1. ✅ Set all environment variables in Emergent Deployment Settings
2. ✅ Verify `REDIRECT_SERVICE_URL=http://redirect-service:3001`
3. ✅ Verify `DB_NAME=flavor_sync`
4. ✅ Verify `MONGO_URL=mongodb://mongodb:27017`
5. ✅ Set correct CORS origins for your production domain
6. ✅ Deploy with "Fresh Database" to trigger automatic seeding

### 5. Troubleshooting

If redirect-service fails in production:
- Check deployment logs for "Database seed check" messages
- Verify environment variables are set correctly
- Ensure MongoDB service is running
- Check that redirect-service container started successfully
