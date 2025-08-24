"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [step, setStep] = useState < 'email' | 'code' > ('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const handleSendCode = async () => {
    setIsLoading(true);
    setError('');
    setMessage('');
    const res = await fetch('/api/auth/send-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setIsLoading(false);
    
    if (!res.ok) {
      setError(data.error || 'Gagal mengirim kode.');
    } else {
      setMessage(data.message);
      setStep('code');
    }
  };
  
  const handleVerifyCode = async () => {
    setIsLoading(true);
    setError('');
    const res = await fetch('/api/auth/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });
    const data = await res.json();
    setIsLoading(false);
    
    if (!res.ok) {
      setError(data.error || 'Verifikasi gagal.');
    } else {
      window.location.reload();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === 'email' ? 'Login untuk Melanjutkan' : 'Masukkan Kode Verifikasi'}</DialogTitle>
          <DialogDescription>
            {step === 'email' 
              ? 'Login untuk mendapatkan akses pesan lebih banyak.'
              : `Sebuah kode telah dikirim ke ${email}. Silakan masukkan di bawah ini.`
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {step === 'email' ? (
            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email</Label>
              <Input id="email" type="email" placeholder="anda@contoh.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          ) : (
            <div className="space-y-2 flex flex-col items-center">
              <Label htmlFor="code">Kode 6-Digit</Label>
              <InputOTP maxLength={6} value={code} onChange={(value) => setCode(value)}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <p className="text-xs text-muted-foreground pt-2">
                Tidak menerima kode? Cek folder spam/junk Anda!
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && !error && <p className="text-sm text-green-600">{message}</p>}
        </div>

        <Button onClick={step === 'email' ? handleSendCode : handleVerifyCode} disabled={isLoading} className="w-full">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {step === 'email' ? 'Kirim Kode' : 'Verifikasi & Login'}
        </Button>

        <div className="text-center mt-4">
          <a 
            href="https://mailry.co/?utm_source=ai-agent-hackathon" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <img 
              src="https://www.google.com/s2/favicons?sz=16&domain_url=https://mailry.co" 
              alt="Mailry favicon" 
              width={16} 
              height={16} 
            />
            <span>Otentikasi email didukung oleh Mailry</span>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}