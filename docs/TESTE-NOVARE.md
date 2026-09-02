# NOVARE WORKSPACE — GUIA DE TESTE

Gerado em 02/09/2026. Tudo aqui foi testado de verdade, não é suposição.

---

## 1. CONTA DE TESTE

    E-mail: marketingcastriani+teste2@gmail.com
    Senha:  Novare2026Teste

Ciclo validado em produção: criar conta → sair → entrar de novo → abrir o
Planejamento. Funciona.

Observação: a senha é alfanumérica de propósito. A primeira conta que criei
tinha `#` e quebrava ao copiar/colar. Se a conta `+teste@gmail.com` aparecer
no painel do Supabase, pode apagar — foi descartada.

O `+teste2` é um apelido do seu próprio Gmail: os e-mails chegam na sua caixa
normalmente.

---

## 2. LINKS (produção)

| O quê | Link |
|---|---|
| Entrar | https://novare-workspace.vercel.app/login |
| Home / Hub | https://novare-workspace.vercel.app |
| **Planejamento Financeiro (o app)** | https://novare-workspace.vercel.app/planejamento/app |
| Página de vendas do Planejamento | https://novare-workspace.vercel.app/planejamento |
| Meu dia (painel do cliente) | https://novare-workspace.vercel.app/meu-dia |
| Íris (IA) | https://novare-workspace.vercel.app/iris |
| Assinar (landing) | https://novare-workspace.vercel.app/assinar |
| eBooks | https://novare-workspace.vercel.app/ebooks |
| Todas as ferramentas | https://novare-workspace.vercel.app/aplicativos |

---

## 3. ROTEIRO DE TESTE (10 minutos)

1. Entrar com a conta acima
2. Ir em `/planejamento/app` → **Meus dados**
3. Preencher a trilha: renda, despesas, dívidas, patrimônio, objetivos
   e o bloco **novo** "Sua aposentadoria"
4. Ver o **Diagnóstico** (nota A–E)
5. Ver o **Plano** (agora com projeção ano a ano e previdência)
6. **Fechar o mês** → ver a **Evolução**
7. Baixar o **Relatório em PDF**

---

## 4. SQL — RODE NO SQL EDITOR DO SUPABASE

Projeto: `hjikeevfzfswqydduars` (o mesmo do novareapp — confirmei que local
e produção usam este).

### 4.1 — Te dar acesso total (TROQUE O E-MAIL PELO SEU)

```sql
update public.hub_profiles
   set role = 'admin'
 where id = (select id from auth.users where email = 'SEU-EMAIL@AQUI');

-- Confira (deve mostrar role = admin):
select p.role, p.plano, u.email
  from public.hub_profiles p
  join auth.users u on u.id = p.id
 where u.email = 'SEU-EMAIL@AQUI';
```

Por que `admin`: o Hub trata qualquer papel diferente de `cliente` como
assinante. Libera Planejamento, Íris e /meu-dia sem depender do campo `plano`,
e faz aparecer o menu de Administração.

### 4.2 — Liberar o PRO para a conta de teste (opcional)

Ela já tem 7 dias grátis automáticos. Rode isto só se quiser testar como
assinante pagante:

```sql
update public.hub_profiles
   set plano = 'pro', plano_expira_em = now() + interval '1 year'
 where id = (select id from auth.users
             where email = 'marketingcastriani+teste2@gmail.com');
```

### 4.3 — Ligar o sino de notificações

Hoje o sino aparece vazio porque a tabela não existe. Isto cria:

