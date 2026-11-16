#!/usr/bin/env python3
"""Gera compras.enc.json (lista de compras criptografada) para a tela do iPad.

Uso: python3 tools/cifrar_compras.py lista.csv CHAVE [saida]

lista.csv = a planilha "Lista de compras (iPad)" exportada em CSV. Usa a
primeira coluna; a primeira linha ("Item") é o cabeçalho. Linhas vazias são
ignoradas. Mesma cifra de tools/cifrar_tarefas.py.
"""
import csv, datetime, io, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cifrar_tarefas import FUSO, cifrar  # noqa: E402


def main():
    entrada, chave = sys.argv[1], sys.argv[2]
    saida = sys.argv[3] if len(sys.argv) > 3 else 'compras.enc.json'
    texto = open(entrada, encoding='utf-8-sig').read()
    linhas = list(csv.reader(io.StringIO(texto)))
    itens = []
    for i, l in enumerate(linhas):
        if not l:
            continue
        v = l[0].strip()
        if not v or (i == 0 and v.lower() == 'item'):
            continue
        itens.append(v[:80])
    dados = {'itens': itens, 'atualizado': datetime.datetime.now(FUSO).strftime('%d/%m %H:%M')}
    with open(saida, 'w', encoding='utf-8') as f:
        json.dump(cifrar(dados, chave), f)
    print('itens publicados:', len(itens))


if __name__ == '__main__':
    main()
