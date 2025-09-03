# Nexora Server

This is the backend server for the Nexora Project Management System.

## Features
- Express.js REST API
- CORS enabled for frontend communication
- Example routes: `/` and `/api/hello`
- Ready for MySQL integration

## Setup
1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the server:
   ```sh
   node index.js
   ```
3. The server runs on [http://localhost:3000](http://localhost:3000)

## API Endpoints
- `GET /` — Returns a welcome message
- `GET /api/hello` — Returns a JSON hello message

## Next Steps
- Add more API routes for your app features
- Connect to MySQL for data storage
- Implement authentication and authorization

## Project Structure
```
server/
  index.js         # Main server file
  package.json     # Backend dependencies
  README.md        # This documentation
```

---
For frontend setup, see `client/README.md`.
