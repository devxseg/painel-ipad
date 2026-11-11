# Bancada

Tela de espera para o iPad mini 1 (iOS 9): relógio, previsão do tempo de Fortaleza, timer, cronômetro e receitas.

- `index.html`: a página (JavaScript ES5, roda no Safari 9).
- `recipes.json`: as receitas. Cada passo pode ter `"min"` para mostrar um botão de timer.
- `weather.json`: gerado de hora em hora pela Action `clima.yml` (dados: Open-Meteo, open-meteo.com).
- `config.json`: endereço do assistente (`claudeUrl`). Vazio = aba Assistente desativada.
- `worker/worker.js`: intermediário para o Cloudflare Workers. Por padrão usa o Workers AI gratuito (Llama 4 Scout, ligação `AI`); se o segredo `ANTHROPIC_API_KEY` existir, usa o Claude Haiku 5.5. A senha da tela fica no segredo `SENHA`.
