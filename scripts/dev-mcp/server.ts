#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fetch from "node-fetch";
import { Client } from "pg";
import fs from "fs";
import path from "path";
import { secureReadFile } from "../shared/pathSecurity.js";

const server = new Server({
  name: "dev-mcp",
  version: "0.1.0",
}, {
  capabilities: {
    tools: {},
    resources: {},
  },
});

function getEnv(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`${name} is required`);
  return v;
}

server.tool("http.request", {
  description: "Make an HTTP request (GET/POST/etc)",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string" },
      method: { type: "string", enum: ["GET","POST","PUT","PATCH","DELETE","HEAD","OPTIONS"] },
      headers: { type: "object", additionalProperties: { type: "string" } },
      body: { type: "string" }
    },
    required: ["url"],
  },
  async execute(input) {
    const res = await fetch(input.url, {
      method: input.method ?? "GET",
      headers: input.headers as Record<string,string> | undefined,
      body: input.body,
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, headers: Object.fromEntries(res.headers.entries()), body: text };
  }
});

server.tool("postgres.query", {
  description: "Run a SQL query against Postgres (uses DATABASE_URL)",
  inputSchema: {
    type: "object",
    properties: {
      sql: { type: "string" },
      params: { type: "array", items: {} }
    },
    required: ["sql"],
  },
  async execute({ sql, params }) {
    const url = getEnv("DATABASE_URL");
    const client = new Client({ connectionString: url });
    await client.connect();
    try {
      const result = await client.query(sql as string, (params as any[]) ?? []);
      return { rowCount: result.rowCount, rows: result.rows, fields: result.fields?.map(f => f.name) };
    } finally {
      await client.end();
    }
  }
});

server.tool("ollama.generate", {
  description: "Call local Ollama generate endpoint",
  inputSchema: {
    type: "object",
    properties: {
      model: { type: "string" },
      prompt: { type: "string" }
    },
    required: ["model","prompt"],
  },
  async execute({ model, prompt }) {
    const base = getEnv("OLLAMA_BASE_URL", "http://localhost:11434");
    const r = await fetch(`${base}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt })
    });
    const text = await r.text();
    return { status: r.status, body: text };
  }
});

server.tool("ollama.tags", {
  description: "List local Ollama models",
  inputSchema: { type: "object", properties: {} },
  async execute() {
    const base = getEnv("OLLAMA_BASE_URL", "http://localhost:11434");
    const r = await fetch(`${base}/api/tags`);
    return await r.json();
  }
});

server.tool("openapi.load", {
  description: "Load an OpenAPI file from local path and return JSON (relative to project root only)",
  inputSchema: {
    type: "object",
    properties: { file: { type: "string" } },
    required: ["file"],
  },
  async execute({ file }) {
    const fileStr = String(file);

    // Get project root (could be from env or current directory)
    const projectRoot = process.env.PROJECT_ROOT || process.cwd();

    // Use secure path utility to prevent path traversal
    const data = secureReadFile(projectRoot, fileStr, 'utf8');
    return JSON.parse(data);
  }
});

server.tool("shell.exec", {
  description: "Run a shell command from an allowlist (ALLOWED_COMMANDS)",
  inputSchema: {
    type: "object",
    properties: { cmd: { type: "string" }, args: { type: "array", items: { type: "string" } } },
    required: ["cmd"],
  },
  async execute({ cmd, args }) {
    const allowed = (process.env.ALLOWED_COMMANDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
    if (!allowed.includes(String(cmd))) {
      throw new Error(`Command not allowed: ${cmd}`);
    }
    const { spawn } = await import("child_process");
    return await new Promise((resolve, reject) => {
      const ps = spawn(String(cmd), (args as string[]) ?? [], { stdio: ["ignore","pipe","pipe"] });
      let out = ""; let err = "";
      ps.stdout.on("data", d => out += d.toString());
      ps.stderr.on("data", d => err += d.toString());
      ps.on("close", code => resolve({ code, stdout: out, stderr: err }));
      ps.on("error", reject);
    });
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