```sql
create table if not exists public.hub_notificacoes (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users (id) on delete cascade,
  titulo     text not null,
  texto      text,
  href       text,
  tipo       text not null default 'aviso'
             check (tipo in ('aviso','novidade','conta','alerta')),
  lida_em    timestamptz,
  criado_em  timestamptz not null default now()
);

create index if not exists hub_notificacoes_usuario_idx
  on public.hub_notificacoes (usuario_id, criado_em desc);

alter table public.hub_notificacoes enable row level security;

drop policy if exists "hub_notificacoes: leitura propria" on public.hub_notificacoes;
create policy "hub_notificacoes: leitura propria"
  on public.hub_notificacoes for select to authenticated
  using (usuario_id = auth.uid() or usuario_id is null);

drop policy if exists "hub_notificacoes: marcar lida" on public.hub_notificacoes;
create policy "hub_notificacoes: marcar lida"
  on public.hub_notificacoes for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

drop policy if exists "hub_notificacoes: admin escreve" on public.hub_notificacoes;
create policy "hub_notificacoes: admin escreve"
  on public.hub_notificacoes for all to authenticated
  using (public.hub_papel() = 'admin') with check (public.hub_papel() = 'admin');
```

Depois, para criar um aviso de teste para todo mundo:

```sql
insert into public.hub_notificacoes (titulo, texto, href, tipo)
values ('Íris agora lê extrato em PDF',
        'Cole ou suba o arquivo e ela devolve o resumo do mês.',
        '/iris', 'novidade');
```

---

## 5. O QUE AINDA NÃO FUNCIONA

**Checkout.** O botão "Assinar" abre o WhatsApp em vez de cobrar. Falta criar
o produto na Kiwify/Hotmart (R$ 19,90/mês, SEM trial no provedor — o teste de
7 dias já roda dentro do app) e colar a URL em
`src/lib/assinatura.ts` → `ASSINATURA_CHECKOUT_URL`.

**Ativação automática após o pagamento.** Por enquanto é manual: quando
alguém pagar, rode o SQL 4.2 com o e-mail da pessoa. O app libera na hora.
O webhook automático exige a service role key.

**Sino de notificações.** Inativo até rodar o SQL 4.3.

**Reabrir um mês fechado.** A permissão existe no banco, mas não há botão.
Não implementei porque o schema do planejamento não está versionado no
repositório e mexer às cegas arriscaria os fechamentos.

---

## 6. ⚠️ IMPORTANTE: O QUE VOCÊ VAI TESTAR É A VERSÃO DE ONTEM

As correções do Planejamento que fiz hoje **estão apenas no meu ambiente
local** — ainda não foram publicadas. Em produção você verá a versão anterior.

O que está pronto localmente, esperando o seu OK para publicar:

- **Gate de assinatura de verdade**: teste vencido passa a bloquear gerar
  plano, fechar mês e baixar PDF (ver continua livre). Antes a faixa
  prometia isso e nada acontecia.
- **Acesso unificado**: `admin`/`equipe`/`pro` do Hub agora liberam o
  Planejamento. Antes dava para ser `pro` no Hub e "vencido" no app.
- **Bug que apagava dados**: salvar uma seção fazia DELETE antes do INSERT;
  falha no meio = dados perdidos. Invertido.
- **Clone do mês seguinte**: estava desligado por um bug de ordem e, se
  religado, corromperia valores (tratava "onde está hoje" como desconto).
- **"Refazer o plano"** recriava as metas com IDs novos a cada visita,
  orfanando os lançamentos do mês.
- **Bloco novo "Sua aposentadoria"** na trilha: idade de parar, renda
  desejada e INSS. Era o coração do cálculo e nunca era perguntado.
- **Projeção ano a ano** e **previdência/sucessão**: vendidos e calculados,
  nunca exibidos. Agora aparecem no Plano.
- **Calculadora da landing batia diferente do app** (R$ 2,4 mi contra
  R$ 1,7 mi para o mesmo caso). Agora usam a mesma conta.
- **PDF**: não apagava mais o próprio cabeçalho, e a faixa de venda deixou
  de sair impressa no documento do cliente.
- **Perfil comportamental**: quem não respondia era carimbado como
  "Construtor" por empate. Corrigido.
- **6 telas em branco** quando a sessão expirava agora explicam e dão o
  botão de voltar.

Me avise quando quiser que eu publique.
