'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Trophy, 
  Star, 
  Play, 
  CheckCircle,
  Lock,
  Target,
  Brain,
  Zap,
  Award,
  Gamepad2,
  Lightbulb,
  TrendingUp,
  Shield,
  Rocket,
  Users,
  MessageSquare,
  Video,
  FileText,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'interactive' | 'quiz' | 'simulation';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  completed: boolean;
  locked: boolean;
  points: number;
  badge?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  completed: boolean;
  progress: number;
  maxProgress: number;
  points: number;
}

export function GamifiedLearningCenter() {
  const [selectedCategory, setSelectedCategory] = useState('basics');
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [userLevel, setUserLevel] = useState(3);
  const [totalPoints, setTotalPoints] = useState(1250);
  const [currentStreak, setCurrentStreak] = useState(7);

  const [lessons] = useState<Record<string, Lesson[]>>({
    basics: [
      {
        id: 'b1',
        title: 'Introducción al Trading',
        description: 'Conceptos fundamentales del trading financiero',
        type: 'video',
        difficulty: 'beginner',
        duration: 15,
        completed: true,
        locked: false,
        points: 100,
        badge: '🎯'
      },
      {
        id: 'b2',
        title: 'Análisis Técnico Básico',
        description: 'Aprende a leer gráficos y patrones básicos',
        type: 'interactive',
        difficulty: 'beginner',
        duration: 25,
        completed: true,
        locked: false,
        points: 150
      },
      {
        id: 'b3',
        title: 'Gestión de Riesgo',
        description: 'Fundamentos de la gestión de capital',
        type: 'video',
        difficulty: 'beginner',
        duration: 20,
        completed: false,
        locked: false,
        points: 120
      },
      {
        id: 'b4',
        title: 'Tu Primera Operación',
        description: 'Simulación guiada de tu primera operación',
        type: 'simulation',
        difficulty: 'beginner',
        duration: 30,
        completed: false,
        locked: false,
        points: 200,
        badge: '🚀'
      }
    ],
    intermediate: [
      {
        id: 'i1',
        title: 'Estrategias de Scalping',
        description: 'Técnicas avanzadas para operaciones rápidas',
        type: 'video',
        difficulty: 'intermediate',
        duration: 35,
        completed: false,
        locked: false,
        points: 250
      },
      {
        id: 'i2',
        title: 'Indicadores Avanzados',
        description: 'RSI, MACD, Bandas de Bollinger y más',
        type: 'interactive',
        difficulty: 'intermediate',
        duration: 40,
        completed: false,
        locked: true,
        points: 300
      }
    ],
    advanced: [
      {
        id: 'a1',
        title: 'Algoritmos de Trading',
        description: 'Crea tu propio bot de trading',
        type: 'interactive',
        difficulty: 'advanced',
        duration: 60,
        completed: false,
        locked: true,
        points: 500,
        badge: '🤖'
      }
    ]
  });

  const [achievements] = useState<Achievement[]>([
    {
      id: 'first_lesson',
      name: 'Primer Paso',
      description: 'Completa tu primera lección',
      icon: '🎯',
      completed: true,
      progress: 1,
      maxProgress: 1,
      points: 50
    },
    {
      id: 'streak_master',
      name: 'Racha de Aprendizaje',
      description: 'Mantén una racha de 7 días',
      icon: '🔥',
      completed: true,
      progress: 7,
      maxProgress: 7,
      points: 200
    },
    {
      id: 'quiz_master',
      name: 'Maestro de Quizzes',
      description: 'Responde correctamente 50 preguntas',
      icon: '🧠',
      completed: false,
      progress: 32,
      maxProgress: 50,
      points: 300
    },
    {
      id: 'simulation_expert',
      name: 'Experto en Simulación',
      description: 'Completa 10 simulaciones con éxito',
      icon: '⚡',
      completed: false,
      progress: 6,
      maxProgress: 10,
      points: 400
    }
  ]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'intermediate': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'advanced': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'interactive': return <Gamepad2 className="w-4 h-4" />;
      case 'quiz': return <HelpCircle className="w-4 h-4" />;
      case 'simulation': return <Target className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const nextLevelProgress = ((totalPoints % 500) / 500) * 100;

  return (
    <div className="space-y-6">
      {/* Panel de Progreso del Usuario */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Tu Progreso de Aprendizaje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-3xl font-bold text-primary mb-2"
              >
                {userLevel}
              </motion.div>
              <div className="text-sm text-muted-foreground">Nivel</div>
              <Progress value={nextLevelProgress} className="mt-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {totalPoints % 500}/500 XP
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-2">{totalPoints}</div>
              <div className="text-sm text-muted-foreground">Puntos Totales</div>
              <div className="flex items-center justify-center mt-2">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="text-xs text-yellow-600">+50 hoy</span>
              </div>
            </div>

            <div className="text-center">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-3xl font-bold text-orange-500 mb-2"
              >
                {currentStreak}
              </motion.div>
              <div className="text-sm text-muted-foreground">Días Consecutivos</div>
              <div className="flex items-center justify-center mt-2">
                <Zap className="w-4 h-4 text-orange-500 mr-1" />
                <span className="text-xs text-orange-600">¡En racha!</span>
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-2">
                {achievements.filter(a => a.completed).length}
              </div>
              <div className="text-sm text-muted-foreground">Logros Desbloqueados</div>
              <div className="text-xs text-muted-foreground mt-2">
                de {achievements.length} totales
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lecciones */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Centro de Aprendizaje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basics">Básico</TabsTrigger>
                  <TabsTrigger value="intermediate">Intermedio</TabsTrigger>
                  <TabsTrigger value="advanced">Avanzado</TabsTrigger>
                </TabsList>

                <TabsContent value={selectedCategory} className="mt-6">
                  <div className="space-y-4">
                    {lessons[selectedCategory]?.map((lesson, index) => (
                      <motion.div
                        key={lesson.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "p-4 rounded-lg border cursor-pointer transition-all",
                          lesson.locked 
                            ? "border-muted bg-muted/30 opacity-60 cursor-not-allowed" 
                            : lesson.completed
                            ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                            : "border-border hover:border-primary/50",
                          activeLesson?.id === lesson.id && "border-primary bg-primary/5"
                        )}
                        onClick={() => !lesson.locked && setActiveLesson(lesson)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {lesson.locked ? (
                                <Lock className="w-5 h-5 text-muted-foreground" />
                              ) : lesson.completed ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <Play className="w-5 h-5 text-primary" />
                              )}
                              {getTypeIcon(lesson.type)}
                            </div>
                            <div>
                              <h3 className="font-medium">{lesson.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {lesson.description}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge className={getDifficultyColor(lesson.difficulty)}>
                              {lesson.difficulty}
                            </Badge>
                            {lesson.badge && (
                              <span className="text-lg">{lesson.badge}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{lesson.duration} min</span>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{lesson.points} XP</span>
                          </div>
                        </div>

                        {!lesson.locked && !lesson.completed && (
                          <div className="mt-3">
                            <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80">
                              <Play className="w-4 h-4 mr-2" />
                              Comenzar Lección
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Simulador Interactivo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Simulador de Trading en Vivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Gamepad2 className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-lg font-medium mb-2">Practica sin Riesgo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Prueba estrategias con datos de mercado reales sin arriesgar dinero real
                </p>
                <Button className="w-full">
                  <Rocket className="w-4 h-4 mr-2" />
                  Iniciar Simulación
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel Lateral - Logros y Comunidad */}
        <div className="space-y-6">
          {/* Logros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Logros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-3 rounded-lg border-l-4",
                      achievement.completed 
                        ? "border-l-green-500 bg-green-50 dark:bg-green-900/20" 
                        : "border-l-gray-300 bg-gray-50 dark:bg-gray-900/20"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{achievement.icon}</span>
                        <span className="text-sm font-medium">{achievement.name}</span>
                      </div>
                      {achievement.completed && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                    
                    {!achievement.completed && (
                      <div className="space-y-1">
                        <Progress 
                          value={(achievement.progress / achievement.maxProgress) * 100} 
                          className="h-1" 
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{achievement.progress}/{achievement.maxProgress}</span>
                          <span>+{achievement.points} XP</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Comunidad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Comunidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Foro de Traders</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Conecta con otros traders y comparte estrategias
                  </p>
                  <Button className="w-full border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                    Unirse al Foro
                  </Button>
                </div>

                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Leaderboard</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Compite con otros traders por los primeros puestos
                  </p>
                  <div className="text-xs">
                    <div className="flex justify-between">
                      <span>Tu posición:</span>
                      <span className="font-medium">#47</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Tip del Día</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    "Nunca arriesgues más del 2% de tu capital en una sola operación"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 