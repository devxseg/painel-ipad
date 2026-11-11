# Bancada

Tela de espera para o iPad mini 1 (iOS 9): relógio, previsão do tempo de Fortaleza, timer, cronômetro e receitas.

- `index.html`: a página (JavaScript ES5, roda no Safari 9).
- `recipes.json`: as receitas. Cada passo pode ter `"min"` para mostrar um botão de timer.
- `weather.json`: gerado de hora em hora pela Action `clima.yml` (dados: Open-Meteo, open-meteo.com).
- `config.json`: endereço do assistente Claude (`claudeUrl`). Vazio = aba Claude desativada.
- `worker/worker.js`: intermediário para o Cloudflare Workers. Guarda a chave da API da Anthropic (segredo `ANTHROPIC_API_KEY`) e a senha da tela (segredo `SENHA`); o iPad só manda a pergunta e a senha.
