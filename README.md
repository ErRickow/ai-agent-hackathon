## Local

```bash
pnpm i && pnpm dev
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