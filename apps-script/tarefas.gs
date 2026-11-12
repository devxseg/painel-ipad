/**
 * Bancada – pendências da Central de Tarefas para a tela do iPad.
 *
 * Lê na sua Google Agenda principal os eventos criados pela rotina
 * "Minhas Pendências" (descrição com "Central de Tarefas") e devolve
 * as tarefas abertas: atrasadas (últimos 30 dias), de hoje e dos próximos 7 dias.
 * Eventos com ✅ no início do título contam como concluídos e não aparecem.
 *
 * Como publicar (conta nikolas@ixseg.com.br):
 * 1. script.google.com → Novo projeto → cole este arquivo.
 * 2. Troque o valor de CHAVE abaixo por uma senha sua.
 * 3. Implantar → Nova implantação → tipo "App da Web":
 *    Executar como: Eu · Quem pode acessar: Qualquer pessoa → Implantar → autorize.
 * 4. Copie a URL que termina em /exec.
 *
 * A URL sozinha não mostra nada: sem a chave correta a resposta é {"erro":"chave"}.
 */
var CHAVE = 'TROQUE-ESTA-CHAVE';
var FUSO = 'America/Fortaleza';
// Frentes que aparecem na tela. Para ver tudo: ['Pessoal', 'XSEG', 'NEXACORE', 'TAP'].
var FRENTES = ['Pessoal'];

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!CHAVE || CHAVE === 'TROQUE-ESTA-CHAVE' || p.chave !== CHAVE) return json_({ erro: 'chave' });

  var agora = new Date();
  var hoje = Utilities.formatDate(agora, FUSO, 'yyyy-MM-dd');
  var inicio = new Date(agora.getTime() - 30 * 86400000);
  var fim = new Date(agora.getTime() + 8 * 86400000);
  var limite = Utilities.formatDate(new Date(agora.getTime() + 7 * 86400000), FUSO, 'yyyy-MM-dd');

  var eventos = CalendarApp.getDefaultCalendar().getEvents(inicio, fim, { search: 'Central de Tarefas' });
  var tarefas = [];

  eventos.forEach(function (ev) {
    var desc = (ev.getDescription() || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
    if (desc.indexOf('Central de Tarefas') < 0) return;
    var titulo = (ev.getTitle() || '').trim();
    if (titulo.indexOf('✅') === 0) return;

    var dia = Utilities.formatDate(ev.getStartTime(), FUSO, 'yyyy-MM-dd');
    if (dia > limite) return;
    var hora = ev.isAllDayEvent() ? '' : Utilities.formatDate(ev.getStartTime(), FUSO, 'HH:mm');
    var minutos = (ev.getEndTime().getTime() - ev.getStartTime().getTime()) / 60000;
    if (hora === '08:00' && minutos === 15) hora = ''; // tarefa sem hora marcada

    var frente = campo_(desc, 'Frente') || 'Pessoal';
    if (FRENTES.indexOf(frente) < 0) return;

    tarefas.push({
      titulo: titulo.replace(/^❗️?\s*/, '').replace(/^\[(XSEG|NEXACORE|TAP)\]\s*/, ''),
      frente: frente,
      prioridade: campo_(desc, 'Prioridade') || 'Média',
      dia: dia,
      hora: hora,
      situacao: dia < hoje ? 'atrasada' : (dia === hoje ? 'hoje' : 'semana')
    });
  });

  var ordemSit = { atrasada: 0, hoje: 1, semana: 2 };
  tarefas.sort(function (a, b) {
    return (ordemSit[a.situacao] - ordemSit[b.situacao]) ||
      (pri_(a.prioridade) - pri_(b.prioridade)) ||
      (a.dia < b.dia ? -1 : a.dia > b.dia ? 1 : 0) ||
      (a.hora < b.hora ? -1 : a.hora > b.hora ? 1 : 0);
  });

  return json_({ hoje: hoje, atualizado: Utilities.formatDate(agora, FUSO, 'HH:mm'), tarefas: tarefas });
}

function pri_(p) {
  return p === 'Alta' ? 0 : p === 'Baixa' ? 2 : 1;
}

function campo_(texto, nome) {
  var m = texto.match(new RegExp('^\\s*' + nome + ':\\s*(.+)$', 'm'));
  return m ? m[1].trim() : '';
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
