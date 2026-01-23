## 1. Docker Compose Setup
- [x] 1.1 Create vibe-kanban service with node:20-slim image
- [x] 1.2 Configure PORT environment variable and npx command
- [x] 1.3 Create vk test runner service with denoland/deno:latest image
- [x] 1.4 Configure container dependencies and volume mounts

## 2. Config Enhancement
- [x] 2.1 Add VK_API_URL environment variable support to loadConfig
- [x] 2.2 Update test helper to use shared config

## 3. Test Reliability
- [x] 3.1 Remove checkServerAndSkipIfUnavailable from api_integration_test.ts
- [x] 3.2 Remove checkServerAndSkipIfUnavailable from repository_resolver_integration_test.ts
- [x] 3.3 Remove unused isServerAvailable from test-server.ts
