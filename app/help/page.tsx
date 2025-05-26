"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  HelpCircle, 
  Search, 
  Book, 
  MessageSquare, 
  Video, 
  Download,
  ExternalLink,
  CheckCircle,
  ArrowRight,
  Phone,
  Mail,
  Clock,
  Star,
  PlayCircle,
  FileText,
  Lightbulb,
  Users,
  TrendingUp,
  BarChart3,
  Shield,
  Zap
} from "lucide-react";

// Datos de FAQ
const FAQ_DATA = [
  {
    id: 'getting-started',
    category: 'Primeros Pasos',
    questions: [
      {
        question: '¿Cómo empiezo a hacer trading en BitPulse?',
        answer: 'Para empezar en BitPulse: 1) Crea tu cuenta y verifica tu identidad, 2) Realiza tu primer depósito, 3) Explora la plataforma con nuestra cuenta demo, 4) Toma nuestro curso básico de trading, 5) Comienza con operaciones pequeñas usando Stop Loss.'
      },
      {
        question: '¿Qué es una cuenta demo y cómo la uso?',
        answer: 'Una cuenta demo te permite practicar trading sin dinero real. Incluye $10,000 virtuales para que pruebes estrategias, aprendas a usar la plataforma y ganes confianza antes de invertir dinero real.'
      },
      {
        question: '¿Cuál es el depósito mínimo?',
        answer: 'El depósito mínimo es de $50 USD. Recomendamos empezar con una cantidad que puedas permitirte perder mientras aprendes.'
      }
    ]
  },
  {
    id: 'platform',
    category: 'Plataforma',
    questions: [
      {
        question: '¿Cómo interpretar los gráficos de trading?',
        answer: 'Los gráficos muestran el movimiento de precios. Las velas verdes indican subida, las rojas bajada. Puedes cambiar entre diferentes tipos: línea, área, velas japonesas y barras. Cada vela representa un período de tiempo específico.'
      },
      {
        question: '¿Qué significan los indicadores técnicos?',
        answer: 'Los indicadores técnicos son herramientas que analizan datos históricos de precios para predecir movimientos futuros. Ejemplos incluyen RSI (sobrecompra/sobreventa), Medias Móviles (tendencias) y MACD (momentum).'
      },
      {
        question: '¿Puedo operar desde mi móvil?',
        answer: 'Sí, BitPulse es totalmente responsivo y funciona perfectamente en dispositivos móviles. También puedes descargar nuestra app nativa para una experiencia optimizada.'
      }
    ]
  },
  {
    id: 'trading',
    category: 'Trading',
    questions: [
      {
        question: '¿Qué es el apalancamiento y cómo funciona?',
        answer: 'El apalancamiento te permite operar con más dinero del que tienes. Por ejemplo, con apalancamiento 1:10, puedes operar $1000 con solo $100. Aumenta ganancias potenciales pero también riesgos.'
      },
      {
        question: '¿Qué son Stop Loss y Take Profit?',
        answer: 'Stop Loss es una orden que cierra tu operación automáticamente si el precio se mueve en contra tuya, limitando pérdidas. Take Profit cierra automáticamente cuando alcanzas tu objetivo de ganancia.'
      },
      {
        question: '¿Cuáles son los horarios de trading?',
        answer: 'Los mercados tradicionales operan L-V 9:30-16:00 EST. Las criptomonedas operan 24/7. Los índices de volatilidad sintética están disponibles 24/7 excepto domingos por mantenimiento.'
      }
    ]
  },
  {
    id: 'account',
    category: 'Cuenta y Seguridad',
    questions: [
      {
        question: '¿Cómo protejo mi cuenta?',
        answer: 'Activa autenticación de dos factores (2FA), usa contraseñas fuertes, nunca compartas tus credenciales, y habilita notificaciones de login. También verifica siempre la URL oficial.'
      },
      {
        question: '¿Cómo retiro mis ganancias?',
        answer: 'Ve a "Retiros" en tu cuenta, selecciona el método (transferencia bancaria, billetera digital), ingresa el monto y confirma. Los retiros se procesan en 1-3 días hábiles.'
      },
      {
        question: '¿Hay límites de retiro?',
        answer: 'Los límites dependen de tu nivel de verificación. Cuentas verificadas básicas: $2,000/día. Verificación completa: $10,000/día. VIP: límites personalizados.'
      }
    ]
  }
];

