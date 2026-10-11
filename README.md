# Ana Julya Duarte Nail Designer — site de agendamento

Site estático (HTML/CSS/JS) + Supabase (banco e login, plano grátis). Sem build, sem Node.

- `index.html` → página do cliente (divulgue este link)
- `admin.html` → painel da administradora (login com e-mail e senha; não divulgue)

## 1. Banco de dados (Supabase, grátis)
1. Crie conta em supabase.com e um projeto novo.
2. SQL Editor → New query → cole `supabase/schema.sql` → Run.
3. Authentication → Providers → Email: **desative "Allow new users to sign up"**.
4. Authentication → Users → Add user → crie o e-mail e a senha da administradora (único acesso ao painel).
5. Project Settings → API: copie **Project URL** e a chave **anon public** para `js/config.js`.

## 2. Testar no VS Code
Instale a extensão **Live Server**, clique com o direito em `index.html` → Open with Live Server.
Abra `admin.html`, entre e configure: chave Pix, serviços, preços, horários e dias.

## 3. Publicar (grátis)
Suba a pasta para um repositório no GitHub e conecte a uma hospedagem estática:
- **Cloudflare Pages** (recomendado): Create project → Connect to Git → Framework: None, build command vazio, output directory `/`.
- Alternativas: Netlify ou Render (Static Site). Não use o plano grátis da Vercel para negócio: é só para uso não comercial.

## 4. Divulgar
Coloque o link de `index.html` na bio do Instagram e envie no WhatsApp. O Supabase grátis pausa o projeto após ~7 dias sem uso; basta reativar no painel (ou agendar uma visita semanal ao site).
