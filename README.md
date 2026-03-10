# CivicLens

CivicLens is a civic tech platform designed to bridge the gap between citizens and local authorities. It empowers users to easily report community issues (like potholes, broken streetlights, or waste management problems) and tracks their resolution progress in real-time.

## Project Structure

This project is a monorepo containing both the Next.js frontend and the Express.js backend.

- `frontend/`: Contains the Next.js 15 application (React, Tailwind CSS, Leaflet Maps).
- `backend/`: Contains the Node.js/Express.js REST API and MongoDB communication.

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB database)
- Gemini API Key (for automated issue analysis/summaries)

### Running Locally

First, clone the repository and navigate into it.

#### 1. Start the Backend API
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
GEMINI_API_KEY=your_gemini_api_key
AUTHORITY_SECRET=your_secret_for_authority_registration
FRONTEND_URL=http://localhost:3000
```
Then start the server:
```bash
npm start
```
*The backend should now be running on http://localhost:5001*

#### 2. Start the Frontend Application
Open a new terminal window:
```bash
cd frontend
npm install
```
Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```
Then start the Next.js development server:
```bash
npm run dev
```
*The frontend should now be running on http://localhost:3000*

## Features
- **Interactive Mapping**: View all reported issues on a live map.
- **AI Issue Analysis**: Automatically categorizes and summarizes user reports using Google's Gemini API.
- **Authority Dashboard**: A dedicated portal for city officials to review, update, and resolve tasks.
- **User Progression**: Citizens can track the life cycle of their reports from "Pending" to "Resolved".

## Deployment
- **Frontend** is optimized for deployment on [Vercel](https://vercel.com). Remember to configure `NEXT_PUBLIC_API_URL` in your Vercel project settings to point to your live backend.
- **Backend** can be deployed to services like [Render](https://render.com) or [Railway](https://railway.app). Ensure all environment variables are correctly copied to the deployment platform.