// Datos de guías
const GUIDES_DATA = [
  {
    id: 'beginner-guide',
    title: 'Guía para Principiantes',
    description: 'Todo lo que necesitas saber para empezar en el trading',
    duration: '30 min',
    level: 'Principiante',
    topics: ['Conceptos básicos', 'Tipos de órdenes', 'Gestión de riesgo', 'Primeros pasos'],
    icon: Book
  },
  {
    id: 'technical-analysis',
    title: 'Análisis Técnico',
    description: 'Aprende a leer gráficos e indicadores como un profesional',
    duration: '45 min',
    level: 'Intermedio',
    topics: ['Patrones de velas', 'Indicadores técnicos', 'Soportes y resistencias', 'Tendencias'],
    icon: BarChart3
  },
  {
    id: 'risk-management',
    title: 'Gestión de Riesgo',
    description: 'Protege tu capital con estrategias probadas',
    duration: '25 min',
    level: 'Intermedio',
    topics: ['Position sizing', 'Stop Loss avanzado', 'Diversificación', 'Psicología del trading'],
    icon: Shield
  },
  {
    id: 'advanced-strategies',
    title: 'Estrategias Avanzadas',
    description: 'Técnicas profesionales para traders experimentados',
    duration: '60 min',
    level: 'Avanzado',
    topics: ['Scalping', 'Swing trading', 'Arbitraje', 'Trading algorítmico'],
    icon: Zap
  }
];

// Datos de videos tutoriales
const VIDEOS_DATA = [
  {
    id: 'platform-overview',
    title: 'Visión General de la Plataforma',
    description: 'Conoce todas las funciones de BitPulse en 10 minutos',
    duration: '10:32',
    views: '15.2K',
    thumbnail: '/thumbnails/platform-overview.jpg'
  },
  {
    id: 'first-trade',
    title: 'Tu Primera Operación',
    description: 'Paso a paso para hacer tu primer trade exitoso',
    duration: '8:45',
    views: '23.1K',
    thumbnail: '/thumbnails/first-trade.jpg'
  },
  {
    id: 'reading-charts',
    title: 'Cómo Leer Gráficos',
    description: 'Interpreta las velas japonesas y patrones básicos',
    duration: '12:18',
    views: '18.7K',
    thumbnail: '/thumbnails/reading-charts.jpg'
  },
  {
    id: 'risk-management-video',
    title: 'Gestión de Riesgo en la Práctica',
    description: 'Aprende a proteger tu capital con ejemplos reales',
    duration: '15:20',
    views: '12.3K',
    thumbnail: '/thumbnails/risk-management.jpg'
  }
];

const HelpPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Centro de Ayuda</h1>
        <p className="text-muted-foreground">
          Encuentra respuestas y aprende nuevas estrategias
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en la ayuda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-base"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Preguntas Frecuentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Encuentra respuestas rápidas a las dudas más comunes
            </p>
            <Button className="w-full">
              Ver FAQ
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Guías de Trading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Aprende desde lo básico hasta estrategias avanzadas
            </p>
            <Button className="w-full">
              Explorar Guías
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat en Vivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Habla con nuestros mentores especializados
            </p>
            <Button className="w-full" asChild>
              <a href="/chat">
                Iniciar Chat
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Video Tutoriales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Aprende visualmente con nuestros videos explicativos
            </p>
            <Button className="w-full">
              Ver Videos
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Soporte Técnico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Contacta nuestro equipo para ayuda personalizada
            </p>
            <Button className="w-full">
              Contactar
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Recursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Descarga manuales, plantillas y herramientas
            </p>
            <Button className="w-full">
              Descargar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpPage; 