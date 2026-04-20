import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { findProjectRoot } from './utils/project-root.js';
import {
  getClaudeMd,
  listPRDs,
  getPRD,
  listCursorRules,
  getCursorRule,
  getProjectOverview,
} from './resources/documentation.js';
import {
  getProjectTree,
  formatFileTree,
  listComponents,
  listAPIRoutes,
  getTechStack,
} from './resources/codebase.js';
import {
  getDatabaseSchema,
  listDatabaseTables,
  getRLSPolicies,
  getKeyTablesInfo,
} from './resources/database.js';
import { searchFiles, searchContent } from './tools/search.js';
import {
  getFileContent,
  getComponentInfo,
  getAPIRouteInfo,
} from './tools/file-operations.js';

/**
 * Create and configure the MCP server
 */
function createServer() {
  const projectRoot = findProjectRoot();

  console.error(`[MCP Server] Project root: ${projectRoot}`);

  const server = new Server(
    {
      name: 'polaris-context',
      version: '1.0.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  // RESOURCES
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'polaris://docs/claude-md',
          name: 'CLAUDE.md',
          description: 'Main development guide for the project',
          mimeType: 'text/markdown',
        },
        {
          uri: 'polaris://docs/overview',
          name: 'Project Overview',
          description: 'High-level project architecture and purpose',
          mimeType: 'text/markdown',
        },
        {
          uri: 'polaris://docs/prds',
          name: 'PRD List',
          description: 'List all Product Requirements Documents',
          mimeType: 'application/json',
        },
        {
          uri: 'polaris://docs/cursor-rules',
          name: 'Cursor Rules List',
          description: 'List all Cursor IDE rule files',
          mimeType: 'application/json',
        },
        {
          uri: 'polaris://structure/tree',
          name: 'Project Tree',
          description: 'Directory structure of the codebase',
          mimeType: 'text/plain',
        },
        {
          uri: 'polaris://structure/components',
          name: 'Components List',
          description: 'All React components in the project',
          mimeType: 'application/json',
        },
        {
          uri: 'polaris://structure/api-routes',
          name: 'API Routes',
          description: 'All API endpoints in the application',
          mimeType: 'application/json',
        },
        {
          uri: 'polaris://tech-stack',
          name: 'Technology Stack',
          description: 'Technologies and frameworks used',
          mimeType: 'application/json',
        },
        {
          uri: 'polaris://database/schema',
          name: 'Database Schema',
          description: 'Database schema from migrations',
          mimeType: 'text/markdown',
        },
        {
          uri: 'polaris://database/tables',
          name: 'Database Tables',
          description: 'List of all database tables',
          mimeType: 'application/json',
        },
        {
          uri: 'polaris://database/rls-policies',
          name: 'RLS Policies',
          description: 'Row Level Security policies',
          mimeType: 'text/markdown',
        },
        {
          uri: 'polaris://database/key-tables',
          name: 'Key Tables Info',
          description: 'Information about main database tables',
          mimeType: 'text/markdown',
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    try {
      if (uri === 'polaris://docs/claude-md') {
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: getClaudeMd(projectRoot),
            },
          ],
        };
      }

      if (uri === 'polaris://docs/overview') {
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: getProjectOverview(projectRoot),
            },
          ],
        };
      }

      if (uri === 'polaris://docs/prds') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(listPRDs(projectRoot), null, 2),
            },
          ],
        };
      }

      if (uri.startsWith('polaris://docs/prd/')) {
        const prdName = uri.replace('polaris://docs/prd/', '');
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: getPRD(projectRoot, prdName),
            },
          ],
        };
      }

      if (uri === 'polaris://docs/cursor-rules') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(listCursorRules(projectRoot), null, 2),
            },
          ],
        };
      }

      if (uri.startsWith('polaris://docs/cursor-rule/')) {
        const ruleName = uri.replace('polaris://docs/cursor-rule/', '');
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: getCursorRule(projectRoot, ruleName),
            },
          ],
        };
      }

      if (uri === 'polaris://structure/tree') {
        const tree = getProjectTree(projectRoot);
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: formatFileTree(tree),
            },
          ],
        };
      }

      if (uri === 'polaris://structure/components') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(listComponents(projectRoot), null, 2),
            },
          ],
        };
      }

      if (uri === 'polaris://structure/api-routes') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(listAPIRoutes(projectRoot), null, 2),
            },
          ],
        };
      }

      if (uri === 'polaris://tech-stack') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(getTechStack(projectRoot), null, 2),
            },
          ],
        };
      }

      if (uri === 'polaris://database/schema') {
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: getDatabaseSchema(projectRoot),
            },
          ],
        };
      }

      if (uri === 'polaris://database/tables') {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(listDatabaseTables(projectRoot), null, 2),
            },
          ],
        };
      }

      if (uri === 'polaris://database/rls-policies') {
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: getRLSPolicies(projectRoot),
            },
          ],
        };
      }

      if (uri === 'polaris://database/key-tables') {
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: getKeyTablesInfo(),
            },
          ],
        };
      }

      throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to read resource: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

  // TOOLS
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'search-files',
          description: 'Search for files matching a glob pattern',
          inputSchema: {
            type: 'object',
            properties: {
              pattern: {
                type: 'string',
                description: 'Glob pattern (e.g., "**/*.tsx", "src/components/**")',
              },
            },
            required: ['pattern'],
          },
        },
        {
          name: 'search-content',
          description: 'Search file contents for a term or regex pattern',
          inputSchema: {
            type: 'object',
            properties: {
              searchTerm: {
                type: 'string',
                description: 'Term or regex pattern to search for',
              },
              filePattern: {
                type: 'string',
                description: 'File pattern to search in (default: **/*.{ts,tsx,js,jsx,md})',
              },
            },
            required: ['searchTerm'],
          },
        },
        {
          name: 'get-file',
          description: 'Get the contents of a specific file',
          inputSchema: {
            type: 'object',
            properties: {
              filePath: {
                type: 'string',
                description: 'Path to the file (relative to project root)',
              },
            },
            required: ['filePath'],
          },
        },
        {
          name: 'get-component',
          description: 'Get detailed information about a React component',
          inputSchema: {
            type: 'object',
            properties: {
              componentName: {
                type: 'string',
                description: 'Name of the component (e.g., "Button", "DynamicQuestionRenderer")',
              },
            },
            required: ['componentName'],
          },
        },
        {
          name: 'get-api-route',
          description: 'Get detailed information about an API route',
          inputSchema: {
            type: 'object',
            properties: {
              routePath: {
                type: 'string',
                description: 'API route path (e.g., "/api/blueprints/generate")',
              },
            },
            required: ['routePath'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      switch (request.params.name) {
        case 'search-files': {
          const { pattern } = request.params.arguments as { pattern: string };
          const results = await searchFiles(projectRoot, pattern);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        }

        case 'search-content': {
          const { searchTerm, filePattern } = request.params.arguments as {
            searchTerm: string;
            filePattern?: string;
          };
          const results = searchContent(projectRoot, searchTerm, filePattern);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        }

        case 'get-file': {
          const { filePath } = request.params.arguments as { filePath: string };
          const result = getFileContent(projectRoot, filePath);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'get-component': {
          const { componentName } = request.params.arguments as {
            componentName: string;
          };
          const result = getComponentInfo(projectRoot, componentName);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'get-api-route': {
          const { routePath } = request.params.arguments as { routePath: string };
          const result = getAPIRouteInfo(projectRoot, routePath);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
      }
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  });

  return server;
}

/**
 * Run the MCP server with stdio transport
 */
export async function runServer() {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error('[MCP Server] Polaris Context MCP server running on stdio');
}
