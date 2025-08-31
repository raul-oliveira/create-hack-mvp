# Supabase Repository & InChurch Sync Services

This directory contains the database layer and services for the Church Leader Assistant application, built with Supabase and TypeScript.

## Architecture Overview

```
src/lib/
├── supabase/           # Supabase client configuration
│   ├── client.ts      # Browser client
│   ├── server.ts      # Server client
│   ├── middleware.ts  # Authentication middleware
│   ├── repositories/  # Entity-specific repositories
│   │   ├── base.repository.ts           # Base repository with common functionality
│   │   ├── organization.repository.ts   # Organization operations
│   │   ├── leader.repository.ts         # Leader operations
│   │   ├── person.repository.ts         # Person operations
│   │   ├── person-change.repository.ts  # Person change operations
│   │   ├── initiative.repository.ts     # Initiative operations
│   │   ├── initiative-feedback.repository.ts # Feedback operations
│   │   ├── sync-log.repository.ts       # Sync log operations
│   │   └── index.ts                     # Main repository aggregator
│   └── service.ts     # Service factory
├── services/           # Business logic services
│   └── inchurch-sync.service.ts  # InChurch data synchronization
├── types/              # TypeScript type definitions
│   └── database.ts    # Database model types
└── examples/           # Usage examples
    └── usage-examples.ts
```

## Repository Architecture

The system uses a **modular repository pattern** where each entity has its own dedicated repository:

- **BaseRepository**: Abstract base class with common CRUD operations and error handling
- **Entity Repositories**: Specialized repositories for each database entity
- **MainRepository**: Aggregator that provides access to all entity repositories

### Benefits of This Architecture

✅ **Separation of Concerns** - Each repository handles one entity type  
✅ **Maintainability** - Easier to modify specific entity operations  
✅ **Testability** - Can test repositories independently  
✅ **Scalability** - Easy to add new entities and repositories  
✅ **Code Organization** - Clear structure and responsibilities  

## Database Schema

The application uses the following main tables:

- **organizations** - Church organizations
- **leaders** - Cell leaders/users
- **people** - Disciples/people being led
- **people_changes** - Change detection for people data
- **initiatives** - Action items for leaders
- **initiative_feedback** - Feedback on completed initiatives
- **sync_logs** - Logs of data synchronization operations

## Quick Start

### 1. Basic Usage

```typescript
import { createSupabaseService } from '@/lib/supabase/service';

// In a component or hook
const supabaseService = createSupabaseService();

// Get current user's leader profile
const leader = await supabaseService.leaders.getByUserId('user-uuid');

// Get people assigned to this leader
const people = await supabaseService.people.getByLeader(leader.id);
```

### 2. Server-Side Usage

```typescript
import { createServerSupabaseService } from '@/lib/supabase/service';

// In an API route or server component
const supabaseService = await createServerSupabaseService();

// Create a new person
const person = await supabaseService.people.create({
  organization_id: 'org-uuid',
  leader_id: 'leader-uuid',
  name: 'João Silva',
  email: 'joao@email.com',
  sync_source: 'manual',
  profile_data: {}
});
```

### 3. InChurch Synchronization

```typescript
import { InChurchSyncService } from '@/lib/services/inchurch-sync.service';

const inchurchService = new InChurchSyncService();

// Sync people from InChurch
const result = await inchurchService.syncPeopleFromInChurch(orgId, leaderId, peopleData);

console.log(`Synced ${result.synced} people`);
```

## Repository Usage

### Entity-Specific Repositories

Each entity has its own repository with specialized methods:

```typescript
// Organization operations
const org = await supabaseService.organizations.getByName('Minha Igreja');
await supabaseService.organizations.update(org.id, { settings: { theme: 'dark' } });

// Leader operations
const leader = await supabaseService.leaders.getByEmail('lider@igreja.com');
const leadersInOrg = await supabaseService.leaders.getByOrganization(org.id);

// Person operations
const people = await supabaseService.people.getByLeader(leader.id);
const searchResults = await supabaseService.people.search('João', leader.id);

// Initiative operations
const pendingInitiatives = await supabaseService.initiatives.getPending(leader.id);
const overdueInitiatives = await supabaseService.initiatives.getOverdue(leader.id);
const initiativeStats = await supabaseService.initiatives.getStats(leader.id);

// Person change operations
const unprocessedChanges = await supabaseService.personChanges.getUnprocessed(leader.id);
const highPriorityChanges = await supabaseService.personChanges.getHighPriority(leader.id, 8);

// Sync log operations
const syncStats = await supabaseService.syncLogs.getStats(org.id);
const recentFailures = await supabaseService.syncLogs.getRecentFailures(org.id, 7);
```

