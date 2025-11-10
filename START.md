# How to Start the Application

## Prerequisites

1. Make sure all dependencies are installed:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`:
   ```env
   # Convex (will be auto-generated)
   CONVEX_DEPLOYMENT=your-deployment-name
   
   # Resend API Key (for email notifications)
   RESEND_API_KEY=your_resend_api_key
   
   # Application URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # Clerk Authentication (if using)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
   CLERK_SECRET_KEY=your_secret
   ```

## Starting the Application

### Option 1: Run Everything Together (Easiest)

Run both Convex and Next.js servers in a single command:

```bash
npm run dev:all
```

This will:
- Start Convex development server (watches for changes)
- Start Next.js + Socket.io server
- Display logs from both services with color-coded prefixes

### Option 2: Run Separately (Recommended for Development)

Run **two processes** in separate terminals for better log visibility:

#### Terminal 1: Start Convex Development Server
```bash
npm run dev:convex
```
or
```bash
npx convex dev
```
This will:
- Start the Convex backend
- Watch for schema and function changes
- Generate API types automatically

#### Terminal 2: Start Next.js + Socket.io Server
```bash
npm run dev:next
```
or
```bash
npm run dev
```
This will:
- Start the Next.js application
- Start the Socket.io server for WebRTC signaling
- Run on http://localhost:3000

## Production Build

For production:

1. Build the Next.js application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. Make sure Convex is deployed to production (not running `convex dev`)

## Troubleshooting

### Port 3000 already in use
Change the port in `server.js` or set `PORT` environment variable:
```bash
PORT=3001 npm run dev
```

### Socket.io connection issues
- Make sure `NEXT_PUBLIC_APP_URL` matches your actual URL
- Check that the Socket.io server is running (check console for "Ready on http://localhost:3000")
- Verify CORS settings in `server.js`

### Convex connection issues
- Make sure `npx convex dev` is running
- Check that `CONVEX_DEPLOYMENT` is set in `.env.local`
- Verify your Convex deployment is active

### WebRTC not working
- Check browser console for errors
- Ensure you've granted camera/microphone permissions
- Verify Socket.io is connected (check Network tab for `/api/socket`)

## Environment Variables Checklist

Before starting, ensure you have:
- ✅ `RESEND_API_KEY` - For sending interview invitation emails
- ✅ `NEXT_PUBLIC_APP_URL` - Your application URL (http://localhost:3000 for dev)
- ✅ Convex deployment configured (auto-generated when you run `npx convex dev`)
- ✅ Clerk keys (if using authentication)

## Accessing the Application

Once both servers are running:
- **Next.js App**: http://localhost:3000
- **Convex Dashboard**: https://dashboard.convex.dev (check your deployment)
- **Socket.io**: Automatically available at http://localhost:3000/api/socket

