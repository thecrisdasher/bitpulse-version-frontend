'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Página principal de autenticación
 * Permite alternar entre login y registro con animaciones suaves
 */

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Animated background with BitPulse theme colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-accent/10" />
      
      {/* Floating particles animation */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              scale: 0 
            }}
            animate={{
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1200),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              scale: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 30 + 20,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Glowing orbs with theme colors */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.3, 0.1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Main card with enhanced animations */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.8, 
          ease: [0.6, -0.05, 0.01, 0.99],
          staggerChildren: 0.1
        }}
        className="relative z-10 w-full max-w-md"
      >
        <motion.div 
          className="bg-card/80 backdrop-blur-xl border border-border rounded-lg shadow-2xl p-8"
          whileHover={{ 
            scale: 1.01,
            boxShadow: "0 25px 50px -12px hsl(var(--primary) / 0.3)"
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Logo and title with stagger animation */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <motion.div
              className="relative inline-block"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="w-16 h-16 bg-gradient-to-r from-primary to-primary/80 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg"
                animate={{
                  boxShadow: [
                    "0 0 20px hsl(var(--primary) / 0.4)",
                    "0 0 30px hsl(var(--primary) / 0.6)",
                    "0 0 20px hsl(var(--primary) / 0.4)"
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <span className="text-2xl font-bold text-primary-foreground">₿</span>
              </motion.div>
            </motion.div>
            
            <motion.h1 
              className="text-3xl font-bold text-foreground mb-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              BitPulse
            </motion.h1>
            
            <motion.p 
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              Sistema de Trading Avanzado
            </motion.p>
          </motion.div>

          {/* Tabs with enhanced animations */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger 
                  value="login" 
                  className="transition-all duration-300"
                >
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Iniciar Sesión
                  </motion.span>
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="transition-all duration-300"
                >
                  <motion.span
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Registrarse
                  </motion.span>
                </TabsTrigger>
              </TabsList>
            </motion.div>

            {/* Form content with enhanced page transitions */}
            <AnimatePresence mode="wait">
              <TabsContent value="login" className="space-y-4">
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: activeTab === 'login' ? 0 : -30, rotateY: -5 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: 30, rotateY: 5 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: [0.4, 0, 0.2, 1],
                    staggerChildren: 0.05
                  }}
                >
                  <LoginForm />
                </motion.div>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: activeTab === 'register' ? 0 : 30, rotateY: 5 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={{ opacity: 0, x: -30, rotateY: -5 }}
                  transition={{ 
                    duration: 0.4, 
                    ease: [0.4, 0, 0.2, 1],
                    staggerChildren: 0.05
                  }}
                >
                  <RegisterForm />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>

          {/* Decorative bottom element */}
          <motion.div 
            className="mt-8 pt-6 border-t border-border"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.5 }}
          >
            <motion.p 
              className="text-center text-muted-foreground text-sm flex items-center justify-center gap-2"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-primary">🔒</span>
              Seguro y Confiable
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
} 