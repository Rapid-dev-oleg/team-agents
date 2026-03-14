// Простой HTTP сервер для Dashboard (без зависимостей)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Данные
const agents = [
  { id: 1, name: 'Design Architect', status: 'available', currentTask: null, skills: ['Figma', 'UX/UI', 'Prototyping'] },
  { id: 2, name: 'Fullstack Builder', status: 'available', currentTask: null, skills: ['Next.js', 'React', 'Node.js'] },
  { id: 3, name: 'Deploy & SEO', status: 'available', currentTask: null, skills: ['Vercel', 'SEO', 'DevOps'] }
];

let tasks = [
  { id: 1, title: 'Сайт для канала AI Бизнес', agent: null, status: 'backlog', priority: 'high', deadline: '2026-03-17' }
];

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // API endpoints
  if (req.url === '/api/agents' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(agents));
    return;
  }
  
  if (req.url === '/api/tasks' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(tasks));
    return;
  }
  
  if (req.url === '/api/tasks' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const newTask = JSON.parse(body);
        newTask.id = tasks.length + 1;
        newTask.status = 'backlog';
        newTask.createdAt = new Date().toISOString();
        tasks.push(newTask);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newTask));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }
  
  // Serve static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, 'public', filePath);
  
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg': contentType = 'image/jpg'; break;
  }
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Serve index.html for any route (SPA)
        fs.readFile(path.join(__dirname, 'public', 'index.html'), (err, html) => {
          if (err) {
            res.writeHead(404);
            res.end('File not found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Dashboard запущен на http://localhost:${PORT}`);
  console.log(`📊 API доступен по http://localhost:${PORT}/api/agents`);
  console.log(`📋 API задач: http://localhost:${PORT}/api/tasks`);
  console.log('');
  console.log('👥 Доступные агенты:');
  agents.forEach(agent => {
    console.log(`  • ${agent.name} (${agent.status})`);
  });
  console.log('');
  console.log('📱 Для управления через Telegram:');
  console.log('  Используйте команды в @opeclawka_bot');
  console.log('  /tasks - список задач');
  console.log('  /new [задача] - создать задачу');
  console.log('  /status [агент] - статус агента');
});