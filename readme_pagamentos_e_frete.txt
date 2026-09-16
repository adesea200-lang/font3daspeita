FONTE DAS PEITA — FRETE + PAGAMENTO

Antes de publicar no Netlify, configure estas variáveis em:
Site configuration > Environment variables

1) MELHOR_ENVIO_TOKEN
Token de produção do Melhor Envio.

2) ORIGIN_CEP
CEP de onde você envia as camisas. Somente números.

3) MERCADO_PAGO_ACCESS_TOKEN
Access Token de produção do Mercado Pago. NUNCA coloque essa chave dentro do código do site.

Opcional:
4) MERCADO_PAGO_WEBHOOK_URL
URL para receber notificações do Mercado Pago quando quiser automatizar a atualização de pedidos.

COMO FUNCIONA
- O cliente adiciona as camisas ao carrinho.
- Clica em finalizar pedido.
- Informa CEP e escolhe a opção de frete.
- Com 3 ou mais camisas o frete é automaticamente grátis.
- O botão cria uma preferência de pagamento no backend do Netlify.
- O cliente é levado ao checkout seguro do Mercado Pago para pagar por Pix/cartão conforme as opções habilitadas na sua conta.
- O WhatsApp continua como canal de suporte.

IMPORTANTE
As dimensões usadas para cotação são uma estimativa padrão de uma camisa embalada:
25 cm x 35 cm x 4 cm, 0,35 kg.
Se sua embalagem real for diferente, ajuste no arquivo:
netlify/functions/calculate-shipping.js

ATUALIZAÇÃO 2026-09-03 — PEDIDOS, ENDEREÇO E PERSONALIZAÇÃO

1) No Supabase, abra SQL Editor e rode novamente o arquivo supabase_setup.sql desta versão. Ele cria a tabela public.orders.
2) No Netlify, adicione a variável de ambiente:
   SUPABASE_SERVICE_ROLE_KEY = a chave secreta service_role do seu projeto Supabase.
   NÃO coloque essa chave em nenhum arquivo do site.
3) Faça novo deploy do projeto inteiro.
4) O checkout consulta o ViaCEP automaticamente ao digitar 8 dígitos e mostra rua/bairro/cidade/UF. O cliente informa o número e, opcionalmente, complemento.
5) Ao escolher personalização, aparecem os campos Nome na camisa e Número. O nome e número ficam gravados no pedido.
6) Ao iniciar o pagamento, o pedido é gravado como "Aguardando pagamento". O webhook do Mercado Pago atualiza automaticamente para aprovado, pendente, rejeitado etc.
7) No Painel > Pedidos, são exibidos cliente, contato, endereço, itens, tamanho, personalização, frete, total e status.
