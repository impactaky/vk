## 1. API Types
- [x] 1.1 Add ExecutorProfile interface to src/api/types.ts
- [x] 1.2 Add executor profile type with id, name, executor_type fields

## 2. API Client
- [x] 2.1 Add listExecutorProfiles method to src/api/client.ts
- [x] 2.2 Implement GET /api/executor-profiles endpoint call

## 3. Executor Resolution
- [x] 3.1 Create executor resolver utility function
- [x] 3.2 Implement name-to-ID resolution logic
- [x] 3.3 Handle exact name matches
- [x] 3.4 Handle partial name matches with error messages
- [x] 3.5 Handle non-existent executor names

## 4. Attempt Create Command
- [x] 4.1 Update attempt create command in src/commands/attempt.ts
- [x] 4.2 Update --executor option description to mention name or ID
- [x] 4.3 Add executor resolution before API call
- [x] 4.4 Handle resolution errors appropriately

## 5. Executor List Command
- [x] 5.1 Create new executor command in src/commands/executor.ts
- [x] 5.2 Implement list subcommand
- [x] 5.3 Add table output for executor profiles
- [x] 5.4 Add JSON output support
- [x] 5.5 Register executor command in main CLI

## 6. Testing
- [x] 6.1 Test executor resolution with valid names
- [x] 6.2 Test executor resolution with profile IDs
- [x] 6.3 Test error handling for non-existent executors
- [x] 6.4 Test executor list command
- [x] 6.5 Test backward compatibility with existing profile IDs
