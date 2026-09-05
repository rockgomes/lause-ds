#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { buildServer } from './server.js';
import { loadData } from './data.js';

const server = buildServer(loadData());
await server.connect(new StdioServerTransport());
