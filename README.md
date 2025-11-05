# Maricá Conecta 📱

Aplicativo mobile desenvolvido em React Native com Expo para a Prefeitura de Maricá, inspirado no Conecta Recife. O aplicativo oferece funcionalidades de notícias, eventos, posts e mapa interativo.

## 🎯 Funcionalidades

- **Notícias**: Visualização de notícias da prefeitura com categorias e datas
- **Eventos**: Listagem de eventos com informações detalhadas (data, horário, local)
- **Posts**: Feed de posts com interações (curtidas, comentários, compartilhamentos)
- **Mapa Interativo**: Mapa com pontos de interesse de Maricá (hospitais, escolas, praias, lagoas, etc.)

## 🚀 Como começar

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Expo CLI instalado globalmente: `npm install -g expo-cli`

### Instalação

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:

   ```bash
   npx expo start
   ```

3. Escaneie o QR code com:
   - **iOS**: App Camera ou Expo Go
   - **Android**: Expo Go app

## 📦 Estrutura do Projeto

```
rota/
├── app/
│   ├── (tabs)/
│   │   ├── noticias.tsx      # Tela de notícias
│   │   ├── eventos.tsx       # Tela de eventos
│   │   ├── posts.tsx         # Tela de posts/feed
│   │   └── mapa.tsx          # Mapa interativo
│   └── _layout.tsx           # Layout principal
├── types/
│   └── index.ts              # Tipos TypeScript
├── services/
│   └── api.ts                # Serviço de API
├── constants/
│   └── theme.ts              # Cores e temas
└── package.json
```

## 🎨 Personalização

### Cores do Tema

Edite o arquivo `constants/theme.ts` para personalizar as cores do aplicativo. As cores padrão são baseadas na identidade visual da Prefeitura de Maricá.

### Configuração do App

Edite o arquivo `app.json` para alterar:
- Nome do aplicativo
- Ícone e splash screen
- Bundle identifier (iOS) e Package name (Android)

## 📱 Desenvolvimento

### Executar no iOS
```bash
npm run ios
```

### Executar no Android
```bash
npm run android
```

### Executar na Web
```bash
npm run web
```

## 🔧 Integração com API

Atualmente, o aplicativo usa dados simulados. Para integrar com uma API real:

1. Edite o arquivo `services/api.ts` e configure a URL base da API
2. Substitua os dados simulados nas telas por chamadas à API
3. Exemplo de uso:

```typescript
import { getNoticias } from '@/services/api';

const noticias = await getNoticias();
```

## 📝 Próximos Passos

- [ ] Integração com API real da Prefeitura de Maricá
- [ ] Autenticação de usuários
- [ ] Notificações push
- [ ] Sistema de favoritos
- [ ] Compartilhamento de conteúdo
- [ ] Modo offline
- [ ] Testes automatizados

## 🏙️ Sobre Maricá

Maricá é uma cidade do estado do Rio de Janeiro, localizada na Região Metropolitana do Rio. Conhecida por suas belas praias, lagoas cristalinas (Lagoa de Araçatiba, Lagoa da Barra) e pela qualidade de vida. O aplicativo visa conectar os cidadãos com os serviços e informações da prefeitura.

## 📄 Licença

Este projeto foi desenvolvido para uso da Prefeitura Municipal de Maricá.
