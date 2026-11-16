# Bancada

Tela de espera para o iPad mini 1 (iOS 9). Tela inicial de cozinha: relógio, previsão do tempo de Fortaleza, timer rápido e lista de compras (salva só no iPad). Abas: pendências da Central de Tarefas, pomodoro por atividade (com contagem do dia, semana e mês), timer, cronômetro, alarme e assistente. Concluídas e histórico de pomodoros ficam salvos só no iPad.

- `index.html`: a página (JavaScript ES5, roda no Safari 9).
- `apps-script/tarefas.gs`: Google Apps Script que lê na Google Agenda os eventos da Central de Tarefas (rotina Minhas Pendências) e entrega a lista à tela. Publicado como App da Web; exige a chave.
- `config.json`: endereços do assistente (`claudeUrl`) e das pendências (`tarefasUrl`). Vazio = recurso desativado. Nenhum dado pessoal fica neste repositório.
- `worker/worker.js`: intermediário para o Cloudflare Workers. Por padrão usa o Workers AI gratuito (Llama 4 Scout, ligação `AI`); se o segredo `ANTHROPIC_API_KEY` existir, usa o Claude Haiku 5.5. A senha da tela fica no segredo `SENHA`.
- `weather.json`: previsão de Fortaleza, gerada de hora em hora pela Action `clima.yml` (dados: Open-Meteo, open-meteo.com).
