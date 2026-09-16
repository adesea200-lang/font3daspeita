FONTE DAS PEITA • versão com salvamento permanente

1) Abra o Supabase do projeto.
2) Vá em SQL Editor → New query.
3) Cole o conteúdo de SUPABASE_SETUP.sql e clique em Run.
4) Vá em Storage → New bucket → nome EXATO: site-images → marque Public bucket.
5) Abra o site.
6) Entre no Painel com a senha 050423.
7) Adicione/troque as fotos das camisas e banners. Elas serão enviadas para o Storage e os links ficam gravados no banco.

IMPORTANTE
- A publishable key usada pelo site é apropriada para código público; não coloque secret/service_role key no site.
- A senha do painel deste protótipo é uma proteção de interface, não autenticação forte. Para uma loja publicada em produção, o ideal é migrar o painel para Supabase Auth/usuário administrador.
- Imagens de até 6 MB usam upload padrão.
