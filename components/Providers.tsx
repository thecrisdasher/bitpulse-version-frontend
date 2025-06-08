'use client';

import React from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { AuthProvider } from '@/contexts/AuthContext';
import { TradePositionsProvider } from '@/contexts/TradePositionsContext';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from 'sonner';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
      scriptProps={{ async: true, defer: true, appendTo: 'head' }}
    >
      <AuthProvider>
        <TradePositionsProvider>
          {children}
        </TradePositionsProvider>
      </AuthProvider>
      <Toaster />
      <SonnerToaster position="top-right" richColors closeButton duration={4000} />
    </GoogleReCaptchaProvider>
  );
} 