# LeaseWell - Property Management Portal

A modern, full-featured property management web application built with React, Vite, and Tailwind CSS.

## Features

### 🔐 Authentication
- Separate login flows for **Landlords** and **Tenants**
- Role-based dashboard views
- Secure authentication UI (ready for backend integration)

### 📋 Lease Tracking
- Dashboard with active leases overview
- Lease end dates and expiration alerts
- Rent amounts and payment status
- Add, edit, and delete lease records

### 📄 Document Management
- Upload PDF lease agreements
- View and download documents
- Document categorization (Lease, Inspection, Insurance, Other)
- Property-specific document organization

### 🔧 Maintenance Requests
- Tenant maintenance request submission form
- Photo upload capability for issue documentation
- Priority levels (Low, Medium, High)
- Status tracking (Pending, In Progress, Completed)
- Landlord management dashboard

### 💳 Rent Collection
- Stripe-like payment UI integration
- Credit card and bank transfer options
- Payment history tracking
- Upcoming payment reminders
- Real-time payment status updates

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
cd property-portal
npm install
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The build output will be in the `dist` folder.

## Deployment Options

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project at vercel.com
3. Vercel auto-detects Vite and deploys

Or use CLI:
```bash
npm i -g vercel
vercel
```

### Netlify

1. Push code to GitHub
2. Connect repo at netlify.com
3. Build command: `npm run build`
4. Publish directory: `dist`

### Docker

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Project Structure

```
property-portal/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Integrating Real Stripe Payments

Replace the mock payment with real Stripe:

```jsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_your_key');
```

## Demo Credentials

Enter any email/password to log in with mock data.

- **Landlord View**: Toggle to "Landlord" and sign in
- **Tenant View**: Toggle to "Tenant" and sign in

## Technologies

- React 18 - UI framework
- Vite - Build tool
- Tailwind CSS - Styling
- Lucide React - Icons
