#!/usr/bin/env node

import { runServer } from './server.js';

// Run the server
runServer().catch((error) => {
  console.error('[MCP Server] Fatal error:', error);
  process.exit(1);
});
