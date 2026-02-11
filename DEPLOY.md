# Guia de Deploy - Vercel

Este guia detalha o processo completo de deploy da plataforma no Vercel, incluindo troubleshooting de problemas comuns.

## 📋 Pré-requisitos

- [ ] Conta no [Vercel](https://vercel.com)
- [ ] Conta no [Supabase](https://supabase.com)
- [ ] Repositório Git configurado
- [ ] Projeto Supabase criado e configurado

## 🚀 Passo a Passo

### 1. Preparação do Projeto

```bash
# Certifique-se de que o build local funciona
npm run build

# Verifique se não há erros de TypeScript
npm run lint
```

### 2. Configuração do Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Importe o repositório do GitHub
3. Configure o projeto:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (raiz do projeto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. Variáveis de Ambiente

Adicione as seguintes variáveis em **Settings > Environment Variables**:

#### Database (Obrigatórias)
```env
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-sa-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxx:password@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

#### Supabase Auth (Obrigatórias)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

> ⚠️ **IMPORTANTE**: 
> - Não adicione aspas (`"`) ao redor dos valores
> - Copie os valores exatos do seu `.env.local`
> - Verifique se não há espaços extras no início/fim

### 4. Deploy

```bash
# Opção 1: Via Git Push (recomendado)
git add .
git commit -m "Deploy to production"
git push

# Opção 2: Via Vercel CLI
npx vercel --prod
```

## 🔍 Troubleshooting

### Erro: "No Next.js version detected"

**Causa**: Vercel não conseguiu identificar o projeto Next.js

**Solução**: 
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

### Erro: "Prisma Client not initialized"

**Causa**: Prisma Client não foi gerado durante o build

**Solução**:
```json
// package.json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Erro: "Invalid supabaseUrl"

**Causa**: Variáveis de ambiente com aspas ou valores incorretos

**Solução**:
1. Vá em **Settings > Environment Variables**
2. Edite `NEXT_PUBLIC_SUPABASE_URL`
3. Remova aspas se existirem
4. Valor deve ser: `https://xxx.supabase.co` (sem aspas)
5. Faça o mesmo para `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. **Redeploy** após corrigir

### Erro: "401 Unauthorized" no Login

**Causas possíveis**:
1. Variáveis `NEXT_PUBLIC_SUPABASE_*` incorretas
2. Usuário não existe no Supabase Auth
3. Projeto Supabase diferente entre dev e prod

**Solução**:
1. Verifique as variáveis no Vercel
2. Teste no console do navegador:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
   ```
3. Crie usuário via API:
   ```bash
   curl -X POST https://seu-dominio.vercel.app/api/admin/users/create \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@exemplo.com",
       "password": "senha-segura",
       "name": "Admin",
       "role": "ADMIN"
     }'
   ```

### Erro: "Missing environment variable: DATABASE_URL"

**Causa**: Variável não configurada no Vercel

**Solução**:
1. Vá em **Settings > Environment Variables**
2. Adicione `DATABASE_URL` com o valor do Supabase
3. Adicione `DIRECT_URL` também
4. **Redeploy**

### Build Lento ou Timeout

**Solução**:
1. Verifique se `node_modules` está no `.gitignore`
2. Certifique-se de que `package-lock.json` está commitado
3. Considere usar cache do Vercel:
   ```json
   // vercel.json
   {
     "github": {
       "silent": true
     }
   }
   ```

## 📊 Monitoramento Pós-Deploy

### Verificações Essenciais

- [ ] Login funciona corretamente
- [ ] Dashboard carrega sem erros
- [ ] Upload de arquivos funciona
- [ ] Notificações aparecem
- [ ] Suporte via tickets funciona
- [ ] Progresso de aulas é salvo

### Logs e Debugging

```bash
# Ver logs em tempo real
vercel logs

# Ver logs de uma função específica
vercel logs --function=/api/admin/users/create

# Ver logs de build
vercel logs --build
```

### Performance

1. Acesse **Analytics** no Vercel
2. Monitore:
   - Core Web Vitals
   - Tempo de resposta das APIs
   - Taxa de erro

## 🔄 Redeploy

### Quando Fazer Redeploy

- Após alterar variáveis de ambiente
- Após corrigir erros de build
- Após atualizar dependências

### Como Fazer Redeploy

**Opção 1: Via Dashboard**
1. Vá em **Deployments**
2. Clique nos 3 pontinhos do último deploy
3. Selecione **Redeploy**

**Opção 2: Via Git**
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

**Opção 3: Via CLI**
```bash
vercel --prod --force
```

## 🔐 Segurança

### Checklist de Segurança

- [ ] Variáveis sensíveis não estão no código
- [ ] `.env.local` está no `.gitignore`
- [ ] Service Role Key só é usada em server-side
- [ ] CORS configurado corretamente no Supabase
- [ ] RLS (Row Level Security) ativado no Supabase

### Boas Práticas

1. **Nunca commite** arquivos `.env`
2. **Rotacione** as chaves periodicamente
3. **Use** diferentes projetos Supabase para dev/prod
4. **Monitore** logs de acesso suspeito

## 📞 Suporte

Em caso de problemas não resolvidos:

1. Verifique os logs do Vercel
2. Consulte a [documentação do Next.js](https://nextjs.org/docs)
3. Verifique o [status do Vercel](https://www.vercel-status.com/)
4. Consulte o [status do Supabase](https://status.supabase.com/)

---

**Última atualização**: 10/02/2026
