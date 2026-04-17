require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

// Node.js 16及以下版本的fetch polyfill
if (typeof fetch === 'undefined') {
  const nodeFetch = require('node-fetch');
  global.fetch = nodeFetch;
  global.Headers = nodeFetch.Headers;
  global.Request = nodeFetch.Request;
  global.Response = nodeFetch.Response;
}

// FormData polyfill
if (typeof FormData === 'undefined') {
  global.FormData = require('form-data');
}

const app = express();
const port = 3000;

const isPkg = typeof process.pkg !== 'undefined';

const getPublicPath = () => {
  if (isPkg) {
    return path.join(process.cwd(), 'public');
  }
  return path.join(__dirname, 'public');
};

// 配置CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 初始化Anthropic客户端
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// API路由 - 处理聊天请求（流式响应）
app.post('/api/chat', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    
    const { messages, config } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
      return res.status(400).json({ 
        error: 'Invalid messages format',
        details: 'Messages must be a non-empty array'
      });
    }
    
    if (messages.length === 0) {
      console.error('Empty messages array');
      return res.status(400).json({ 
        error: 'Empty messages array',
        details: 'Messages array must contain at least one message'
      });
    }
    
    // 使用前端发送的配置或默认配置
    const apiKey = config?.apiKey || process.env.ANTHROPIC_API_KEY;
    const model = config?.modelName || process.env.ANTHROPIC_MODEL || 'claude-3-opus-20240229';
    const maxTokens = config?.maxTokens ? parseInt(config.maxTokens) : 1024;
    
    console.log('API Config:', { apiKey: apiKey ? '***' : 'missing', model, maxTokens });
    
    if (!apiKey) {
      console.error('API Key is required');
      return res.status(400).json({ 
        error: 'API Key is required',
        details: 'Please provide a valid Anthropic API key'
      });
    }
    
    // 动态创建Anthropic客户端
    const anthropicConfig = {
      apiKey: apiKey,
    };
    
    // 如果提供了baseUrl，则添加到配置中
    if (config?.baseUrl) {
      anthropicConfig.baseURL = config.baseUrl;
      console.log('Using custom base URL:', config.baseUrl);
    }
    
    console.log('Creating Anthropic client with config:', {
      model,
      baseURL: anthropicConfig.baseURL,
      hasApiKey: !!apiKey
    });
    
    const anthropic = new Anthropic(anthropicConfig);
    
    console.log('Sending messages to Anthropic API:', messages);
    
    // 设置响应头为流式
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // 发送流式请求
    const stream = await anthropic.messages.create({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      stream: true,
    });
    
    console.log('Streaming response from Anthropic API');
    
    // 处理流式响应
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta') {
        const text = chunk.delta.text;
        if (text) {
          // 发送数据块
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      } else if (chunk.type === 'message_stop') {
        // 发送结束标记
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        break;
      }
    }
    
    res.end();
  } catch (error) {
    console.error('Error:', error);
    
    // 详细的错误信息
    let errorMessage = 'Failed to generate response';
    let errorDetails = '';
    
    if (error.status) {
      errorMessage = `API request failed with status ${error.status}`;
      if (error.error?.message) {
        errorDetails = error.error.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: errorDetails,
      rawError: error.message || String(error)
    });
  }
});

// 提供静态文件服务（支持pkg打包）
app.use(express.static(getPublicPath(), { index: 'index.html' }));

// 默认路由（支持pkg打包）
app.get('/', (req, res) => {
  res.sendFile(path.join(getPublicPath(), 'index.html'));
});

console.log(`
=========================================
  Anthropic Chat App - Packaged Version
  Console window will stay open
=========================================
  Press Ctrl+C or close window to exit
=========================================
`);

if (isPkg) {
  console.log('[NOTE] Console window is locked open');
}

let serverClosed = false;

function gracefulShutdown(signal) {
  if (serverClosed) return;
  serverClosed = true;
  console.log(`\n收到 ${signal} 信号正在关闭服务器...`);
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// 启动服务器
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
