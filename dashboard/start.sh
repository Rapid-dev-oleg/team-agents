#!/bin/bash
echo "🚀 Запуск Team Dashboard..."

# Проверяем зависимости
if [ ! -d "node_modules" ]; then
    echo "📦 Устанавливаем зависимости..."
    npm install
fi

# Запускаем Dashboard
echo "🌐 Запуск Dashboard на http://localhost:3000"
node app.js &

# Ждем запуска Dashboard
sleep 3

# Запускаем Telegram бота
echo "🤖 Запуск Telegram бота..."
echo "⚠️  Не забудьте установить TELEGRAM_BOT_TOKEN в .env файле"
echo "   или отредактировать telegram-bot.js"

# node telegram-bot.js &

echo ""
echo "✅ Система запущена!"
echo "📊 Dashboard: http://localhost:3000"
echo "📱 Telegram бот: @opeclawka_bot (команда /start)"
echo ""
echo "Для остановки: Ctrl+C"