# 🐳 Docker - ReTechFin Admin

Guia completo para build e deploy com Docker.

## 📋 Pré-requisitos

- Docker instalado
- Docker Compose (opcional, mas recomendado)

## 🚀 Build e Execução

### Opção 1: Docker Compose (Recomendado)

```bash
# Build e iniciar
docker-compose up --build

# Executar em background
docker-compose up -d --build

# Parar
docker-compose down
```

A aplicação estará disponível em `http://localhost:3000`

### Opção 2: Docker Direto

```bash
# Build da imagem
docker build -t retechfin-admin .

# Executar container
docker run -d -p 3000:80 --name retechfin-admin retechfin-admin

# Parar container
docker stop retechfin-admin

# Remover container
docker rm retechfin-admin
```

## 🏗️ Estrutura Docker

### Dockerfile

O Dockerfile utiliza multi-stage build:

1. **Stage 1 (builder)**: Instala dependências e faz build da aplicação
2. **Stage 2 (production)**: Usa Nginx para servir os arquivos estáticos

### Nginx Configuration

O arquivo `nginx.conf` configura:
- ✅ Roteamento SPA (todas as rotas vão para index.html)
- ✅ Compressão Gzip
- ✅ Cache de assets estáticos
- ✅ Headers de segurança
- ✅ Otimizações de performance

## 🔧 Configuração

### Variáveis de Ambiente

Duas camadas:

```env
# BUILD (Vite, assadas no bundle — Railway: Service Variables declaradas como ARG no Dockerfile)
VITE_AUTH_USE_MOCK=false
VITE_API_BASE_URL=            # vazia = same-origin (recomendado)

# RUNTIME (nginx): destino do proxy /api/ → meufin-api
API_UPSTREAM=http://retech-meufin-api.railway.internal:8002
```

A autenticação é por cookie de sessão HttpOnly emitido pela meufin-api; o nginx serve a
API em `/api/` na mesma origem do admin, então não há CORS nem token no browser.
Detalhes: `docs/auth-session-gateway.md` na meufin-api.

**Nota**: variáveis `VITE_*` precisam ser definidas no build; `API_UPSTREAM` é lida no start do container.

### Customizar Porta

Edite o `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  # Altere 8080 para a porta desejada
```

## 📦 Deploy em Produção

### Build para Produção

```bash
# Build otimizado
docker build -t retechfin-admin:latest .

# Tag para registry
docker tag retechfin-admin:latest registry.example.com/retechfin-admin:latest

# Push para registry
docker push registry.example.com/retechfin-admin:latest
```

### Exemplo com Docker Compose em Produção

```yaml
version: '3.8'

services:
  retechfin-admin:
    image: registry.example.com/retechfin-admin:latest
    container_name: retechfin-admin
    ports:
      - "80:80"
      - "443:443"
    restart: always
    volumes:
      - ./nginx-ssl:/etc/nginx/ssl  # Para certificados SSL
    networks:
      - retechfin-network
```

## 🔒 SSL/HTTPS

Para adicionar SSL, você pode:

1. Usar um proxy reverso (Nginx, Traefik, etc.)
2. Adicionar certificados SSL diretamente no container
3. Usar Let's Encrypt com certbot

## 📊 Monitoramento

### Logs

```bash
# Ver logs
docker-compose logs -f

# Logs do container específico
docker logs -f retechfin-admin
```

### Health Check

O Nginx já está configurado para servir a aplicação. Você pode adicionar um health check:

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
  interval: 30s
  timeout: 10s
  retries: 3
```

## 🧹 Limpeza

```bash
# Remover containers parados
docker-compose down

# Remover imagens não utilizadas
docker image prune -a

# Limpeza completa (cuidado!)
docker system prune -a --volumes
```

## 🐛 Troubleshooting

### Container não inicia

```bash
# Ver logs
docker logs retechfin-admin

# Verificar se a porta está em uso
lsof -i :3000
```

### Build falha

```bash
# Limpar cache do Docker
docker builder prune

# Rebuild sem cache
docker-compose build --no-cache
```

### Assets não carregam

Verifique se o build foi feito corretamente:
```bash
docker exec retechfin-admin ls -la /usr/share/nginx/html
```

## 📚 Recursos Adicionais

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

