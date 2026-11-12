# Bancada

Tela de espera para o iPad mini 1 (iOS 9): relógio, pendências da Central de Tarefas, pomodoro por atividade (com contagem do dia, semana e mês), timer, cronômetro, alarme e assistente. Concluídas e histórico de pomodoros ficam salvos só no iPad.

- `index.html`: a página (JavaScript ES5, roda no Safari 9).
- `apps-script/tarefas.gs`: Google Apps Script que lê na Google Agenda os eventos da Central de Tarefas (rotina Minhas Pendências) e entrega a lista à tela. Publicado como App da Web; exige a chave.
- `config.json`: endereços do assistente (`claudeUrl`) e das pendências (`tarefasUrl`). Vazio = recurso desativado. Nenhum dado pessoal fica neste repositório.
- `worker/worker.js`: intermediário para o Cloudflare Workers. Por padrão usa o Workers AI gratuito (Llama 4 Scout, ligação `AI`); se o segredo `ANTHROPIC_API_KEY` existir, usa o Claude Haiku 5.5. A senha da tela fica no segredo `SENHA`.
