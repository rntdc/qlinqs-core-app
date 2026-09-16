# Qlinqs — Estrutura de Dados (Regras de Negócio)

Este documento descreve o **modelo de dados** do Qlinqs pela ótica das **regras de
negócio**: quais entidades existem, o que cada uma contém, o que é obrigatório ou
opcional, o que pode conter o quê, e como o estilo é herdado. Companheiro do
`qlinqs.md` (contexto de produto).

As representações usam JSON como notação, porque boa parte deste modelo vive em
colunas **JSONB** no Postgres (ver §2). Não é uma amarração de implementação — é a
forma mais fiel de mostrar a árvore de conteúdo que será persistida.

---

## 1. Princípios que governam o modelo

**1.1 — Espinha certa desde o v1; features cortadas depois.**
O modelo já nasce no formato final. O que fica "pra depois" (carrossel, grid,
background animado, etc.) é _não construído_, não _mal construído_. Voltar com
qualquer um deles **não exige migração** — o dado já os comporta. Esse é o motivo
principal de usar JSONB na árvore de conteúdo.

**1.2 — Um nível de profundidade, sempre.**
A página é uma **lista plana de blocos**. Só um tipo de bloco (o _container_) tem
filhos, e esses filhos são **cards**, que são folhas — nunca contêm nada. Container
nunca contém container. Isso mantém reordenação, arraste e renderização simples, e
corrige a confusão de carrossel do Liinks (onde um carrossel é um grupo frágil de
blocos soltos vizinhos).

**1.3 — Herança de estilo por ausência.**
Todo estilo de bloco tem um valor global no Tema. Um bloco só guarda um valor
quando quer **sobrescrever**. Campo ausente = herda o Tema; campo presente =
override. Na renderização: `valor_efetivo = bloco.x ?? tema.blockDefaults.x`. É o
"chain-link" do Liinks (segue a página / valor próprio) implementado só com
ausência de campo — sem nenhuma estrutura extra.

---

## 2. Persistência: o que é relacional e o que é JSONB

Regra geral: **relacional para identidade, roteamento e analytics; JSONB para a
árvore de conteúdo e para o tema.**

```
profiles       id (pk) · slug (unique, indexado) · created_at ...
               → identidade e roteamento qlinqs.com/slug. Auth vive fora.

pages          id (pk) · profile_id (fk) · updated_at
               content  JSONB   ← { header, socialIcons, blocks: [...] }
               theme    JSONB   ← { page, blockDefaults, fonts, palette }

templates      id (pk) · name · preview
               theme    JSONB   ← instância completa de Theme

page_views     page_id (fk) · timestamp                    ← relacional
block_clicks   page_id (fk) · block_id · timestamp         ← relacional
```

**Por que JSONB na `content` e na `theme`:**

- A árvore de blocos é polimórfica (o shape muda por tipo/layout), aninhada
  (container tem lista de cards) e feita pra crescer. Em tabelas relacionais isso
  viraria uma tabela por tipo de bloco e um `ALTER TABLE` a cada layout novo —
  exatamente o retrabalho que o princípio 1.1 evita.
- A página é lida como uma unidade (render = buscar a página e desenhar). Um
  documento JSONB = 1 row, 0 joins. Leitura rápida, que é o que o produto pede no
  mobile.
- `content` e `theme` são colunas separadas de propósito: o tema muda independente
  do conteúdo (aplicar um template só toca `theme`).

**O que fica por conta da aplicação (não do banco):**

- **Validação do shape.** O Postgres garante "é JSON válido", não "é um card
  válido". Um validador no boundary (Zod/Valibot/equivalente) é a fonte de verdade
  do formato, versionado junto com o código.
- **Integridade do `block_id`.** O `block_id` em `block_clicks` aponta pra um id
  que vive dentro do JSONB — o banco não força essa FK. Pior caso: um clique órfão
  de bloco deletado. Trata-se na aplicação.
