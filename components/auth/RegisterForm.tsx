'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Loader2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import type { RegisterData } from '@/lib/types/auth';
import { PrivacyPolicyModal } from '@/components/ui/privacy-policy-modal';
import { TermsConditionsModal } from '@/components/ui/terms-conditions-modal';

/**
 * Esquema de validación para el formulario de registro
 */
const registerSchema = z.object({
  firstName: z
    .string()
    .min(1, 'El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  lastName: z
    .string()
    .min(1, 'El apellido es requerido')
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  username: z
    .string()
    .min(1, 'El nombre de usuario es requerido')
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(20, 'El nombre de usuario no puede exceder 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones bajos permitidos'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Formato de email inválido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/\d/, 'Debe contener al menos un número')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Debe contener al menos un caracter especial'),
  confirmPassword: z
    .string()
    .min(1, 'Confirmar contraseña es requerido'),
  acceptTerms: z
    .boolean()
    .refine(val => val === true, 'Debes aceptar los términos y condiciones')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

// Función para generar nombre de usuario a partir de nombre y apellido
const generateUsername = (firstName: string, lastName: string): string => {
  if (!firstName || !lastName) return '';
  
  // Normalizar strings: remover acentos, convertir a lowercase, y remover caracteres especiales
  const normalize = (str: string) => str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ''); // Solo letras y números
  
  const normalizedFirstName = normalize(firstName);
  const normalizedLastName = normalize(lastName);
  
  // Generar username como nombre + apellido, limitado a 18 caracteres para dejar espacio para números
  let username = (normalizedFirstName + normalizedLastName).substring(0, 18);
  
  return username;
};

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsConditions, setShowTermsConditions] = useState(false);
  const { register: registerUser, isLoading } = useAuth();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setError,
    setValue
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false
    }
  });

  const firstName = watch('firstName');
  const lastName = watch('lastName');
  const password = watch('password');

  // Efecto para generar automáticamente el nombre de usuario
  useEffect(() => {
    const generatedUsername = generateUsername(firstName, lastName);
    if (generatedUsername) {
      setValue('username', generatedUsername, { shouldValidate: true });
    }
  }, [firstName, lastName, setValue]);

  // Calcular fuerza de la contraseña
  const calculatePasswordStrength = (password: string): { score: number; feedback: string[] } => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
      feedback.push('✓ Al menos 8 caracteres');
    } else {
      feedback.push('✗ Al menos 8 caracteres');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
      feedback.push('✓ Letra mayúscula');
    } else {
      feedback.push('✗ Letra mayúscula');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
      feedback.push('✓ Letra minúscula');
    } else {
      feedback.push('✗ Letra minúscula');
    }

    if (/\d/.test(password)) {
      score += 1;
      feedback.push('✓ Número');
    } else {
      feedback.push('✗ Número');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
      feedback.push('✓ Caracter especial');
    } else {
      feedback.push('✗ Caracter especial');
    }

    return { score, feedback };
  };

  const passwordStrength = calculatePasswordStrength(password || '');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const token = await executeRecaptcha?.('register') || '';
      const payload: RegisterData = { ...data, recaptchaToken: token };
      await registerUser(payload);
      toast.success('¡Cuenta creada exitosamente!');
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      
      // Manejar errores específicos
      if (message.includes('email ya está registrado')) {
        setError('email', { message: 'Este email ya está registrado' });
      } else if (message.includes('nombre de usuario ya está en uso')) {
        setError('username', { message: 'Este nombre de usuario ya está en uso' });
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">Mello Trader</span>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center">Crear Cuenta</CardTitle>
        <CardDescription className="text-center">
          Únete a Mello Trader y comienza tu experiencia de trading
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="firstName"
                  placeholder="Juan"
                  className="pl-10"
                  {...register('firstName')}
                  disabled={isSubmitting || isLoading}
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="lastName"
                  placeholder="Pérez"
                  className="pl-10"
                  {...register('lastName')}
                  disabled={isSubmitting || isLoading}
                />
              </div>
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Nombre de Usuario</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="username"
                placeholder="Se genera automáticamente"
                className="pl-10 bg-gray-50 text-gray-600"
                {...register('username')}
                disabled={true}
                readOnly={true}
              />
            </div>
            <p className="text-xs text-gray-500">
              Se genera automáticamente a partir de tu nombre y apellido
            </p>
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="juan@email.com"
                className="pl-10"
                {...register('email')}
                disabled={isSubmitting || isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña segura"
                className="pl-10 pr-10"
                {...register('password')}
                disabled={isSubmitting || isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                disabled={isSubmitting || isLoading}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}

            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Fuerza de contraseña</span>
                  <span className={`text-sm ${
                    passwordStrength.score <= 2 ? 'text-red-500' :
                    passwordStrength.score <= 4 ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {passwordStrength.score <= 2 ? 'Débil' :
                     passwordStrength.score <= 4 ? 'Media' :
                     'Fuerte'}
                  </span>
                </div>
                <Progress 
                  value={(passwordStrength.score / 5) * 100} 
                  className="h-2"
                />
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {passwordStrength.feedback.map((item, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center ${
                        item.startsWith('✓') ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirma tu contraseña"
                className="pl-10 pr-10"
                {...register('confirmPassword')}
                disabled={isSubmitting || isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-600"
                disabled={isSubmitting || isLoading}
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2">
            <Controller
              name="acceptTerms"
              control={control}
              render={({ field }) => (
                <Checkbox
                  id="acceptTerms"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting || isLoading}
                  className="mt-1"
                />
              )}
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="acceptTerms"
                className="text-sm font-normal cursor-pointer"
              >
                Acepto los{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  onClick={() => setShowTermsConditions(true)}
                >
                  términos y condiciones
                </button>{' '}
                y la{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                  onClick={() => setShowPrivacyPolicy(true)}
                >
                  política de privacidad
                </button>
              </Label>
            </div>
          </div>
          {errors.acceptTerms && (
            <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || isLoading}
          >
            {(isSubmitting || isLoading) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Crear Cuenta
              </>
            )}
          </Button>
        </form>

        {/* Link to Login */}
        {onSwitchToLogin && (
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                Inicia sesión aquí
              </button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Modal de Política de Privacidad */}
      <PrivacyPolicyModal 
        open={showPrivacyPolicy} 
        onOpenChange={setShowPrivacyPolicy} 
      />

      {/* Modal de Términos y Condiciones */}
      <TermsConditionsModal 
        open={showTermsConditions} 
        onOpenChange={setShowTermsConditions} 
      />
    </Card>
  );
} 