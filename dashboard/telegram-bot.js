// Telegram бот для управления командой агентов
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const axios = require('axios');

// Конфигурация
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'ваш_токен';
const DASHBOARD_URL = 'http://localhost:3000/api';

// Инициализация бота
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const app = express();
app.use(express.json());

// Команды бота
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcome = `
🤖 *Team Manager Bot*

Управляй своей командой AI-агентов прямо из Telegram!

*Доступные команды:*
/tasks - Список всех задач
/new [задача] - Создать новую задачу
/status [агент] - Статус агента
/report - Отчет за день
/help - Помощь

📊 *Dashboard:* http://localhost:3000
  `;
  
  bot.sendMessage(chatId, welcome, { parse_mode: 'Markdown' });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const help = `
*📋 Формат команд:*

1. *Создать задачу:*
/new Создать лендинг для канала
Приоритет: высокий
Дедлайн: 2026-03-17
Описание: Нужен продающий лендинг

2. *Проверить статус:*
/status Design Architect
/status все

3. *Получить отчет:*
/report
/report сегодня
  `;
  
  bot.sendMessage(chatId, help, { parse_mode: 'Markdown' });
});

// Список задач
bot.onText(/\/tasks/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const response = await axios.get(`${DASHBOARD_URL}/tasks`);
    const tasks = response.data;
    
    if (tasks.length === 0) {
      bot.sendMessage(chatId, '📭 Нет активных задач');
      return;
    }
    
    let message = '📋 *Активные задачи:*\n\n';
    tasks.forEach(task => {
      message += `*#${task.id}* ${task.title}\n`;
      message += `Статус: ${task.status === 'backlog' ? '⏳ Ожидание' : 
                               task.status === 'in_progress' ? '🚀 В работе' : 
                               '✅ Завершено'}\n`;
      message += `Приоритет: ${task.priority === 'high' ? '🔴 Высокий' : 
                                 task.priority === 'medium' ? '🟡 Средний' : 
                                 '🟢 Низкий'}\n`;
      message += `Дедлайн: ${task.deadline}\n`;
      if (task.agent) {
        message += `Агент: ${task.agent}\n`;
      }
      message += '\n';
    });
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Ошибка получения задач');
    console.error(error);
  }
});

// Создание задачи
bot.onText(/\/new (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const taskText = match[1];
  
  // Парсим текст задачи (простой парсинг)
  const lines = taskText.split('\n');
  const title = lines[0].trim();
  
  let priority = 'medium';
  let deadline = new Date();
  deadline.setDate(deadline.getDate() + 7); // +7 дней по умолчанию
  let description = '';
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('приоритет:')) {
      if (line.includes('высокий')) priority = 'high';
      else if (line.includes('низкий')) priority = 'low';
    } else if (line.includes('дедлайн:')) {
      const dateMatch = line.match(/\d{4}-\d{2}-\d{2}/);
      if (dateMatch) deadline = dateMatch[0];
    } else if (line.includes('описание:')) {
      description = lines.slice(i + 1).join('\n');
      break;
    }
  }
  
  const task = {
    title,
    priority,
    deadline: typeof deadline === 'string' ? deadline : deadline.toISOString().split('T')[0],
    description
  };
  
  try {
    const response = await axios.post(`${DASHBOARD_URL}/tasks`, task);
    const newTask = response.data;
    
    const message = `
✅ *Задача создана!*

*ID:* #${newTask.id}
*Название:* ${newTask.title}
*Приоритет:* ${newTask.priority === 'high' ? '🔴 Высокий' : 
                         newTask.priority === 'medium' ? '🟡 Средний' : 
                         '🟢 Низкий'}
*Дедлайн:* ${newTask.deadline}
*Статус:* ⏳ Ожидание назначения

📊 *Dashboard:* http://localhost:3000
    `;
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Ошибка создания задачи');
    console.error(error);
  }
});

// Статус агента
bot.onText(/\/status (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const agentName = match[1].toLowerCase();
  
  try {
    const response = await axios.get(`${DASHBOARD_URL}/agents`);
    const agents = response.data;
    
    if (agentName === 'все' || agentName === 'all') {
      let message = '👥 *Статус всех агентов:*\n\n';
      agents.forEach(agent => {
        message += `*${agent.name}*\n`;
        message += `Статус: ${agent.status === 'available' ? '🟢 Доступен' : '🟠 Занят'}\n`;
        if (agent.currentTask) {
          message += `Задача: #${agent.currentTask}\n`;
        }
        message += `Навыки: ${agent.skills.join(', ')}\n\n`;
      });
      
      bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else {
      const agent = agents.find(a => 
        a.name.toLowerCase().includes(agentName) || 
        agentName.includes(a.name.toLowerCase())
      );
      
      if (agent) {
        const message = `
*${agent.name}*

📊 *Статус:* ${agent.status === 'available' ? '🟢 Доступен' : '🟠 Занят'}
${agent.currentTask ? `📝 *Текущая задача:* #${agent.currentTask}` : '📝 *Текущая задача:* Нет'}
🎯 *Навыки:* ${agent.skills.join(', ')}
        `;
        
        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } else {
        bot.sendMessage(chatId, `❌ Агент "${match[1]}" не найден`);
      }
    }
  } catch (error) {
    bot.sendMessage(chatId, '❌ Ошибка получения статуса');
    console.error(error);
  }
});

// Отчет
bot.onText(/\/report/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const [agentsRes, tasksRes] = await Promise.all([
      axios.get(`${DASHBOARD_URL}/agents`),
      axios.get(`${DASHBOARD_URL}/tasks`)
    ]);
    
    const agents = agentsRes.data;
    const tasks = tasksRes.data;
    
    const availableAgents = agents.filter(a => a.status === 'available').length;
    const busyAgents = agents.filter(a => a.status === 'busy').length;
    const backlogTasks = tasks.filter(t => t.status === 'backlog').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    
    const message = `
📊 *Ежедневный отчет*

👥 *Команда:*
• Всего агентов: ${agents.length}
• Доступно: ${availableAgents}
• Занято: ${busyAgents}

📋 *Задачи:*
• Всего задач: ${tasks.length}
• В ожидании: ${backlogTasks}
• В работе: ${inProgressTasks}
• Завершено: ${doneTasks}

⏱️ *Производительность:*
• Задач на агента: ${(tasks.length / agents.length).toFixed(1)}
• Завершено сегодня: ${doneTasks}

🚀 *Рекомендации:*
${backlogTasks > 0 ? `• Есть ${backlogTasks} задач в ожидании - назначьте агентов` : '• Все задачи распределены'}
${availableAgents > 0 ? `• ${availableAgents} агентов свободны - можно брать новые задачи` : '• Все агенты заняты'}
    `;
    
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    bot.sendMessage(chatId, '❌ Ошибка генерации отчета');
    console.error(error);
  }
});

// Уведомления (можно расширить)
function sendNotification(chatId, message) {
  bot.sendMessage(chatId, `🔔 ${message}`, { parse_mode: 'Markdown' });
}

// Запуск
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Telegram бот запущен на порту ${PORT}`);
  console.log(`Dashboard: http://localhost:3000`);
  console.log(`API: http://localhost:3000/api`);
});

module.exports = { bot, sendNotification };