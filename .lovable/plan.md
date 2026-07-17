## Fluxo de compra completo

1. **Carrinho → Finalizar compra**: botão "Pagar online" abre página `/checkout` em vez de ir direto ao gateway.
2. **Cadastro obrigatório** (`/checkout` etapa 1): se o cliente não estiver logado, mostra tela com email + senha (login OU cadastro). Após confirmar, avança automaticamente.
3. **Endereço + frete** (etapa 2): CEP, rua, número, complemento, cidade, UF. Ao digitar o CEP, calcula frete via Melhor Envio (API cotação) e mostra opções (PAC, SEDEX, etc.). Cliente escolhe uma.
4. **Pagamento** (etapa 3): resumo do pedido + total (produtos + frete). Cliente escolhe forma (Mercado Pago ou Stripe, conforme já configurado). Redireciona ao gateway.
5. **Retorno do gateway**: webhook público `/api/public/webhooks/{provider}` atualiza status do pedido para `paid`, dispara e-mail de "Pagamento aprovado" e marca o pedido do cliente. Página `/pagamento/sucesso` mostra toast "Pagamento aprovado!" e redireciona para `/meus-pedidos`.
6. **Meus pedidos** (`/_authenticated/meus-pedidos`): lista pedidos do cliente com status (Pagamento aprovado → Em produção → Enviado → Entregue), código de rastreio quando disponível, itens e valores.
7. **Admin** ganha ações para: marcar como "Em produção", inserir código de rastreio (muda para "Enviado"), marcar como "Entregue". Cada mudança dispara e-mail ao cliente.

## Mudanças técnicas

### Banco (migração)
- `orders`: adicionar `user_id uuid` (FK auth.users), `status` passa a aceitar `paid|in_production|shipped|delivered|failed`, `shipping_service text`, `shipping_zip`, `shipping_address` (jsonb), `tracking_code text`, `tracking_url text`, `paid_at`, `shipped_at`, `delivered_at`.
- RLS: cliente lê `orders`/`order_items` onde `user_id = auth.uid()`; admin lê tudo (via `has_role`).
- GRANTs adequados.
- Trigger para enviar e-mail em mudanças de status (via chamada ao endpoint de e-mail).

### Server functions / routes
- `src/lib/checkout.functions.ts`: passar a exigir auth (`requireSupabaseAuth`), gravar `user_id` no pedido, aceitar `shipping_service`, `shipping_address` e `shipping_cents` calculado no servidor (re-cotação para não confiar no cliente).
- `src/lib/shipping.functions.ts` (nova): `quoteShipping({ zip, items })` chama Melhor Envio via `MELHORENVIO_TOKEN` (secret) usando dimensões default e retorna opções.
- `src/routes/api/public/webhooks/mercadopago.ts` e `stripe.ts`: recebem callback, verificam assinatura, atualizam pedido para `paid` e enfileiram e-mail.
- `src/lib/orders.functions.ts` (nova): `listMyOrders`, `getMyOrder`, e admin `updateOrderStatus`, `setTracking`.

### Frontend
- `src/routes/checkout.tsx`: fluxo em 3 etapas (stepper), força login antes.
- `src/routes/_authenticated/meus-pedidos.tsx`: lista + detalhes.
- `src/routes/pagamento.sucesso.tsx` e `pagamento.falha.tsx`: telas com toast e redirecionamento.
- Header ganha link "Meus pedidos" quando logado.
- Painel admin ganha aba "Pedidos" com ações de status/rastreio.

### E-mail
- Configurar Lovable Emails (email domain + infra + templates): "pagamento-aprovado", "em-producao", "enviado" (com código de rastreio), "entregue".
- Envio disparado do webhook (aprovado) e das ações admin (produção/enviado/entregue).

### Secrets necessários
- `MELHORENVIO_TOKEN` (o usuário precisa fornecer — token do Melhor Envio Sandbox ou produção).
- Domínio de e-mail (o usuário precisa configurar no painel de emails).

## Ordem de execução
1. Solicitar secret do Melhor Envio + iniciar setup do domínio de e-mail.
2. Migração do banco (orders + policies + user_id).
3. Server functions (shipping, orders, checkout atualizado).
4. Webhooks públicos.
5. Páginas frontend (checkout, meus pedidos, sucesso/falha).
6. Admin: aba de pedidos com ações de status.
7. Templates e triggers de e-mail.
8. Testes: fluxo completo em sandbox.

## Observações
- Para o Melhor Envio funcionar preciso do token da conta do cliente (Sandbox ou Produção) e das dimensões padrão dos produtos — uso 20x15x5cm 300g como default se o produto não tiver, e o admin pode ajustar depois se quiser.
- O envio de e-mail exige que você configure um domínio próprio (ex.: `notify.bfartedesign.shop`) no painel de Emails. Sem isso, uso apenas a notificação na tela e adiciono e-mail quando o domínio estiver pronto.
- Vou usar as configurações de pagamento já existentes (`payment_settings`) — Mercado Pago ou Stripe conforme o admin habilitou.