### Comprehensive Stats

```typescript
// Get comprehensive leader stats
const leaderStats = await supabaseService.getLeaderStats('leader-uuid');
console.log('Leader stats:', leaderStats);

// Get comprehensive organization stats
const orgStats = await supabaseService.getOrganizationStats('org-uuid');
console.log('Organization stats:', orgStats);
```

## Key Features

### Repository Pattern
- **CRUD Operations**: Full Create, Read, Update, Delete operations for all entities
- **Entity Specialization**: Each repository has entity-specific methods and queries
- **Relationship Queries**: Methods to fetch related data efficiently
- **Search & Filtering**: Built-in search and filtering capabilities
- **Error Handling**: Consistent error handling across all operations

### InChurch Sync Service
- **Automatic Change Detection**: Detects changes in people data
- **Change Tracking**: Creates change records with urgency scoring
- **Sync Logging**: Comprehensive logging of all synchronization operations
- **Error Recovery**: Handles sync failures gracefully

### Type Safety
- **Full TypeScript Support**: All database operations are fully typed
- **Insert/Update Types**: Separate types for insert and update operations
- **Relationship Types**: Proper typing for related data queries

## Database Operations

### People Management

```typescript
// Get people by leader
const people = await supabaseService.people.getByLeader('leader-uuid');

// Search people
const results = await supabaseService.people.search('João', 'leader-uuid');

// Create person
const person = await supabaseService.people.create({
  organization_id: 'org-uuid',
  leader_id: 'leader-uuid',
  name: 'Maria Santos',
  email: 'maria@email.com',
  profile_data: {}
});

// Update person
await supabaseService.people.update('person-uuid', {
  phone: '+5511999999999'
});
```

### Initiative Management

```typescript
// Get pending initiatives
const pending = await supabaseService.initiatives.getPending('leader-uuid');

// Create initiative
const initiative = await supabaseService.initiatives.create({
  organization_id: 'org-uuid',
  leader_id: 'leader-uuid',
  person_id: 'person-uuid',
  type: 'follow_up',
  title: 'Weekly Check-in',
  priority: 8
});

// Mark as completed
await supabaseService.initiatives.markCompleted('initiative-uuid');
```

### Change Detection

```typescript
// Get unprocessed changes
const changes = await supabaseService.personChanges.getUnprocessed('leader-uuid');

// Mark change as processed
await supabaseService.personChanges.markAsProcessed('change-uuid');

// Get changes for specific person
const personChanges = await supabaseService.personChanges.getByPerson('person-uuid');
```

## Error Handling

All repository methods throw errors when database operations fail. Handle them appropriately:

```typescript
try {
  const person = await supabaseService.people.getById('uuid');
  // Handle success
} catch (error) {
  if (error.code === 'PGRST116') {
    // Record not found
    console.log('Person not found');
  } else {
    // Other database error
    console.error('Database error:', error);
  }
}
```

## Row Level Security (RLS)

The database uses Supabase RLS policies to ensure data security:

- **Leaders** can only access their own data and assigned people
- **People changes** follow the same access rules as people
- **Initiatives** are restricted to assigned leaders
- **Organizations** have admin-only access for now

## Performance Considerations

- **Indexes**: Database includes performance indexes for common queries
- **Pagination**: Use `limit()` for large result sets
- **Selective Queries**: Only select needed fields when possible
- **Batch Operations**: Use loops for multiple operations (consider batching for very large datasets)

## Development

### Adding New Methods

1. Add the method to the appropriate entity repository
2. Add corresponding types to `database.ts` if needed
3. Update this README with usage examples
4. Add tests if applicable

### Database Schema Changes

1. Update `supabase-schema.sql`
2. Update TypeScript types in `database.ts`
3. Update repository methods as needed
4. Run database migrations

### Adding New Entities

1. Create a new repository class extending `BaseRepository`
2. Add it to the `MainRepository` class
3. Update the service exports
4. Add TypeScript types
5. Update documentation

## Environment Variables

Ensure these environment variables are set:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing

The services can be tested by:

1. **Unit Tests**: Mock the Supabase client
2. **Integration Tests**: Use test database
3. **E2E Tests**: Test full data flow

## Contributing

When adding new features:

1. Follow the existing patterns
2. Add proper TypeScript types
3. Include error handling
4. Add usage examples
5. Update documentation

## Support

For questions or issues:

1. Check the usage examples
2. Review the TypeScript types
3. Check Supabase documentation
4. Review the database schema
