"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';

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
      setError(data.error || 'Failed to send code.');
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
      setError(data.error || 'Verification failed.');
    } else {
      // Login berhasil, refresh halaman untuk mengambil sesi baru
      window.location.reload();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === 'email' ? 'Login to Continue' : 'Enter Verification Code'}</DialogTitle>
          <DialogDescription>
            {step === 'email' 
              ? 'Login To acces more message.'
              : `A code has been sent to ${email}. Please enter it below.`
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {step === 'email' ? (
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="code">6-Digit Code</Label>
              <Input id="code" type="text" placeholder="123456" value={code} onChange={(e) => setCode(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                Didn't get the code? **Check your spam/junk folder!**
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && !error && <p className="text-sm text-green-600">{message}</p>}
        </div>

        <Button onClick={step === 'email' ? handleSendCode : handleVerifyCode} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {step === 'email' ? 'Send Code' : 'Verify & Login'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}