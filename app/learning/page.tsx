'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { GamifiedLearningCenter } from '@/components/interactive-help/GamifiedLearningCenter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Trophy, 
  Target, 
  Brain,
  Gamepad2,
  Star,
  Zap,
  Users,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LearningPage() {
  const [activeSection, setActiveSection] = useState('overview');

  const learningStats = [
    {
      title: 'Lecciones Completadas',
      value: '12',
      total: '45',
      icon: BookOpen,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Puntos de Experiencia',
      value: '1,250',
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
    },
    {
      title: 'Racha Actual',
      value: '7',
      unit: 'días',
      icon: Zap,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      title: 'Ranking Global',
      value: '#47',
      icon: Trophy,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 p-6 overflow-auto">
          <div className="container mx-auto max-w-7xl">
            {/* Header */}
            <div className="mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Centro de Aprendizaje BitPulse
                </h1>
                <p className="text-lg text-muted-foreground">
                  Domina el trading con nuestro sistema de aprendizaje gamificado e interactivo
                </p>
              </motion.div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {learningStats.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            {stat.title}
                          </p>
                          <div className="flex items-baseline gap-2">
                            <p className="text-2xl font-bold">
                              {stat.value}
                            </p>
                            {stat.total && (
                              <span className="text-sm text-muted-foreground">
                                / {stat.total}
                              </span>
                            )}
                            {stat.unit && (
                              <span className="text-sm text-muted-foreground">
                                {stat.unit}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`p-3 rounded-full ${stat.bgColor}`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { id: 'overview', label: 'Resumen', icon: TrendingUp },
                { id: 'lessons', label: 'Lecciones', icon: BookOpen },
                { id: 'simulator', label: 'Simulador', icon: Target },
                { id: 'achievements', label: 'Logros', icon: Award },
                { id: 'community', label: 'Comunidad', icon: Users }
              ].map((tab) => (
                <Button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`flex items-center gap-2 ${
                    activeSection === tab.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Main Content */}
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeSection === 'overview' && (
                <div className="space-y-6">
                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-purple-500" />
                        Acciones Rápidas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg text-center">
                          <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                          <h3 className="font-medium mb-1">Continuar Aprendiendo</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Retoma donde lo dejaste
                          </p>
                          <Button className="w-full">
                            Continuar Lección
                          </Button>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg text-center">
                          <Target className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <h3 className="font-medium mb-1">Simulador</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Practica sin riesgo
                          </p>
                          <Button className="w-full">
                            Iniciar Simulación
                          </Button>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg text-center">
                          <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                          <h3 className="font-medium mb-1">Desafío Diario</h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            Gana puntos extra
                          </p>
                          <Button className="w-full">
                            Ver Desafío
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Progress Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Tu Progreso</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Nivel Básico</span>
                              <span>8/10</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Nivel Intermedio</span>
                              <span>3/8</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '37.5%' }}></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Nivel Avanzado</span>
                              <span>0/5</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-red-500 h-2 rounded-full" style={{ width: '0%' }}></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Próximos Logros</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <span className="text-lg">🎯</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Maestro del Análisis</p>
                              <p className="text-xs text-muted-foreground">Completa 5 lecciones de análisis técnico</p>
                            </div>
                            <Badge>3/5</Badge>
                          </div>
                          <div className="flex items-center gap-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <span className="text-lg">🚀</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Trader Consistente</p>
                              <p className="text-xs text-muted-foreground">Mantén una racha de 14 días</p>
                            </div>
                            <Badge>7/14</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {(activeSection === 'lessons' || activeSection === 'simulator' || 
                activeSection === 'achievements' || activeSection === 'community') && (
                <GamifiedLearningCenter />
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
} 