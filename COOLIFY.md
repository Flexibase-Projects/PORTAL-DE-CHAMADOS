# Deploy no Coolify

Este projeto **precisa usar o Build Pack Dockerfile** no Coolify. O Nixpacks não executa o build do frontend (Vite) corretamente.

## Passos no Coolify

1. Abra o recurso da aplicação no Coolify.
2. Vá em **Build Pack** (ou configuração de build).
3. **Troque de "Nixpacks" para "Dockerfile"** no dropdown.
4. **Base Directory:** deixe `/` (raiz do repositório).
5. Em **Rede**, configure a **porta 8095** (ou defina a variável de ambiente `PORT=8095`).
6. Configure as variáveis de ambiente (ex.: `SUPABASE_URL`, `SUPABASE_KEY`).
7. Faça o deploy.

O `Dockerfile` na raiz faz o build do frontend e sobe o backend servindo o frontend estático na porta 8095.
