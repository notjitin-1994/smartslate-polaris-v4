# Logging System Documentation

## Overview

Comprehensive structured logging system for the SmartSlate Perplexity Dynamic Questionnaire feature.

## Features

- ✅ **Structured Logging**: JSON-formatted logs with metadata
- ✅ **Multiple Log Levels**: debug, info, warn, error
- ✅ **Service Categorization**: Organize logs by service (perplexity, ollama, database, etc.)
- ✅ **Automatic Scrubbing**: Removes sensitive data (API keys, passwords)
- ✅ **Query & Filter**: Advanced log querying with multiple filters
- ✅ **Export**: JSON, CSV, and plain text export formats
- ✅ **Statistics**: Real-time metrics and analytics
- ✅ **Web UI**: Beautiful logs viewer at `/logs`

## Quick Start

### Basic Usage

```typescript
import { logger } from '@/lib/logging';

// Simple logging
logger.info('perplexity.request', 'Generating dynamic questions', {
  blueprintId: '123',
  userId: 'user-456',
});

// With duration tracking
const endTimer = logger.startTimer('perplexity.request', 'Generating questions');
// ... do work ...
endTimer(); // Automatically logs completion with duration

// Error logging
try {
  await someOperation();
} catch (error) {
  logger.error('operation.failure', 'Operation failed', { error });
}

// Automatic error handling
await logger.withLogging(
  'database.save',
  'Saving questions',
  async () => {
    await saveToDatabase(data);
  },
  { blueprintId: '123' }
);
```

### Service-Specific Logger

```typescript
import { createServiceLogger } from '@/lib/logging';

// Create logger for specific service
const perplexityLogger = createServiceLogger('perplexity');

perplexityLogger.info('request', 'Starting generation', {
  model: 'sonar-pro',
  temperature: 0.1,
});
```

## Log Levels

- **debug**: Detailed diagnostic information
- **info**: General informational messages
- **warn**: Warning messages for potentially harmful situations
- **error**: Error messages for failures

## Services

- `perplexity`: Perplexity AI integration
- `ollama`: Ollama fallback system
- `dynamic-questions`: Question generation logic
- `database`: Database operations
- `auth`: Authentication & authorization
- `validation`: Data validation
- `api`: API endpoints
- `ui`: UI components
- `system`: System-level events

## Events

### Perplexity Events

- `perplexity.request` - API request sent
- `perplexity.success` - Successful response
- `perplexity.failure` - Request failed
- `perplexity.timeout` - Request timed out
- `perplexity.retry` - Retrying request

### Ollama Events

- `ollama.fallback.activated` - Fallback triggered
- `ollama.fallback.success` - Fallback succeeded
- `ollama.fallback.failure` - Fallback failed
- `ollama.request` - Ollama request
- `ollama.success` - Successful response
- `ollama.memory_error` - Out of memory

### Dynamic Questions Events

- `dynamic_questions.generation.start` - Started generation
- `dynamic_questions.generation.complete` - Completed generation
- `dynamic_questions.generation.error` - Generation error
- `dynamic_questions.validation.success` - Validation passed
- `dynamic_questions.validation.failure` - Validation failed
- `dynamic_questions.input_type.unknown` - Unknown input type discovered
- `dynamic_questions.input_type.mapped` - Type mapped to known type

### Database Events

- `database.save.start` - Save operation started
- `database.save.success` - Save succeeded
- `database.save.failure` - Save failed
- `database.query.start` - Query started
- `database.query.success` - Query succeeded
- `database.query.failure` - Query failed

## Metadata Fields

Common metadata fields you can include:

```typescript
{
  duration: number; // Operation duration in ms
  model: string; // AI model used
  userId: string; // User ID
  blueprintId: string; // Blueprint ID
  sessionId: string; // Session ID
  tokens: {
    // Token usage
    input: number;
    output: number;
    total: number;
  }
  temperature: number; // Model temperature
  maxTokens: number; // Max tokens
  sectionCount: number; // Number of sections
  questionCount: number; // Number of questions
  inputType: string; // Input type
  mappedType: string; // Mapped type
  error: string; // Error message
  errorStack: string; // Error stack trace
  errorCode: string; // Error code
  fallbackActivated: boolean; // Fallback used
  fallbackReason: string; // Why fallback was used
  attemptNumber: number; // Retry attempt number
}
```

## Logs Viewer UI

Access the logs viewer at: **http://localhost:3000/logs**

Features:

- Real-time log updates (auto-refresh every 5s)
- Filter by level, service, time range
- Search across messages and metadata
- Export logs (JSON, CSV, TXT)
- Statistics dashboard
- Clear logs functionality

## API Endpoints

### GET /api/logs

Query logs with filters:

```
GET /api/logs?level=error&service=perplexity&limit=100
```

Query parameters:

