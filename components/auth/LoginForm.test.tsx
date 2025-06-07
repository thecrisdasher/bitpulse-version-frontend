import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoginForm } from './LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Mock del hook useAuth
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock de sonner
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

// Mock de lucide-react para evitar problemas con los iconos
jest.mock('lucide-react', () => {
  const originalModule = jest.requireActual('lucide-react');
  return {
    ...originalModule,
    LogIn: () => <svg>login-icon</svg>,
    Mail: () => <svg>mail-icon</svg>,
    Lock: () => <svg>lock-icon</svg>,
    Eye: () => <svg>eye-icon</svg>,
    EyeOff: () => <svg>eye-off-icon</svg>,
  };
});


describe('LoginForm', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
    });
    jest.clearAllMocks();
  });

  // Test 1: El componente se renderiza correctamente
  it('should render the form with all fields and the submit button', () => {
    render(<LoginForm />);
    
    // Valida que el título sea visible
    expect(screen.getByRole('heading', { name: /¡Bienvenido de vuelta!/i })).toBeInTheDocument();

    // Valida que los campos de email y contraseña existan
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument();

    // Valida que el botón de inicio de sesión exista
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });

  // Test 2: Muestra errores de validación si los campos están vacíos
  it('should display validation errors when submitting with empty fields', async () => {
    render(<LoginForm />);
    
    // Simula el click en el botón sin rellenar los campos
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    // Valida que los mensajes de error aparezcan
    expect(await screen.findByText('Email inválido')).toBeInTheDocument();
    expect(await screen.findByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();
  });

  // Test 3: Muestra error de validación para un email inválido
  it('should display an error for an invalid email format', async () => {
    render(<LoginForm />);
    
    // Introduce un email con formato incorrecto
    fireEvent.input(screen.getByLabelText(/Email/i), {
      target: { value: 'test' },
    });

    // Simula el envío del formulario
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));
    
    // Valida que el mensaje de error para el email sea el correcto
    expect(await screen.findByText('Email inválido')).toBeInTheDocument();
  });

  // Test 4: Muestra error de validación para una contraseña corta
  it('should display an error for a password that is too short', async () => {
    render(<LoginForm />);

    // Introduce una contraseña demasiado corta
    fireEvent.input(screen.getByLabelText(/Contraseña/i), {
      target: { value: '123' },
    });

    // Simula el envío del formulario
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    // Valida que aparezca el mensaje de error correcto para la contraseña
    expect(await screen.findByText('La contraseña debe tener al menos 6 caracteres')).toBeInTheDocument();
  });

  // Test 5: Llama a la función de login con los datos correctos
  it('should call the login function with the correct credentials on successful submission', async () => {
    render(<LoginForm />);
    
    // Rellena el formulario con datos válidos
    fireEvent.input(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.input(screen.getByLabelText(/Contraseña/i), {
      target: { value: 'password123' },
    });

    // Simula el envío
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    // Espera a que la función de login sea llamada y valida los argumentos
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  // Test 6: Muestra un estado de carga durante el envío
  it('should show a loading state while submitting', async () => {
    // Hacemos que la función de login sea una promesa que no se resuelve
    // para poder ver el estado de carga.
    mockLogin.mockImplementation(() => new Promise(() => {}));

    render(<LoginForm />);
    
    // Rellena con datos válidos
    fireEvent.input(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.input(screen.getByLabelText(/Contraseña/i), {
      target: { value: 'password123' },
    });

    // Simula el envío
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    // Valida que el botón esté deshabilitado y muestre el texto de carga
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Iniciando sesión.../i })).toBeDisabled();
    });
  });

  // Test 7: Muestra un toast de error si el login falla
  it('should display an error toast if login fails', async () => {
    const errorMessage = 'Credenciales incorrectas';
    // Configuramos el mock para que rechace la promesa con un error
    mockLogin.mockRejectedValue(new Error(errorMessage));
    
    render(<LoginForm />);

    // Rellena con datos válidos
    fireEvent.input(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.input(screen.getByLabelText(/Contraseña/i), {
      target: { value: 'password123' },
    });

    // Simula el envío
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

    // Espera a que la función de toast sea llamada con el mensaje de error
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Error al iniciar sesión', {
        description: errorMessage,
      });
    });
  });
}); 