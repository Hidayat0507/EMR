// Minimal MCP server exposing n8n controls
// Tools:
// - triggerWebhook(path, method, body, headers)
// - soapRewrite(text)
// - referralLetter(text)
// - getExecutions(query)
// - setWorkflowActive(workflowId, active)

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/stdlib/stdio.js';

const N8N_BASE_URL = process.env.N8N_BASE_URL?.replace(/\/$/, '') || '';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

if (!N8N_BASE_URL) {
  console.error('N8N_BASE_URL is required in env for n8n MCP server');
}

const withApiHeaders = (headers = {}) => {
  const h = { ...headers };
  if (N8N_API_KEY) {
    h['X-N8N-API-KEY'] = N8N_API_KEY;
    h['Authorization'] = h['Authorization'] || `Bearer ${N8N_API_KEY}`;
  }
  return h;
};

const server = new Server({ name: 'n8n-mcp', version: '0.1.0' }, {
  capabilities: { tools: {} }
});

server.tool('triggerWebhook', {
  description: 'Trigger an n8n production webhook. path can be like "soap-rewrite" or full "/webhook/..."',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string' },
      method: { type: 'string', enum: ['GET','POST','PUT','PATCH','DELETE'], default: 'POST' },
      body: { type: ['object','string','null'], default: null },
      headers: { type: 'object', default: {} },
    },
    required: ['path']
  }
}, async ({ path, method = 'POST', body = null, headers = {} }) => {
  if (!N8N_BASE_URL) throw new Error('N8N_BASE_URL not configured');
  const rel = path.startsWith('/webhook/') ? path : `/webhook/${path.replace(/^\//,'')}`;
  const url = `${N8N_BASE_URL}${rel}`;
  const h = { 'Content-Type': 'application/json', ...headers };
  const res = await fetch(url, { method, headers: h, body: body == null ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)) });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch {}
  return { content: [{ type: 'json', json: { status: res.status, ok: res.ok, url, body: json ?? text } }] };
});

server.tool('soapRewrite', {
  description: 'Convenience tool to call /webhook/soap-rewrite with {text}',
  inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] }
}, async ({ text }) => {
  const r = await fetch(`${N8N_BASE_URL}/webhook/soap-rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  const t = await r.text();
  let j = null; try { j = JSON.parse(t); } catch {}
  return { content: [{ type: 'json', json: { status: r.status, ok: r.ok, body: j ?? t } }] };
});

server.tool('referralLetter', {
  description: 'Convenience tool to call /webhook/referral-letter with {text}',
  inputSchema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] }
}, async ({ text }) => {
  const r = await fetch(`${N8N_BASE_URL}/webhook/referral-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  const t = await r.text();
  let j = null; try { j = JSON.parse(t); } catch {}
  return { content: [{ type: 'json', json: { status: r.status, ok: r.ok, body: j ?? t } }] };
});

server.tool('getExecutions', {
  description: 'List n8n executions (requires N8N_API_KEY). Accepts optional query params: status, limit, workflowId',
  inputSchema: {
    type: 'object',
    properties: {
      status: { type: 'string' },
      limit: { type: 'number', default: 20 },
      workflowId: { type: 'string' }
    }
  }
}, async ({ status, limit = 20, workflowId }) => {
  if (!N8N_API_KEY) throw new Error('N8N_API_KEY required for REST calls');
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (limit) params.set('limit', String(limit));
  if (workflowId) params.set('workflowId', workflowId);
  const url = `${N8N_BASE_URL}/rest/executions?${params.toString()}`;
  const r = await fetch(url, { headers: withApiHeaders() });
  const j = await r.json().catch(() => ({}));
  return { content: [{ type: 'json', json: j }] };
});

server.tool('setWorkflowActive', {
  description: 'Activate or deactivate a workflow by id (requires N8N_API_KEY)',
  inputSchema: {
    type: 'object',
    properties: { workflowId: { type: 'string' }, active: { type: 'boolean' } },
    required: ['workflowId','active']
  }
}, async ({ workflowId, active }) => {
  if (!N8N_API_KEY) throw new Error('N8N_API_KEY required for REST calls');
  const action = active ? 'activate' : 'deactivate';
  const url = `${N8N_BASE_URL}/rest/workflows/${workflowId}/${action}`;
  const r = await fetch(url, { method: 'POST', headers: withApiHeaders() });
  const t = await r.text();
  let j = null; try { j = JSON.parse(t); } catch {}
  return { content: [{ type: 'json', json: { status: r.status, ok: r.ok, body: j ?? t } }] };
});

await server.connect(new StdioServerTransport());