- `level`: Filter by log level (comma-separated)
- `service`: Filter by service (comma-separated)
- `event`: Filter by event (comma-separated)
- `userId`: Filter by user ID
- `blueprintId`: Filter by blueprint ID
- `from`: Start date (ISO timestamp)
- `to`: End date (ISO timestamp)
- `search`: Search query
- `limit`: Number of results (default: 100, max: 1000)
- `offset`: Pagination offset
- `format`: Export format (json, csv, txt)

### DELETE /api/logs

Clear all logs (admin only):

```
DELETE /api/logs
```

## Examples

### Example 1: Perplexity Integration

```typescript
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('perplexity');

export async function generateWithPerplexity(context: any) {
  const endTimer = logger.startTimer('perplexity.request', 'Generating questions with research');

  try {
    logger.info('perplexity.request', 'Sending request to Perplexity', {
      model: 'sonar-pro',
      blueprintId: context.blueprintId,
      temperature: 0.1,
      maxTokens: 16000, // Updated for 10 sections
    });

    const response = await perplexityAPI.generate(context);

    logger.info('perplexity.success', 'Received response from Perplexity', {
      blueprintId: context.blueprintId,
      sectionCount: response.sections.length,
      questionCount: response.sections.reduce((sum, s) => sum + s.questions.length, 0),
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        total: response.usage.total_tokens,
      },
    });

    endTimer();
    return response;
  } catch (error) {
    logger.error('perplexity.failure', 'Perplexity request failed', {
      blueprintId: context.blueprintId,
      error,
      fallbackActivated: true,
    });
    throw error;
  }
}
```

### Example 2: Database Operations

```typescript
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('database');

export async function saveDynamicQuestions(blueprintId: string, questions: any) {
  return await logger.withLogging(
    'database.save',
    'Saving dynamic questions to database',
    async () => {
      const result = await supabase
        .from('blueprint_generator')
        .update({ dynamic_questions: questions })
        .eq('id', blueprintId);

      if (result.error) {
        throw result.error;
      }

      return result;
    },
    {
      blueprintId,
      sectionCount: questions.sections.length,
      questionCount: questions.sections.reduce((sum, s) => sum + s.questions.length, 0),
    }
  );
}
```

### Example 3: Input Type Registry

```typescript
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('dynamic-questions');

export function getInputComponent(type: string) {
  if (registry.has(type)) {
    return registry.get(type);
  }

  // Unknown type
  logger.warn('dynamic_questions.input_type.unknown', 'Unknown input type discovered', {
    type,
  });

  const mappedType = intelligentTypeMapper(type);

  logger.info('dynamic_questions.input_type.mapped', 'Mapped unknown type to fallback', {
    originalType: type,
    mappedType,
  });

  return registry.get(mappedType) || TextInput;
}
```

## Security

The logging system automatically scrubs sensitive data:

- API keys
- Tokens
- Passwords
- Secrets
- Authorization headers
- Cookies
- Session data

All sensitive fields are replaced with `[REDACTED]`.

## Performance

- In-memory storage with configurable max size (default: 10,000 logs)
- Automatic cleanup when exceeding threshold
- Efficient querying with indexed filtering
- Client-side pagination for large log sets
- Minimal performance impact on application

## Development vs Production

### Development

- All logs output to console
- Minimum level: `debug`
- Full metadata displayed

### Production

- No console output (only stored)
- Minimum level: `info` (configurable via `NEXT_PUBLIC_LOG_LEVEL`)
- Sensitive data scrubbed

## Environment Variables

```bash
# Optional: Set minimum log level
NEXT_PUBLIC_LOG_LEVEL=info  # debug | info | warn | error
```

## Best Practices

1. **Use descriptive events**: `perplexity.request` not `request`
2. **Include relevant metadata**: Always add blueprintId, userId when available
3. **Use appropriate levels**: Error for failures, warn for issues, info for normal operations
4. **Measure durations**: Use `startTimer()` for performance tracking
5. **Service loggers**: Create service-specific loggers for better organization
6. **Don't log sensitive data**: The system scrubs known fields, but be cautious
7. **Use structured logging**: Prefer metadata over string interpolation

## Troubleshooting

### Logs not appearing

- Check `NEXT_PUBLIC_LOG_LEVEL` setting
- Verify logger is imported correctly
- Check browser console for errors

### Export not working

- Ensure user is authenticated
- Check browser's download settings
- Verify API endpoint is accessible

### Performance issues

- Reduce auto-refresh interval
- Clear old logs regularly
- Use more specific filters

## Future Enhancements

- [ ] Persistent storage (database)
- [ ] Log retention policies
- [ ] Advanced analytics and visualizations
- [ ] Log aggregation from multiple instances
- [ ] Real-time streaming (WebSocket/SSE)
- [ ] Alert rules and notifications
- [ ] Integration with external monitoring tools
