#!/usr/bin/env python3
"""Gera tarefas.enc.json (pendências pessoais criptografadas) para a tela do iPad.

Uso: python3 tools/cifrar_tarefas.py eventos.json CHAVE [saida]

eventos.json = lista de eventos da Google Agenda (formato da ferramenta
list_events: summary, description, start, end), ou um objeto com "events",
ou uma lista desses objetos (páginas). Só entram eventos da Central de
Tarefas, frente Pessoal, não concluídos (sem ✅), de hoje−30 a hoje+7.

Cifra: chave = SHA-256(CHAVE); fluxo = SHA-256(chave‖nonce‖contador) em
blocos; ct = texto XOR fluxo; mac = HMAC-SHA-256(chave, nonce‖ct).
O iPad faz o mesmo em JavaScript para ler.
"""
import base64, datetime, hashlib, hmac, json, os, re, sys

FUSO = datetime.timezone(datetime.timedelta(hours=-3))  # America/Fortaleza
FRENTES = ['Pessoal']


def eventos_de(obj):
    if isinstance(obj, list):
        for x in obj:
            if isinstance(x, dict) and 'events' in x:
                yield from x['events']
            elif isinstance(x, dict):
                yield x
    elif isinstance(obj, dict):
        yield from obj.get('events', [])


def campo(desc, nome):
    m = re.search(r'^\s*' + nome + r':\s*(.+)$', desc, re.M)
    return m.group(1).strip() if m else ''


def inicio(ev):
    s = ev.get('start', {})
    if 'dateTime' in s:
        return datetime.datetime.fromisoformat(s['dateTime'].replace('Z', '+00:00')).astimezone(FUSO), False
    d = datetime.date.fromisoformat(s['date'])
    return datetime.datetime(d.year, d.month, d.day, tzinfo=FUSO), True


def fim(ev):
    s = ev.get('end', {})
    if 'dateTime' in s:
        return datetime.datetime.fromisoformat(s['dateTime'].replace('Z', '+00:00')).astimezone(FUSO)
    return None


def montar(eventos, agora):
    hoje = agora.date()
    tarefas, vistos = [], set()
    for ev in eventos:
        if ev.get('status') == 'cancelled' or ev.get('id') in vistos:
            continue
        vistos.add(ev.get('id'))
        desc = re.sub(r'<[^>]+>', '', re.sub(r'<br\s*/?>', '\n', ev.get('description') or '', flags=re.I))
        if 'Central de Tarefas' not in desc:
            continue
        titulo = (ev.get('summary') or '').strip()
        if titulo.startswith('✅') or titulo.upper().startswith('[DUPLICADO'):
            continue
        frente = campo(desc, 'Frente') or 'Pessoal'
        if frente not in FRENTES:
            continue
        ini, dia_todo = inicio(ev)
        dia = ini.date()
        if dia < hoje - datetime.timedelta(days=30) or dia > hoje + datetime.timedelta(days=7):
            continue
        hora = '' if dia_todo else ini.strftime('%H:%M')
        f = fim(ev)
        if hora == '08:00' and f and (f - ini).total_seconds() == 900:
            hora = ''
        titulo = re.sub(r'^❗️?\s*', '', titulo)
        titulo = re.sub(r'^\[(XSEG|NEXACORE|TAP)\]\s*', '', titulo)
        tarefas.append({
            'id': ev.get('id', ''),
            'titulo': titulo,
            'frente': frente,
            'prioridade': campo(desc, 'Prioridade') or 'Média',
            'dia': dia.isoformat(),
            'hora': hora,
            'situacao': 'atrasada' if dia < hoje else ('hoje' if dia == hoje else 'semana'),
        })
    ordem = {'atrasada': 0, 'hoje': 1, 'semana': 2}
    pri = {'Alta': 0, 'Média': 1, 'Baixa': 2}
    tarefas.sort(key=lambda t: (ordem[t['situacao']], pri.get(t['prioridade'], 1), t['dia'], t['hora']))
    return {'hoje': hoje.isoformat(), 'atualizado': agora.strftime('%d/%m %H:%M'), 'tarefas': tarefas}


def cifrar(dados, chave_texto):
    chave = hashlib.sha256(chave_texto.encode('utf-8')).digest()
    nonce = os.urandom(16)
    texto = json.dumps(dados, ensure_ascii=False).encode('utf-8')
    fluxo = bytearray()
    n = 0
    while len(fluxo) < len(texto):
        fluxo += hashlib.sha256(chave + nonce + n.to_bytes(4, 'big')).digest()
        n += 1
    ct = bytes(a ^ b for a, b in zip(texto, fluxo))
    mac = hmac.new(chave, nonce + ct, hashlib.sha256).hexdigest()
    return {'v': 1, 'nonce': nonce.hex(), 'ct': base64.b64encode(ct).decode(), 'mac': mac}


def main():
    entrada, chave = sys.argv[1], sys.argv[2]
    saida = sys.argv[3] if len(sys.argv) > 3 else 'tarefas.enc.json'
    eventos = list(eventos_de(json.load(open(entrada, encoding='utf-8'))))
    dados = montar(eventos, datetime.datetime.now(FUSO))
    with open(saida, 'w', encoding='utf-8') as f:
        json.dump(cifrar(dados, chave), f)
    print('eventos lidos:', len(eventos), '| tarefas pessoais publicadas:', len(dados['tarefas']))


if __name__ == '__main__':
    main()
