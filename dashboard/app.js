// Простой Dashboard для управления агентами
const express = require('express');
const app = express();
const PORT = 3000;

// Данные агентов (потом в БД)
const agents = [
  { id: 1, name: 'Design Architect', status: 'available', currentTask: null, skills: ['Figma', 'UX/UI', 'Prototyping'] },
  { id: 2, name: 'Fullstack Builder', status: 'available', currentTask: null, skills: ['Next.js', 'React', 'Node.js'] },
  { id: 3, name: 'Deploy & SEO', status: 'available', currentTask: null, skills: ['Vercel', 'SEO', 'DevOps'] }
];

const tasks = [
  { id: 1, title: 'Сайт для канала AI Бизнес', agent: null, status: 'backlog', priority: 'high', deadline: '2026-03-17' }
];

app.use(express.static('public'));
app.use(express.json());

// API для получения данных
app.get('/api/agents', (req, res) => {
  res.json(agents);
});

app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const newTask = {
    id: tasks.length + 1,
    ...req.body,
    status: 'backlog',
    createdAt: new Date().toISOString()
  };
  tasks.push(newTask);
  res.json(newTask);
});

app.post('/api/assign', (req, res) => {
  const { taskId, agentId } = req.body;
  const task = tasks.find(t => t.id === taskId);
  const agent = agents.find(a => a.id === agentId);
  
  if (task && agent) {
    task.agent = agentId;
    task.status = 'in_progress';
    agent.currentTask = taskId;
    agent.status = 'busy';
    res.json({ success: true, task, agent });
  } else {
    res.status(404).json({ error: 'Task or agent not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});