<center><b>Proyek Event AI Agent Hackathon</b></center>
<center>Tema: AI Agent For Kemerdekaan Indonesia</center>

Preview Landing             |  Preview Sidebar
:-------------------------:|:-------------------------:
![Demo Landing](/public/demonya.jpg)(https://agentic-merdeka.vercel.app)
  |  ![Demo Sidebar](/public/demonya-sidebar.jpg)(https://agentic-merdeka.vercel.app)

### One Click Deploy
---
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FErRickow%2Fai-agent-hackathon&env=MAILRY_API_KEY,LUNOS_KEY,UNLI_KEY,NEXT_PUBLIC_FIREBASE_APP_ID,NEXT_PUBLIC_FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_PROJECT_ID,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,JWT_SECRET&project-name=er-project-agnetic-merdeka&repository-name=ai-agent-hackathon&demo-title=Agentic%20Merdeka&demo-description=Complete%20AI%20platform%20with%20chat%2C%20image%20generation%2C%20vision%2C%20TTS%2C%20and%20embeddings&demo-url=https%3A%2F%2Fagentic-merdeka.vercel.app&demo-image=https://github.com/ErRickow/ai-agent-hackathon/blob/main/public/download.png)

### Local Development
---

**Clone Project**
```bash
git clone https://github.com/ErRickow/ai-agent-hackathon
```
**Buat file .env.local**
```txt
# Main requirement
MAILRY_API_KEY="ISI_APIKEY_MAILRY"
LUNOS_KEY="ISI_LUNOS_APIKEY"
UNLI_KEY="ISI_UNLI_APIKEY"

# Databases
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""

# Protegsi
JWT_SECRET="" # token jwt
CSRF_SECRET="" # random id 16 - 36
```

Reference:
  - [Mailry](https://local-tortoise-195.notion.site/Mailry-co-Documentation-253fabc60ef48027a91cd5e8ceed6098?pvs=73)
  - [Lunos](https://lunos.tech/docs/quickstart)
  - [Unli](https://docs.unli.dev/quicstart)
  - [Firebase](https://firebase.google.com/docs/firestore/quickstart?hl=id)
  - [Jwt Secret](https://jwtsecrets.com/tools/jwt-encode)
  - [Csrf Secret](https://stackoverflow.com/questions/1805838/csrf-token-generation)

---
**Installasi**
```bash
npm i -g pnpm -q
```

```bash
pnpm i remark-breaks -q # lockfile belum ada remark-breaks jadi install manual
```

```bash
pnpm dev
```
---
**Build Proyek**
```bash
pnpm run build
```
---
**Serve Production**
```bash
pnpm start
```

### Firebase Rule

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Aturan untuk verifikasi kode OTP
    match /auth_codes/{docId} {
      allow create, read, delete: if true;
    }

    // Aturan untuk data pengguna dan percakapan
    match /users/{userId} {
      // PERINGATAN: Aturan ini tidak aman untuk produksi.
      // Aturan ini mengizinkan siapa saja untuk membaca dan menulis
      // ke dokumen pengguna mana pun.
      allow read, write: if true;
    }
    match /guests/{guestId} {
      allow read, write: if true;
    }
  }
}
```

## Project Structure
```
ai-agent-hackathon/
├── .gitignore
├── app/
│   ├── android-chrome-192x192.png
│   ├── api/ <=== Api Logic
│   │   ├── auth/
│   │   │   ├── logout/
│   │   │   │   └── route.ts
│   │   │   ├── me/
│   │   │   │   └── route.ts
│   │   │   ├── send-code/
│   │   │   │   └── route.ts
│   │   │   └── verify-code/
│   │   │       └── route.ts
│   │   ├── chat/
│   │   │   └── route.ts
│   │   ├── csrf/
│   │   │   └── route.ts
│   │   ├── embedding/
│   │   │   └── route.ts
│   │   ├── guest-chat/
│   │   │   └── route.ts
│   │   ├── image/
│   │   │   └── route.ts
│   │   ├── messages/
│   │   │   └── route.ts
│   │   ├── models/
│   │   │   └── route.ts
│   │   ├── tts/
│   │   │   └── route.ts
│   │   └── vision/
│   │       └── route.ts
│   ├── apple-touch-icon.png
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout-client.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── site.webmanifest
├── components/ <=== Components Utama
│   ├── ai-agent.tsx
│   ├── ai-sidebar.tsx
│   ├── button-copy.tsx
│   ├── chat-interface.tsx
│   ├── code-block.tsx
│   ├── core/
│   │   ├── text-effect.tsx
│   │   └── text-shimmer.tsx
│   ├── embedding-interface.tsx
│   ├── image-generation-interface.tsx
│   ├── login-modal.tsx
│   ├── markdown.tsx
│   ├── persona-settings-dialog.tsx
│   ├── persona.tsx
│   ├── text-morph.tsx
│   ├── theme-provider.tsx
│   ├── tts-interface.tsx
│   ├── ui/
│   │   ├── alert-dialog.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input-otp.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── sheet.tsx
│   │   ├── switch.tsx
│   │   ├── textarea.tsx
│   │   └── tooltip.tsx
│   └── vision-interface.tsx
├── components.json
├── lib/ <=== Prompt/Database/Csrf Logic
│   ├── csrf.ts
│   ├── firebase.ts
│   ├── hooks/
│   │   └── use-auto-scroll.ts
│   ├── prompts/ <=== Prompt Yang di gunakan
│   │   ├── assistant.ts
│   │   ├── excel-expert.ts
│   │   ├── intent-classifier.ts
│   │   ├── latex-legend.ts
│   │   ├── merdeka-ai.ts
│   │   └── quiz-creator.ts
│   ├── tanstack-query/
│   │   └── tanstack-query-provider.tsx
│   └── utils.ts
├── middleware.ts
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── public/ <=== Static assets //\ tidak digunakan sama sekali 🗿
│   ├── placeholder-logo.png
│   ├── placeholder-logo.svg
│   ├── placeholder-user.jpg
│   ├── placeholder.jpg
│   └── placeholder.svg
├── README.md
├── styles/
│   └── globals.css
└── tsconfig.json
```