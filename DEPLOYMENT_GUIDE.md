# LMS Web Frontend Deployment Guide

## Overview
This guide explains how to configure the `lmsweb` frontend to work with your backend deployed on Render.

## Prerequisites
1. Backend deployed on Render with URL: `https://lms-testenv.onrender.com/` ✅
2. Frontend ready for deployment (Vercel, Netlify, etc.)

## Configuration Steps

### 1. Update Backend URL

#### Option A: Using Environment Variables (Recommended)

Create a `.env` file in your `lmsweb` directory:

```env
# Development
VITE_BACKEND_URL=http://localhost:7000/

# Production (Render)
VITE_BACKEND_URL=https://lms-testenv.onrender.com/
```

#### Option B: Direct Configuration

Edit `lmsweb/src/config/environment.js`:

```javascript
// Your actual Render URL
return "https://lms-testenv.onrender.com/"; // ✅ Your actual Render URL
```

### 2. Environment Detection

The frontend automatically detects the environment:
- **Development**: Uses `localhost:7000`
- **Production**: Uses your Render URL

### 3. CORS Configuration

Your backend already includes CORS configuration for:
- `https://unicode-mu.vercel.app`
- `https://lms.rootments.live`
- `http://localhost:3000`
- `http://localhost:3001`
- `http://localhost:5173`
- `http://localhost:5174`

**If deploying to a new domain, add it to your backend CORS configuration in `backend/server.js`:**

```javascript
app.use(
  cors({
    origin: [
      // ... existing origins
      'https://your-new-frontend-domain.com', // Add your new domain
    ],
    credentials: true,
    // ... rest of config
  })
);
```

### 4. Deployment Checklist

Before deploying:

- [x] Replace `your-app-name.onrender.com` with your actual Render URL ✅
- [ ] Test API calls locally with the new configuration
- [ ] Ensure all environment variables are set correctly
- [ ] Verify CORS is configured for your frontend domain

### 5. Testing

Test your configuration:

```javascript
// In browser console
import('./src/api/api.js').then(({ lmswebAPI }) => {
  // Test a simple API call
  lmswebAPI.getAllUsers().then(data => {
    console.log('✅ API working:', data);
  }).catch(error => {
    console.error('❌ API failed:', error);
  });
});
```

### 6. Troubleshooting

#### Common Issues:

1. **CORS Error**: Add your frontend domain to backend CORS configuration
2. **404 Error**: Verify your Render URL is correct
3. **Connection Timeout**: Check if your Render service is running
4. **Environment Variables**: Ensure `.env` file is in the correct location

#### Debug Mode:

Enable debug logging by checking browser console for:
- `🌐 Using production backend:`
- `🌐 Making API call to:`
- `✅ API call successful`

## File Structure

```
lmsweb/
├── src/
│   ├── api/
│   │   └── api.js          # Main API configuration
│   └── config/
│       └── environment.js  # Environment detection
├── .env                    # Environment variables (create this)
└── DEPLOYMENT_GUIDE.md     # This file
```

## Quick Setup Commands

```bash
# 1. Create environment file
echo "VITE_BACKEND_URL=https://lms-testenv.onrender.com/" > lmsweb/.env

# 2. Test locally
cd lmsweb
npm run dev

# 3. Build for production
npm run build
```

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify Render service is running
3. Test API endpoints directly in browser
4. Check CORS configuration in backend
