// Intermediário entre a tela Bancada (iPad) e a API do Claude.
// Roda no Cloudflare Workers (plano gratuito). A chave da API fica guardada
// no Cloudflare como segredo e nunca vai para o iPad nem para o GitHub.
//
// Segredos a cadastrar no Worker (Settings → Variables and Secrets):
//   ANTHROPIC_API_KEY  chave criada em console.anthropic.com
//   SENHA              senha que o iPad envia junto de cada pergunta

const ORIGEM = "https://devxseg.github.io";
const MODELO = "claude-haiku-5-5";

const SISTEMA =
  "Você é o assistente de uma tela de cozinha e de casa num iPad, em Fortaleza (CE). " +
  "Responda sempre em português do Brasil, de forma curta e prática: no máximo uns 6 a 8 itens " +
  "ou um parágrafo curto, que caiba numa tela sem rolar muito. Use texto simples, sem markdown, " +
  "sem asteriscos e sem títulos; para listas, comece cada item com um travessão em nova linha. " +
  "Para receitas, dê ingredientes e passos com tempos e temperaturas. " +
  "Se não souber algo com segurança, diga que não tem certeza.";

function cabecalhos() {
  return {
    "Access-Control-Allow-Origin": ORIGEM,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function responder(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: cabecalhos() });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cabecalhos() });
    if (request.method !== "POST") return responder({ erro: "Use POST." }, 405);

    let corpo;
    try {
      corpo = JSON.parse(await request.text());
    } catch (e) {
      return responder({ erro: "Pedido inválido." }, 400);
    }

    if (!env.SENHA || corpo.senha !== env.SENHA) return responder({ erro: "Senha incorreta." }, 401);

    const pergunta = String(corpo.pergunta || "").trim().slice(0, 1500);
    if (!pergunta) return responder({ erro: "Escreva uma pergunta." }, 400);

    // Até 3 trocas anteriores, só texto, para permitir perguntas de continuação.
    const mensagens = [];
    const historico = Array.isArray(corpo.historico) ? corpo.historico.slice(-3) : [];
    for (const h of historico) {
      if (h && typeof h.p === "string" && typeof h.r === "string" && h.p && h.r) {
        mensagens.push({ role: "user", content: h.p.slice(0, 1500) });
        mensagens.push({ role: "assistant", content: h.r.slice(0, 4000) });
      }
    }
    mensagens.push({ role: "user", content: pergunta });

    let r;
    try {
      r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2026-10-21",
        },
        body: JSON.stringify({
          model: MODELO,
          max_tokens: 16000,
          system: SISTEMA,
          output_config: { effort: "low" },
          messages: mensagens,
        }),
      });
    } catch (e) {
      return responder({ erro: "Não consegui falar com o Claude. Tente de novo." }, 502);
    }

    let dados;
    try {
      dados = await r.json();
    } catch (e) {
      return responder({ erro: "Resposta inesperada do Claude." }, 502);
    }

    if (!r.ok) {
      if (r.status === 401) return responder({ erro: "Chave da API inválida. Confira o segredo ANTHROPIC_API_KEY." }, 502);
      if (r.status === 429) return responder({ erro: "Muitas perguntas seguidas. Espere um minuto." }, 429);
      if (r.status === 400 && /credit|billing/i.test(JSON.stringify(dados))) {
        return responder({ erro: "Sem créditos na conta da API. Adicione créditos em console.anthropic.com." }, 402);
      }
      return responder({ erro: "O Claude está indisponível agora (erro " + r.status + ")." }, 502);
    }

    if (dados.stop_reason === "refusal") {
      return responder({ erro: "O Claude não pode responder a essa pergunta." }, 200);
    }

    const texto = (dados.content || [])
      .filter((b) => b && b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (!texto) return responder({ erro: "O Claude não devolveu texto. Tente reformular." }, 200);
    return responder({ resposta: texto });
  },
};
