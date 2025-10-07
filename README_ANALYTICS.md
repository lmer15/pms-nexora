# Nexora Resource Analytics System

## Overview

The Nexora Resource Analytics system provides enterprise-grade, business-style 3-tier analytics (Global → Facility → Member) with polished UI, exportable business PDF reports, and production-grade performance.

## Features

### 🎯 Three-Tier Analytics Dashboard
- **Global Analytics**: Organization-wide resource utilization and performance overview
- **Facility Analytics**: Facility-specific metrics, member performance, and workload distribution
- **Member Analytics**: Individual member performance, task timeline, and utilization trends

### 📊 Interactive Charts & Visualizations
- Real-time utilization charts using Recharts
- Member status distribution (Balanced, Caution, Overloaded)
- Workload density calendar heatmap
- Task completion trends and timelines

### 🧠 AI-Powered Insights Engine
- Rule-based insights generation
- Actionable recommendations
- Severity-based alerting system
- Performance trend analysis

### 📄 Business-Grade PDF Reports
- Professional PDF exports for all analytics views
- Executive summary generation
- Chart snapshots and data tables
- Branded report templates

### 🔐 Role-Based Access Control
- Admin: Full access to all analytics
- Owner/Manager: Access to owned/managed facilities
- Member: Access to own analytics and facility overview

## Architecture

### Frontend Structure
```
client/src/
├── components/analytics/
│   ├── global/           # Global analytics components
│   ├── facility/         # Facility analytics components
│   ├── member/           # Member analytics components
│   └── shared/           # Reusable UI components
├── pages/analytics/      # Page components
├── services/             # API service layers
├── utils/                # Utility functions
└── types/                # TypeScript definitions
```

### Backend Structure
```
server/src/
├── routes/analytics.js           # API route definitions
├── controllers/analyticsController.js  # Request handlers
├── services/
│   ├── analyticsAggregator.js    # Data aggregation logic
│   └── pdfGenerator.js           # PDF generation service
└── utils/
    ├── insightsEngine.js         # Insights generation
    └── dateUtils.js              # Date utilities
```

## API Endpoints

### Analytics Data
- `GET /api/analytics/global?range=4w` - Global analytics data
- `GET /api/analytics/facility/:id?range=4w` - Facility analytics data
- `GET /api/analytics/member/:id?range=4w` - Member analytics data

### Export Services
- `GET /api/analytics/export/global?range=4w` - Export global analytics PDF
- `GET /api/analytics/export/facility/:id?range=4w` - Export facility analytics PDF
- `GET /api/analytics/export/member/:id?range=4w` - Export member analytics PDF

### Health Check
- `GET /api/analytics/health` - Service health status

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- MySQL database
- Puppeteer (for PDF generation)

### Installation

1. **Install Dependencies**
   ```bash
   # Client dependencies
   cd client
   npm install recharts lucide-react

   # Server dependencies
   cd ../server
   npm install puppeteer
   ```

2. **Database Setup**
   ```sql
   -- Ensure your database has the required tables:
   -- facilities, facility_members, users, tasks, projects
   -- The analytics system will work with existing data
   ```

3. **Configuration**
   ```bash
   # Update config/analytics-config.json with your settings
   {
     "cache": {
       "ttl": 300,
       "maxSize": 1000
     },
     "export": {
       "timeout": 120,
       "maxFileSize": "50MB",
       "tempDir": "./temp"
     }
   }
   ```

4. **Start the Application**
   ```bash
   # Start the server
   cd server
   npm run dev

   # Start the client (in another terminal)
   cd client
   npm run dev
   ```

## Usage

### Navigation
1. Click "Analytics" in the sidebar to access Global Analytics
2. Click on facility names to drill down to Facility Analytics
3. Click on member names to view Member Analytics
4. Use breadcrumb navigation to move between levels

### Time Range Filtering
- Select from predefined ranges: 1w, 2w, 4w, 8w, 12w
- All charts and data update automatically

### PDF Export
- Click "Export PDF" button on any analytics page
- Reports include executive summary, KPIs, charts, and insights
- Files are automatically downloaded with timestamped names

### Insights
- System automatically generates actionable insights
- Insights are categorized by severity (Critical, High, Medium, Low)
- Each insight includes recommended actions

## Design System

### Color Tokens
- Primary: #1E40AF (Blue)
- Success: #10B981 (Green)
- Warning: #F59E0B (Yellow)
- Danger: #EF4444 (Red)
- Neutral: #334155 (Gray)

### Status Colors
- Balanced: #10B981
- Caution: #F59E0B
- Overloaded: #EF4444

### Typography
- Primary Font: Inter, system-ui, sans-serif
- Headings: 600-700 weight
- Body: 400 weight
- Captions: 500 weight, uppercase, letter-spaced

## Performance Considerations

### Caching
- API responses cached for 5 minutes by default
- Configurable cache TTL in analytics-config.json
- ETag support for efficient client-side caching

### Database Optimization
- Single SQL aggregation queries with GROUP BY
- Avoids N+1 query patterns
- Pagination for large datasets (100+ members)

### PDF Generation
- Server-side chart rendering using Puppeteer
- Background job processing for large reports
- Temporary file cleanup after 24 hours

## Testing

### Unit Tests
```bash
# Test insights engine
npm test -- insightsEngine.test.js

# Test utility functions
npm test -- formatUtils.test.js
```

### Integration Tests
```bash
# Test API endpoints
npm test -- analytics.integration.test.js

# Test PDF generation
npm test -- pdfGenerator.test.js
```

### E2E Tests
```bash
# Test full user workflows
npm test -- analytics.e2e.test.js
```

## Troubleshooting

### Common Issues

1. **Charts not rendering**
   - Ensure Recharts is properly installed
   - Check browser console for JavaScript errors

2. **PDF export failing**
   - Verify Puppeteer installation
   - Check server temp directory permissions
   - Ensure sufficient disk space

3. **Slow performance**
   - Check database query performance
   - Verify cache configuration
   - Monitor memory usage

4. **Access denied errors**
   - Verify user roles and permissions
   - Check facility membership
   - Ensure proper authentication

### Debug Mode
```bash
# Enable debug logging
DEBUG=analytics:* npm run dev
```

## Contributing

### Code Style
- Use TypeScript for type safety
- Follow existing component patterns
- Maintain consistent naming conventions
- Add proper error handling

### Adding New Insights
1. Update `insightsEngine.js` with new rules
2. Add corresponding tests
3. Update documentation

### Adding New Chart Types
1. Create component in appropriate analytics folder
2. Use Recharts for consistency
3. Add responsive design
4. Include accessibility features

## License

This analytics system is part of the Nexora PMS project and follows the same licensing terms.
