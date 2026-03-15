# SIREME

SIREME é um MVP web responsivo de apoio à regulação médica e ao encaminhamento assistido de pacientes. O projeto foi desenhado como uma demo de healthtech B2B, com foco em explicabilidade, operação e usabilidade para centrais de regulação.

## O que o MVP entrega

- Login visual com usuários demo
- Dashboard operacional com métricas e atalhos
- Fluxo de novo caso em etapas
- Classificação determinística e explicável
- Linha de cuidado, alertas clínicos e recursos assistenciais
- Motor de recomendação com score breakdown
- Mapa com hospitais e UPAs de Curitiba
- Histórico com timeline e override do regulador
- Modo simulação com 5 casos prontos

## Como rodar

Pré-requisito:

- Node.js 18+ com `npm`

Comandos:

```bash
npm install
npm run dev
```

Build de produção:

```bash
npm run build
```

## Publicar no GitHub Pages

O projeto já foi preparado para rodar como site estático no GitHub Pages:

- o app usa `HashRouter`, então as rotas funcionam sem configuração extra de servidor
- o `vite` está com `base: './'`
- já existe workflow de deploy em [`.github/workflows/deploy.yml`](/Users/joaoaquim/Downloads/sireme%202/.github/workflows/deploy.yml)

Passos:

1. Suba o projeto para um repositório no GitHub.
2. Garanta que a branch principal seja `main`.
3. No GitHub, abra `Settings > Pages`.
4. Em `Source`, selecione `GitHub Actions`.
5. Faça um push na `main`.

Depois disso, o GitHub vai publicar o site automaticamente.

## Acesso demo

- `r.silva@samu-cwb.gov.br` / `sireme2024`
- `c.santos@samu-cwb.gov.br` / `sireme2024`

## Onde editar cada parte

Hospitais, UPAs, coordenadas, ofertas e notas operacionais:

- [`src/mocks/hospitals.ts`](/Users/joaoaquim/Downloads/sireme 2/src/mocks/hospitals.ts)

Casos simulados:

- [`src/mocks/simulationCases.ts`](/Users/joaoaquim/Downloads/sireme 2/src/mocks/simulationCases.ts)

Fila do NIR e solicitações de leitos:

- [`src/mocks/nirData.ts`](/Users/joaoaquim/Downloads/sireme 2/src/mocks/nirData.ts)

Regras clínicas de gravidade:

- [`src/rules/gravityRules.ts`](/Users/joaoaquim/Downloads/sireme 2/src/rules/gravityRules.ts)

Regras de categoria e linha de cuidado:

- [`src/rules/categoryRules.ts`](/Users/joaoaquim/Downloads/sireme 2/src/rules/categoryRules.ts)

Alertas clínicos:

- [`src/rules/alertRules.ts`](/Users/joaoaquim/Downloads/sireme 2/src/rules/alertRules.ts)

Recursos obrigatórios e desejáveis:

- [`src/rules/resourceRules.ts`](/Users/joaoaquim/Downloads/sireme 2/src/rules/resourceRules.ts)

Algoritmo de recomendação:

- [`src/engine/recommendationEngine.ts`](/Users/joaoaquim/Downloads/sireme 2/src/engine/recommendationEngine.ts)

Simulação operacional da rede:

- [`src/services/hospitalService.ts`](/Users/joaoaquim/Downloads/sireme 2/src/services/hospitalService.ts)

Tela NIR / Leitos:

- [`src/pages/NirPage.tsx`](/Users/joaoaquim/Downloads/sireme 2/src/pages/NirPage.tsx)

## Estrutura

- `components`: UI e blocos reutilizáveis
- `pages`: telas principais
- `mocks`: base de unidades, usuários e simulações
- `types`: contratos da aplicação
- `rules`: lógica clínica explicável
- `services`: persistência local e estado operacional
- `engine`: recomendação hospitalar
- `utils`: labels e formatadores

## Observações

- Não há IA real nem integrações externas complexas
- Todos os dados são mockados
- O mapa usa Leaflet/OpenStreetMap para visualização
- O estado operacional das unidades é simulado para deixar a demo mais viva
