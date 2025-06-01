'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      await login(data);
    } catch (error) {
      toast.error('Error al iniciar sesión', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputVariants = {
    rest: { scale: 1, boxShadow: "0 0 0 0px hsl(var(--ring) / 0)" },
    focus: { 
      scale: 1.005, 
      boxShadow: "0 0 0 2px hsl(var(--ring) / 0.2)",
      transition: { duration: 0.2 }
    },
    error: {
      scale: [1, 1.01, 1],
      boxShadow: "0 0 0 2px hsl(var(--destructive) / 0.3)",
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, staggerChildren: 0.1 }}
    >
      <motion.div 
        className="text-center space-y-2"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <motion.h2 
          className="text-xl font-semibold text-foreground"
          animate={{ 
            color: [
              "hsl(var(--foreground))",
              "hsl(var(--primary))",
              "hsl(var(--foreground))"
            ]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          ¡Bienvenido de vuelta!
        </motion.h2>
        <motion.p 
          className="text-muted-foreground text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Ingresa a tu cuenta para continuar
        </motion.p>
      </motion.div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            Email
          </Label>
          <motion.div 
            className="relative"
            variants={inputVariants}
            initial="rest"
            whileFocus="focus"
            animate={form.formState.errors.email ? "error" : "rest"}
          >
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              className="pl-10 transition-all duration-200"
              {...form.register('email')}
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </motion.div>
          <AnimatePresence>
            {form.formState.errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="text-destructive text-sm"
              >
                {form.formState.errors.email.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Contraseña
          </Label>
          <motion.div 
            className="relative"
            variants={inputVariants}
            initial="rest"
            whileFocus="focus"
            animate={form.formState.errors.password ? "error" : "rest"}
          >
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pl-10 pr-12 transition-all duration-200"
              {...form.register('password')}
            />
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </motion.button>
          </motion.div>
          <AnimatePresence>
            {form.formState.errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="text-destructive text-sm"
              >
                {form.formState.errors.password.message}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full relative overflow-hidden group"
          >
            <motion.div 
              className="flex items-center justify-center gap-2"
              animate={isLoading ? { x: [0, 2, -2, 0] } : {}}
              transition={{ duration: 0.4, repeat: isLoading ? Infinity : 0 }}
            >
              {isLoading ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </>
              )}
            </motion.div>
            
            <motion.div
              className="absolute inset-0 bg-primary/20 rounded"
              initial={{ scale: 0, opacity: 0 }}
              whileHover={{ 
                scale: [0, 1, 1.5],
                opacity: [0, 0.3, 0],
              }}
              transition={{ duration: 0.6 }}
            />
          </Button>
        </motion.div>
      </form>

      <motion.div 
        className="mt-6 p-4 bg-muted/30 backdrop-blur-sm rounded-lg border border-border"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <motion.div 
          className="flex items-center justify-center gap-2 mb-3"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-primary">🎯</span>
          <h3 className="text-sm font-medium text-foreground">Cuentas Demo Disponibles</h3>
        </motion.div>
        
        <div className="space-y-2 text-xs">
          <motion.div 
            className="flex items-center justify-between p-2 rounded bg-background/50 hover:bg-background/80 transition-colors"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-medium">Admin</div>
              <span className="text-muted-foreground">admin@bitpulse.com</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-center justify-between p-2 rounded bg-background/50 hover:bg-background/80 transition-colors"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs font-medium">Maestro</div>
              <span className="text-muted-foreground">maestro@bitpulse.com</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-center justify-between p-2 rounded bg-background/50 hover:bg-background/80 transition-colors"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 border border-border text-foreground rounded text-xs font-medium">Cliente</div>
              <span className="text-muted-foreground">cliente@bitpulse.com</span>
            </div>
          </motion.div>
          
          <motion.p 
            className="text-center text-muted-foreground text-xs mt-3 pt-2 border-t border-border"
            animate={{ opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            Contraseñas: Admin123! / Maestro123! / Cliente123!
          </motion.p>
        </div>
      </motion.div>
    </motion.div>
  );
} 