- **Índice GIN** só quando/se houver consulta _dentro_ do JSONB (ex.: "páginas que
  usam o template X"). No MVP a busca é por `slug` e render — provavelmente
  dispensável no começo.

---

## 3. A Página e suas partes fixas

A página tem duas partes **fixas** (sempre presentes, editáveis, fora da lista de
blocos) e uma lista de blocos que o usuário monta livremente.

```json
// pages.content (JSONB)
{
  "header": { ... },        // fixo
  "socialIcons": [ ... ],   // fixo, populável
  "blocks": [ ... ]         // lista plana e ordenada
}
```

### 3.1 Header (fixo)

- **Sempre presente e editável.** Não é um bloco; é a chrome do topo da página.
- **Foto de perfil é opcional** — sem foto, o header se adapta (nome/bio
  centralizados).
- O _estilo_ do header (layout, cores, tamanho da foto) vem do Tema (§7.1); o
  _conteúdo_ (nome, bio) vive aqui.

```json
"header": {
  "name": "Clínica Aurora",
  "bio": "Atendimento humanizado • Porto Alegre"
}
```

### 3.2 Social Icons (fixo, populável)

Campo **fixo** da página — uma fileira de ícones sociais que aparece perto do topo,
sempre disponível como seção. **Não é um bloco** que o usuário adiciona ou remove;
é parte fixa da página, que o usuário **popula com as redes que quiser**.

Regras de negócio:

- Cada entrada é uma rede social escolhida pelo usuário: **plataforma + valor**.
- O usuário insere **quantas e quais redes quiser** — a lista é livre, não um
  conjunto pré-fixado.
- O `value` pode ser o username ou a URL completa; o sistema monta o link correto
  a partir da plataforma.
- A lista pode estar **vazia** (a seção fixa existe, mas não renderiza ícones).
- A ordem das entradas é a ordem de exibição.

```json
"socialIcons": [
  { "platform": "instagram", "value": "clinica.aurora" },
  { "platform": "whatsapp",  "value": "5551999999999" },
  { "platform": "tiktok",    "value": "https://tiktok.com/@aurora" }
]
```

> Diferença importante em relação ao CTA de WhatsApp: aqui o WhatsApp é só mais um
> **ícone** na fileira social (link rápido). O **bloco** de WhatsApp CTA (§6) é
> outra coisa — uma chamada de ação proeminente no corpo da página. Os dois podem
> coexistir.

---

## 4. Card — a peça reutilizável

O **card** é a unidade de conteúdo clicável, e a peça central do modelo. Ele é
**idêntico** onde quer que apareça — o que muda é _quanto dele_ o contexto mostra.
Aprender a editar um card = saber editar qualquer coisa da página, porque o card em
destaque, cada slide de carrossel e cada célula de grid são todos o mesmo card.

```json
{
  "id": "card_01",
  "link": { "kind": "url", "href": "https://..." },
  "image": { "source": "upload", "value": "..." },
  "title": "Agende sua consulta",
  "description": "Segunda a sexta, 8h às 18h",
  "buttonText": "Agendar",
  "label": "NOVO",
  "overrides": {}
}
```

**Regras de negócio do card:**

- **`link` é opcional** — um card pode ser decorativo (sem destino). Tipos de
  destino no v1: `url` e `email` (vira `mailto:`). Arquivo, imagem-lightbox e
  link-para-página são pós-v1.
- **`image` é condicional ao contexto:**
  - Em **bloco atômico** → opcional (um botão de texto puro é válido).
  - Dentro de **container** (carrossel/grid) → **obrigatória** (card sem imagem
    quebra o visual da coleção).
  - Mesmo card, regra de validação diferente conforme o pai.
- **Fonte da imagem** no v1: `upload`, `icon` ou `emoji`. 3D, IA e galeria são
  pós-v1 (novos valores de `source`, sem mudar o formato).
- **`buttonText`** existe sempre no dado, mas só é renderizado nos layouts que têm
  um CTA separado do corpo (destaque / carrossel). Guardar sempre evita perda de
  texto ao trocar de layout.
- **`label` é público** (selo visível ao visitante: "NOVO", "PROMO", "ESGOTADO").
  Não confundir com a "tag privada" de organização do Liinks — essa foi **cortada
  do v1**.
- **`overrides`** é o estilo próprio do card (§5.3). Tudo ausente = herda o Tema.

---

## 5. Blocos, containers e estilo

### 5.1 Bloco atômico (carrega 1 card)

A maioria dos blocos. Carrega **exatamente um card**. O campo `layout` dirige quais
campos do card aparecem e quais controles de estilo ficam disponíveis.

```json
{
  "id": "blk_01",
  "kind": "atomic",
  "type": "link",
  "layout": "featured",
  "hidden": false,
  "card": { ... }
}
```

Matriz **layout × campos** do bloco `link` (o editor é contextual ao layout, como
no Liinks):

| Layout      | Campos do card exibidos                      | Controle próprio                      |
| ----------- | -------------------------------------------- | ------------------------------------- |
| `button`    | título, descrição                            | alinhamento                           |
| `thumbnail` | imagem, título, descrição, label             | tamanho (grande/pequeno), alinhamento |
| `featured`  | imagem, título, descrição, buttonText, label | —                                     |

Como o card guarda **todos** os campos independentemente do layout, trocar de
layout (ex.: `button` → `featured`) **não perde** texto já escrito — os campos só
voltam a aparecer. Melhoria concreta sobre o Liinks.

### 5.2 Bloco container (carrega uma lista de cards) — pós-v1

O container **é** o bloco, e dentro dele o usuário adiciona os cards. Corrige a
confusão do Liinks: reordenar/adicionar/remover acontece **dentro** da caixa
fechada, e nenhum card escapa do grupo.

```json
{
  "id": "blk_07",
  "kind": "container",
  "type": "carousel",
  "config": { "size": "large" },
  "items": [ { ...card }, { ...card }, { ...card } ]
}
```

Regras de negócio dos containers:

- **Dois tipos:** `carousel` e `grid`.
- **Imagem obrigatória** em todo card de container.
- **O que cada um exibe do card:**
  - `carousel` → imagem + título + descrição (+ buttonText, label). Config:
    `size` grande/pequeno.
  - `grid` → imagem + label apenas (célula pequena não comporta título/descrição
    legíveis). Config: `columns` 2 ou 3.
- **Container nunca contém container** (princípio 1.2).
- Ambos ficam **pós-v1** porque a UX de popular a caixa (adicionar/reordenar/
  remover cards, estado vazio, validação de imagem) é trabalho real — mas o
  formato acima já os comporta sem migração.

### 5.3 Estilo: herança e overrides

O card carrega um objeto `overrides` que espelha os defaults de bloco do Tema
(§7.3). **Todo campo é opcional**: ausente = herda o Tema; presente = valor próprio
do bloco.

```json
"overrides": {
  "tactile": "glass",      // efeito 3D do bloco
  "color": "#FFF",         // fundo do bloco
  "textColor": "#111",
  "corner": 22,            // 0–100 (%)
  "border": 0,             // 0–100 (%)
  "borderColor": "#000",
  "shadow": 40,            // 0–100 (%)
  "shadowStyle": "soft",   // soft | solid
  "spacing": 60,           // gap até o próximo bloco (0–100 %)
  "align": "center",       // left | center | right — estritamente do bloco
  "size": "large"          // large | small — thumbnail/carrossel
}
```

Regras de estilo que a aplicação impõe:

- **Tátil × borda/sombra são mutuamente exclusivos.** Com `tactile` diferente de
  `flat`, o relevo _é_ a borda e a sombra — nesse caso `border`, `borderColor`,
  `shadow` e `shadowStyle` são ignorados (a UI os esconde). Impede combinações
  feias.
- **`tactile: "none"`** = sem card: o link vira texto/link puro.
- Efeitos táteis do v1: `flat`, `concave`, `convex`, `inset`, `glass`, `none`.
- **Layouts com imagem dominante** (featured, grid, carrossel) escondem `color` e
  `textColor` — o fundo do bloco é a própria imagem.
- **`align` e `size` são estritamente do bloco** — não têm versão global no Tema
  (não fazem parte da herança).

---

## 6. Blocos do v1 vs. pós-v1

| Categoria                       | v1                                                                                                               | Pós-v1             |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------ |
| **Atômicos** (1 card)           | `link` (layouts botão/thumbnail/featured), `whatsapp` (CTA), `maps` (localização), `text`, `heading` (divisória) | —                  |
| **Containers** (lista de cards) | —                                                                                                                | `carousel`, `grid` |

Observações:

- **`social-icons` não é bloco** — virou o campo fixo `socialIcons` da página (§3.2).
- **`whatsapp`** e **`maps`** são blocos próprios do Qlinqs (não existem como bloco
  destacado no Liinks) e servem direto às personas de negócio local.
- **`text`** — rich text (títulos, negrito/itálico, listas, alinhamento, links
  inline); herda fonte e cor da página. _A definir:_ formato do rich text (HTML
  sanitizado vs. JSON estruturado).
- **`heading`** — divisória/rótulo de seção; com título vira cabeçalho de grupo,
  sem título vira linha ou espaço. _A definir:_ campos de estilo da linha.

---

## 7. Theme — a camada de personalização

O Tema é **um objeto** (coluna `theme` JSONB) com quatro partes, em **dois
escopos**: page-level (aplica uma vez, sem override por bloco) e block-level (o
valor global que cada bloco herda).

```json
// pages.theme (JSONB)
{
  "page":          { "header": {...}, "background": {...}, "profilePicture": {...} },
  "blockDefaults": { "tactile": "flat", "color": "...", "corner": 22, ... },
  "fonts":         { "titleFont": "...", "textFont": "..." },
  "palette":       { "background": "...", "text": "...", "surface": "...", "onSurface": "...", "accent": "...", "onAccent": "..." }
}
```

### 7.1 page (General Styles) — page-level, sem override

- **header:** layout (`classic` | `business` no v1; `banner`/`headshot` se
  necessário depois), cor da folha, fade, cor do texto do header.
- **background:** `none` | `solid` | `gradient` (v1); `split`/`image` opcionais se
  houver upload; `animated` (mesh/blobs/smoke) é **pós-v1**.
- **profilePicture:** imagem (opcional), tamanho, sombra, borda + cor, colapsar bio
  longa.

### 7.2 fonts — page-level

`titleFont` (nome do perfil e títulos de bloco) + `textFont` (corpo), com
possibilidade de "font pairings" prontos.

### 7.3 blockDefaults (Block Styles) — block-level

Os valores globais que todo bloco herda. Espelha a parte compartilhada de
`overrides` (§5.3) — **não** inclui `align`/`size` (esses nunca são globais). O
Tema define um `tactile` padrão; o usuário sobrescreve por bloco se quiser.

### 7.4 palette — paleta semântica (o motor do diferencial)

Em vez de cores soltas espalhadas por vários painéis (o erro do Liinks, onde a
mesma cor mora em três lugares), o Qlinqs define **papéis de cor**: `background`,
`text`, `surface`, `onSurface`, `accent`, `onAccent`. Todo controle de cor aponta
pra um papel. **Trocar a paleta recolore a página inteira num clique**, com
contraste coerente — é o "muda a cara sem saber design" da tese.

### 7.5 Template — o Tema salvo e nomeado

Um **template** (tabela `templates`) é uma instância completa de `Theme` (paleta +
fontes + defaults de bloco + page styles), testada e bonita, com nome. **É o
coração do diferencial e prioridade nº 1 da personalização no v1**: a pessoa
escolhe um template lindo e ~90% nunca abre os painéis de estilo. Aplicar um
template = copiar seu `theme` pra `pages.theme`; depois o usuário ajusta livremente
sem afetar o template original. O tátil e o background vêm embutidos e
pré-testados em cada template.

---

## 8. O que está cortado do v1

Cortes deliberados; nenhum exige mudança de formato pra voltar.

| Cortado                                            | Já cabe no modelo em               |
| -------------------------------------------------- | ---------------------------------- |
| Carrossel, grid                                    | bloco container (§5.2)             |
| Tag privada (organização)                          | novo campo no card                 |
| Schedule (mostrar/esconder por data)               | além de `hidden`                   |
| Click goal, gate/paywall                           | —                                  |
| Ícones 3D, IA, galeria de imagens                  | `image.source` estende             |
| Background animado (mesh/blobs/smoke)              | `page.background` estende          |
| Preview automático (Open Graph)                    | fast-follow; card já tem os campos |
| Multi-página / bloco de página                     | `link.kind` estende                |
| Animação de bloco                                  | `overrides` estende                |
| Domínio custom, multi-perfil, pagamento            | fora do escopo de conteúdo         |
| Social & sharing (vCard, QR, badge, hide branding) | page settings estendem             |

---

## 9. Itens em aberto

1. **`text`** — formato do rich text (HTML sanitizado vs. JSON estruturado).
2. **`heading`** — campos de estilo da linha divisória.
3. **Templates** — quantos no lançamento e como é a galeria de troca.
4. **Header** — manter 2 layouts (classic + business) ou os 4 no v1.
5. **Background** — incluir split/image no v1 ou só solid + gradient.
6. **`Color`** — representação final (hex direto vs. referência a papel da paleta).
7. **Grid** — confirmado imagem + label; validar se algum caso pede título curto.
