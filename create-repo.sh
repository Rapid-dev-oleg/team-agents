#!/bin/bash
echo "🚀 Создание репозитория на GitHub..."

# Добавляем gh в PATH
export PATH="/tmp/gh_2.47.0_linux_amd64/bin:$PATH"

# Проверяем авторизацию
echo "Проверка авторизации..."
gh auth status

# Создаем репозиторий
echo "Создаю репозиторий team-agents..."
gh repo create team-agents --private --source=. --remote=origin --push

if [ $? -eq 0 ]; then
    echo "✅ Репозиторий создан и залит на GitHub!"
    echo "📦 Ссылка: https://github.com/$(gh api user | jq -r '.login')/team-agents"
else
    echo "❌ Ошибка при создании репозитория"
    echo "Попробуй создать вручную:"
    echo "1. Зайди на github.com"
    echo "2. Нажми '+' → New repository"
    echo "3. Название: team-agents"
    echo "4. Private"
    echo "5. Не добавляй README, .gitignore, license"
fi