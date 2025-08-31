# Story 2.1: InChurch API Client

## Epic
Epic 2: InChurch Integration & Data Sync

## Story Description
As a church leader, I want the system to connect with the InChurch API so that I can automatically sync member data from our church management system.

## Acceptance Criteria

### Core API Client
- [ ] Create InChurch API client with authentication
- [ ] Handle API rate limiting and error retry logic
- [ ] Support for both production and sandbox environments
- [ ] Proper error handling and logging

### Data Fetching
- [ ] Fetch organization/church details
- [ ] Fetch member/people data with pagination
- [ ] Fetch member groups and categories
- [ ] Support for filtering by date ranges (last updated)

### Configuration Management
- [ ] Secure API key storage and rotation
- [ ] Environment-based configuration (dev/prod)
- [ ] Connection testing and validation
- [ ] API health check endpoints

### Error Handling
- [ ] Graceful handling of API downtime
- [ ] Retry logic with exponential backoff
- [ ] Comprehensive error logging
- [ ] User-friendly error messages

## Technical Requirements

### API Client Architecture
- TypeScript-first implementation
- Axios for HTTP requests with interceptors
- Zod schemas for API response validation
- Environment variable configuration

### Security
- API keys stored in environment variables
- Request signing/authentication as required by InChurch
- HTTPS-only communication
- Rate limiting respect

### Performance
- Request caching for frequently accessed data
- Pagination handling for large datasets
- Connection pooling and timeout configuration
- Memory-efficient data streaming for large responses

## Implementation Notes

### InChurch API Endpoints (Assumed)
- `GET /api/v1/organizations/{id}` - Organization details
- `GET /api/v1/organizations/{id}/members` - Member list with pagination
- `GET /api/v1/organizations/{id}/groups` - Member groups/categories
- `GET /api/v1/health` - API health check

### Data Transformation
- Map InChurch member fields to our Person schema
- Handle different data formats and optional fields
- Normalize phone numbers and email addresses
- Convert dates to consistent format

## Files to Create/Modify

### New Files
- `src/lib/inchurch/api-client.ts` - Main API client
- `src/lib/inchurch/types.ts` - InChurch API types
- `src/lib/inchurch/config.ts` - Configuration management
- `src/lib/inchurch/errors.ts` - Custom error classes
- `src/lib/inchurch/transforms.ts` - Data transformation utilities

### Environment Variables
- `INCHURCH_API_KEY` - API authentication key
- `INCHURCH_API_URL` - Base API URL (prod/sandbox)
- `INCHURCH_RATE_LIMIT_REQUESTS` - Rate limit configuration
- `INCHURCH_RATE_LIMIT_WINDOW` - Rate limit time window

## Testing Strategy
- Unit tests for API client methods
- Mock API responses for consistent testing
- Integration tests with InChurch sandbox
- Error scenario testing (network failures, rate limits)

## Dependencies
- axios - HTTP client
- zod - Schema validation
- node-cache - Response caching
- exponential-backoff - Retry logic

## Success Metrics
- Successful connection to InChurch API
- Data fetching with proper error handling
- Rate limiting compliance
- Comprehensive logging for debugging

## Related Stories
- Story 2.2: Data Sync System (depends on this)
- Story 2.3: Webhook Handler (independent)
- Story 2.4: Manual CRUD for Churches (fallback when API unavailable)