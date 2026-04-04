# Quick Setup Guide

This guide will get Helix running locally in 15 minutes.

## 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# SDK
cd ../sdk
npm install
```

## 2. Setup Environment Variables

Copy `.env.example` to `.env` in backend folder:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with:
- `MONGODB_URI`: localhost:27017/ai-guardian (or Atlas connection)
- `JWT_SECRET`: any random string
- `HUGGINGFACE_API_KEY`: Get from huggingface.co/settings/tokens
- `NODEMAILER_EMAIL` & `NODEMAILER_PASS`: Gmail app password

## 3. Start Local MongoDB

Option A: Docker
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Option B: Local installation
```bash
mongod --dbpath ./data
```

## 4. Run Backend

```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

You should see:
```
🚀 Helix Backend running on port 5000
```

## 5. Run Frontend (new terminal)

```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

Visit http://localhost:3000 → Login with any email/password

## 6. Test Event Ingestion

```bash
curl -X POST http://localhost:5000/events/ingest \
  -H "x-api-key: ag_test-key" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "warning",
    "service": "test-service",
    "message": "Test event",
    "metadata": {}
  }'
```

## 7. View Dashboard

Go to http://localhost:3000

- **Login**: any email + password
- **Dashboard**: Should show metrics and incidents
- **Incidents**: List of detected incidents
- **Status**: Service health
- **Chatbot**: Ask questions about incidents
- **Settings**: API key for SDK integration

## File Structure for Pen Drive

The project is configured to store all cache/temp files locally on the pen drive:

```
e:\AI_guardian\
├── .cache/          ← Playwright browsers & cached data
├── .temp/           ← Temporary files
├── backend/
├── frontend/
├── sdk/
└── [other files]
```

**To clean the pen drive**:
```bash
# Delete cache and temp files to free space
rm -rf .cache
rm -rf .temp

# Then recreate them
mkdir -p .cache .temp
```

These folders are ignored in Git (see `.gitignore`)

## Common Development Commands

```bash
# Backend
npm run dev              # Start dev server
npm run build            # Build for production
npm run start:prod       # Run production build
npm run lint             # Lint code
npm run test             # Run tests

# Frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Run production build
npm run lint             # Lint code

# SDK
npm run build            # Compile TypeScript to dist/
npm publish              # Publish to npm
```

## Testing the Event-Driven Pipeline

1. Start backend
2. Send event via curl (see Step 6)
3. Send 2 more events of same type within 5 minutes
4. Backend should detect pattern and trigger agent chain
5. Check frontend dashboard for incident
6. Should receive email notification

## Database Seed

To pre-populate demo data:

```bash
cd backend
npm run seed
```

Creates realistic incidents for testing.

## Debugging

Check logs:

```bash
# Backend logs
tail -f logs/backend.log

# Frontend browser console
Open http://localhost:3000 → F12 → Console

# Database logs
mongosh --eval "db.events.find().limit(5)"
```

## Next Steps

1. Review the [main README](./README.md) for architecture
2. Read [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
3. Check [SDK README](./sdk/README.md) for integration
4. Review backend modules in `backend/src/modules/`
5. Explore frontend components in `frontend/src/components/`

## Need Help?

- Backend issues: Check `backend/.env` configuration
- Frontend not connecting: Verify `NEXT_PUBLIC_API_URL` environment variable
- Database issues: Check MongoDB connection string
- Email not sending: Verify Gmail app password (not regular password)

---

**Ready to build?** Start with the backend in dev mode and explore the dashboard!
