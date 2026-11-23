/**
 * Bancada – botão "Concluir" do iPad grava na Google Agenda.
 *
 * Quando você toca em Concluir no iPad, a tela chama este script, que coloca
 * "✅ " no início do título do evento da Central de Tarefas. Assim a tarefa
 * sai também do e-mail "Minhas Pendências", da planilha e da tela nos outros dias.
 * "Desfazer" no iPad tira o ✅ de novo.
 *
 * Como publicar (conta nikolas@ixseg.com.br, a dona da agenda):
 * 1. script.google.com → Novo projeto → cole este arquivo inteiro e salve.
 * 2. Implantar → Nova implantação → tipo "App da Web":
 *    Executar como: Eu · Quem pode acessar: Qualquer pessoa → Implantar → autorize.
 * 3. Mande ao Claude a URL que termina em /exec.
 *
 * Segurança: sem a CHAVE certa o script não faz nada ({"erro":"chave"}).
 * Ele só mexe em eventos cuja descrição contém "Central de Tarefas".
 */
var CHAVE = 'TROQUE-ESTA-CHAVE';
var MARCA = '✅ ';

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!CHAVE || CHAVE === 'TROQUE-ESTA-CHAVE' || p.chave !== CHAVE) return json_({ erro: 'chave' });
  if (p.acao === 'ping') return json_({ ok: true });
  if (p.acao !== 'concluir' && p.acao !== 'reabrir') return json_({ erro: 'acao' });
  if (!p.id) return json_({ erro: 'id' });

  var ev = buscarEvento_(String(p.id));
  if (!ev) return json_({ erro: 'nao-encontrado' });
  if ((ev.getDescription() || '').indexOf('Central de Tarefas') < 0) return json_({ erro: 'fora-da-central' });

  var titulo = ev.getTitle() || '';
  if (p.acao === 'concluir' && titulo.indexOf('✅') !== 0) ev.setTitle(MARCA + titulo);
  if (p.acao === 'reabrir' && titulo.indexOf('✅') === 0) ev.setTitle(titulo.replace(/^✅\s*/, ''));
  return json_({ ok: true, titulo: ev.getTitle() });
}

function buscarEvento_(id) {
  var cal = CalendarApp.getDefaultCalendar();
  var tentativas = [id, id + '@google.com'];
  for (var i = 0; i < tentativas.length; i++) {
    try {
      var ev = cal.getEventById(tentativas[i]);
      if (ev) return ev;
    } catch (err) {}
  }
  return null;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
