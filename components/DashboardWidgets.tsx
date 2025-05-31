'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Target, 
  Eye, 
  Bell,
  Clock,
  Sparkles,
  Brain,
  Rocket,
  Shield,
  Star,
  Gift,
  Trophy,
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Widget de Alerta de Oportunidades AI
export function AIOpportunityWidget() {
  const [opportunities, setOpportunities] = useState([
    {
      id: 1,
      market: 'BTC/USD',
      type: 'Breakout',
      confidence: 92,
      potential: '+15.3%',
      timeframe: '4H',
      urgency: 'alta'
    },
    {
      id: 2,
      market: 'Volatility 100',
      type: 'Mean Reversion',
      confidence: 87,
      potential: '+8.7%',
      timeframe: '1H',
      urgency: 'media'
    }
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="w-5 h-5 text-primary" />
              AI Trading Insights
            </CardTitle>
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
            </motion.div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <AnimatePresence>
            {opportunities.map((opp, index) => (
              <motion.div
                key={opp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{opp.market}</span>
                    <Badge 
                      variant={opp.urgency === 'alta' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {opp.type}
                    </Badge>
                  </div>
                  <span className="text-sm text-green-600 font-medium">{opp.potential}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Confianza: {opp.confidence}%</span>
                  <span>{opp.timeframe}</span>
                </div>
                <Progress value={opp.confidence} className="mt-2 h-1" />
              </motion.div>
            ))}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Widget de Racha Personal
export function PersonalStreakWidget() {
  const [streakData] = useState({
    currentStreak: 7,
    bestStreak: 15,
    winRate: 78.5,
    todayTrades: 3,
    achievement: 'Hot Streak! 🔥'
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="w-5 h-5 text-orange-500" />
            Tu Racha Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="text-4xl font-bold text-orange-500">
                {streakData.currentStreak}
              </div>
              <div className="text-sm text-muted-foreground">Operaciones exitosas consecutivas</div>
            </motion.div>
            
            <div className="flex justify-between text-sm">
              <span>Mejor racha: <strong>{streakData.bestStreak}</strong></span>
              <span>Hoy: <strong>{streakData.todayTrades}</strong></span>
            </div>
            
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                {streakData.achievement}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Widget de Logros y Niveles
export function AchievementsWidget() {
  const [achievements] = useState([
    { id: 1, name: 'First Win', description: 'Primera operación exitosa', completed: true, icon: '🎯' },
    { id: 2, name: 'Streak Master', description: '10 operaciones consecutivas', completed: true, icon: '🔥' },
    { id: 3, name: 'Profit Hunter', description: '1000 PejeCoins de ganancia', completed: true, icon: '💰' },
    { id: 4, name: 'Risk Manager', description: 'Mantener drawdown < 5%', completed: false, icon: '🛡️' },
    { id: 5, name: 'Market Expert', description: 'Operar en 5 mercados diferentes', completed: false, icon: '🌟' }
  ]);

  const completedCount = achievements.filter(a => a.completed).length;
  const progress = (completedCount / achievements.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Logros & Nivel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold">Nivel {Math.floor(progress / 20) + 1}</div>
            <Progress value={progress} className="mt-2" />
            <div className="text-sm text-muted-foreground mt-1">
              {completedCount}/{achievements.length} logros completados
            </div>
          </div>
          
          <div className="space-y-2">
            {achievements.slice(0, 3).map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-center gap-3 p-2 rounded",
                  achievement.completed 
                    ? "bg-green-50 dark:bg-green-900/20" 
                    : "bg-muted/30 opacity-60"
                )}
              >
                <span className="text-lg">{achievement.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{achievement.name}</div>
                  <div className="text-xs text-muted-foreground">{achievement.description}</div>
                </div>
                {achievement.completed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <span className="text-green-500">✓</span>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Widget de Mercado Caliente
export function HotMarketWidget() {
  const [hotMarkets] = useState([
    { name: 'BTC/USD', change: '+12.5%', volume: '2.3B', trend: 'up' },
    { name: 'Volatility 100', change: '+8.7%', volume: '450M', trend: 'up' },
    { name: 'EUR/USD', change: '-2.1%', volume: '1.1B', trend: 'down' }
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Rocket className="w-5 h-5 text-blue-500" />
            Mercados en Tendencia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {hotMarkets.map((market, index) => (
              <motion.div
                key={market.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {market.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium">{market.name}</div>
                    <div className="text-xs text-muted-foreground">Vol: {market.volume}</div>
                  </div>
                </div>
                <div className={cn(
                  "font-medium",
                  market.trend === 'up' ? "text-green-500" : "text-red-500"
                )}>
                  {market.change}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Widget de Alertas Inteligentes
export function SmartAlertsWidget() {
  const [alerts] = useState([
    {
      id: 1,
      type: 'price',
      message: 'BTC alcanzó tu precio objetivo de $45,000',
      time: '2 min',
      urgent: true
    },
    {
      id: 2,
      type: 'pattern',
      message: 'Patrón alcista detectado en EUR/USD',
      time: '5 min',
      urgent: false
    },
    {
      id: 3,
      type: 'news',
      message: 'Noticias importantes sobre el mercado crypto',
      time: '10 min',
      urgent: false
    }
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-purple-500" />
            Alertas Inteligentes
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3 }}
            >
              <Bell className="w-4 h-4 text-purple-500" />
            </motion.div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-3 rounded-lg border-l-4 cursor-pointer hover:bg-muted/50 transition-colors",
                  alert.urgent ? "border-l-red-500 bg-red-50 dark:bg-red-900/10" : "border-l-blue-500 bg-blue-50 dark:bg-blue-900/10"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-1">{alert.message}</div>
                    <div className="text-xs text-muted-foreground">{alert.time} ago</div>
                  </div>
                  {alert.urgent && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <span className="text-red-500 text-lg">●</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Widget de Desafío Diario
export function DailyChallengeWidget() {
  const [challenge] = useState({
    title: 'Desafío del Día',
    description: 'Realiza 5 operaciones con 80% de precisión',
    progress: 3,
    target: 5,
    reward: '50 PejeCoins Extra',
    timeLeft: '6h 23m'
  });

  const progressPercent = (challenge.progress / challenge.target) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 1.0 }}
    >
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-purple-500" />
            {challenge.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">{challenge.description}</div>
            <Progress value={progressPercent} className="mb-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{challenge.progress}/{challenge.target} completado</span>
              <span>⏰ {challenge.timeLeft}</span>
            </div>
          </div>
          
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-center">
            <div className="flex items-center justify-center gap-2">
              <Gift className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Recompensa: {challenge.reward}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
} 