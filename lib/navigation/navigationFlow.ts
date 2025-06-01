import { UserRole, Permission } from '@/lib/types/auth';
import { logger } from '@/lib/logging/logger';

export interface NavigationStep {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: string;
  isRequired: boolean;
  isCompleted: boolean;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  dependencies?: string[]; // IDs de pasos que deben completarse primero
}

export interface NavigationFlow {
  id: string;
  name: string;
  description: string;
  steps: NavigationStep[];
  currentStepIndex: number;
  isCompleted: boolean;
}

export interface UserNavigationState {
  currentFlow?: NavigationFlow;
  completedFlows: string[];
  availableFlows: NavigationFlow[];
  recommendedNextAction?: {
    type: 'flow' | 'step' | 'page';
    target: string;
    reason: string;
  };
}

/**
 * Flujos de navegación predefinidos para diferentes tipos de usuarios
 */
export const NAVIGATION_FLOWS: Record<string, NavigationFlow> = {
  // Flujo para nuevos usuarios (clientes)
  CLIENT_ONBOARDING: {
    id: 'client_onboarding',
    name: 'Configuración Inicial',
    description: 'Configura tu cuenta y aprende los conceptos básicos de trading',
    currentStepIndex: 0,
    isCompleted: false,
    steps: [
      {
        id: 'welcome',
        title: 'Bienvenido a BitPulse',
        description: 'Conoce las funcionalidades principales de la plataforma',
        path: '/',
        icon: '👋',
        isRequired: true,
        isCompleted: false
      },
      {
        id: 'profile_setup',
        title: 'Configurar Perfil',
        description: 'Completa tu información personal y preferencias',
        path: '/settings',
        icon: '👤',
        isRequired: true,
        isCompleted: false,
        dependencies: ['welcome']
      },
      {
        id: 'trading_preferences',
        title: 'Preferencias de Trading',
        description: 'Configura tus preferencias de riesgo y trading',
        path: '/settings?tab=trading',
        icon: '⚙️',
        isRequired: true,
        isCompleted: false,
        dependencies: ['profile_setup']
      },
      {
        id: 'first_market_view',
        title: 'Explorar Mercados',
        description: 'Familiarízate con los mercados disponibles',
        path: '/markets',
        icon: '📈',
        isRequired: true,
        isCompleted: false,
        dependencies: ['trading_preferences']
      },
      {
        id: 'learning_basics',
        title: 'Conceptos Básicos',
        description: 'Aprende los fundamentos del trading',
        path: '/learning',
        icon: '📚',
        isRequired: false,
        isCompleted: false,
        dependencies: ['first_market_view']
      },
      {
        id: 'first_position',
        title: 'Primera Posición',
        description: 'Abre tu primera posición de trading (simulada)',
        path: '/?demo=true',
        icon: '🚀',
        isRequired: false,
        isCompleted: false,
        dependencies: ['learning_basics']
      }
    ]
  },

  // Flujo para administradores
  ADMIN_SETUP: {
    id: 'admin_setup',
    name: 'Configuración de Administrador',
    description: 'Configura las herramientas administrativas',
    currentStepIndex: 0,
    isCompleted: false,
    steps: [
      {
        id: 'admin_dashboard',
        title: 'Panel de Administración',
        description: 'Familiarízate con las herramientas de administración',
        path: '/admin',
        icon: '🛠️',
        isRequired: true,
        isCompleted: false,
        requiredRoles: ['admin']
      },
      {
        id: 'user_management',
        title: 'Gestión de Usuarios',
        description: 'Aprende a gestionar usuarios y roles',
        path: '/admin/users',
        icon: '👥',
        isRequired: true,
        isCompleted: false,
        requiredRoles: ['admin'],
        dependencies: ['admin_dashboard']
      },
      {
        id: 'system_monitoring',
        title: 'Monitoreo del Sistema',
        description: 'Configura alertas y monitoreo',
        path: '/admin/monitoring',
        icon: '📊',
        isRequired: true,
        isCompleted: false,
        requiredRoles: ['admin'],
        dependencies: ['user_management']
      }
    ]
  },

  // Flujo para maestros/educadores
  MAESTRO_SETUP: {
    id: 'maestro_setup',
    name: 'Configuración de Maestro',
    description: 'Configura las herramientas educativas',
    currentStepIndex: 0,
    isCompleted: false,
    steps: [
      {
        id: 'maestro_dashboard',
        title: 'Panel de Maestro',
        description: 'Accede a las herramientas educativas',
        path: '/maestro',
        icon: '🎓',
        isRequired: true,
        isCompleted: false,
        requiredRoles: ['maestro', 'admin']
      },
      {
        id: 'content_creation',
        title: 'Crear Contenido',
        description: 'Aprende a crear material educativo',
        path: '/maestro/content',
        icon: '✍️',
        isRequired: true,
        isCompleted: false,
        requiredRoles: ['maestro', 'admin'],
        dependencies: ['maestro_dashboard']
      },
      {
        id: 'student_tracking',
        title: 'Seguimiento de Estudiantes',
        description: 'Monitorea el progreso de los estudiantes',
        path: '/maestro/students',
        icon: '📋',
        isRequired: false,
        isCompleted: false,
        requiredRoles: ['maestro', 'admin'],
        dependencies: ['content_creation']
      }
    ]
  }
};

/**
 * Clase para gestionar el flujo de navegación del usuario
 */
export class NavigationFlowManager {
  private static instance: NavigationFlowManager;
  private userState: UserNavigationState | null = null;

  private constructor() {}

  public static getInstance(): NavigationFlowManager {
    if (!NavigationFlowManager.instance) {
      NavigationFlowManager.instance = new NavigationFlowManager();
    }
    return NavigationFlowManager.instance;
  }

  /**
   * Inicializar el estado de navegación para un usuario
   */
  public initializeUserNavigation(
    userId: string,
    userRole: UserRole,
    userPermissions: Permission[],
    completedSteps: string[] = []
  ): UserNavigationState {
    logger.logUserActivity('navigation_initialized', userId, {
      userRole,
      completedStepsCount: completedSteps.length
    });

    // Determinar flujos disponibles basados en el rol
    const availableFlows = this.getAvailableFlows(userRole, userPermissions);
    
    // Encontrar el flujo actual (el primero no completado)
    const currentFlow = this.findCurrentFlow(availableFlows, completedSteps);
    
    // Actualizar estado de completado de los pasos
    if (currentFlow) {
      this.updateStepCompletionStatus(currentFlow, completedSteps);
    }

    this.userState = {
      currentFlow,
      completedFlows: this.getCompletedFlows(availableFlows, completedSteps),
      availableFlows,
      recommendedNextAction: this.getRecommendedNextAction(currentFlow)
    };

    return this.userState;
  }

  /**
   * Obtener flujos disponibles para un usuario basado en su rol
   */
  private getAvailableFlows(userRole: UserRole, userPermissions: Permission[]): NavigationFlow[] {
    const flows: NavigationFlow[] = [];

    // Todos los usuarios tienen acceso al flujo básico
    flows.push({ ...NAVIGATION_FLOWS.CLIENT_ONBOARDING });

    // Flujos específicos por rol
    if (userRole === 'admin') {
      flows.push({ ...NAVIGATION_FLOWS.ADMIN_SETUP });
      flows.push({ ...NAVIGATION_FLOWS.MAESTRO_SETUP }); // Admin puede acceder a todo
    } else if (userRole === 'maestro') {
      flows.push({ ...NAVIGATION_FLOWS.MAESTRO_SETUP });
    }

    return flows;
  }

  /**
   * Encontrar el flujo actual (primer flujo no completado)
   */
  private findCurrentFlow(flows: NavigationFlow[], completedSteps: string[]): NavigationFlow | undefined {
    for (const flow of flows) {
      const requiredSteps = flow.steps.filter(step => step.isRequired);
      const completedRequiredSteps = requiredSteps.filter(step => 
        completedSteps.includes(step.id)
      );

      if (completedRequiredSteps.length < requiredSteps.length) {
        // Este flujo no está completado
        flow.currentStepIndex = this.findCurrentStepIndex(flow, completedSteps);
        return flow;
      }
    }

    return undefined; // Todos los flujos están completados
  }

  /**
   * Encontrar el índice del paso actual en un flujo
   */
  private findCurrentStepIndex(flow: NavigationFlow, completedSteps: string[]): number {
    for (let i = 0; i < flow.steps.length; i++) {
      const step = flow.steps[i];
      
      // Verificar si este paso está completado
      if (!completedSteps.includes(step.id)) {
        // Verificar si las dependencias están completadas
        if (this.areDependenciesMet(step, completedSteps)) {
          return i;
        }
      }
    }

    return flow.steps.length; // Todos los pasos completados
  }

  /**
   * Verificar si las dependencias de un paso están completadas
   */
  private areDependenciesMet(step: NavigationStep, completedSteps: string[]): boolean {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }

    return step.dependencies.every(depId => completedSteps.includes(depId));
  }

  /**
   * Actualizar el estado de completado de los pasos
   */
  private updateStepCompletionStatus(flow: NavigationFlow, completedSteps: string[]): void {
    flow.steps.forEach(step => {
      step.isCompleted = completedSteps.includes(step.id);
    });

    // Actualizar si el flujo está completado
    const requiredSteps = flow.steps.filter(step => step.isRequired);
    const completedRequiredSteps = requiredSteps.filter(step => step.isCompleted);
    flow.isCompleted = completedRequiredSteps.length === requiredSteps.length;
  }

  /**
   * Obtener flujos completados
   */
  private getCompletedFlows(flows: NavigationFlow[], completedSteps: string[]): string[] {
    return flows
      .filter(flow => {
        const requiredSteps = flow.steps.filter(step => step.isRequired);
        const completedRequiredSteps = requiredSteps.filter(step => 
          completedSteps.includes(step.id)
        );
        return completedRequiredSteps.length === requiredSteps.length;
      })
      .map(flow => flow.id);
  }

  /**
   * Obtener la siguiente acción recomendada
   */
  private getRecommendedNextAction(currentFlow?: NavigationFlow): UserNavigationState['recommendedNextAction'] {
    if (!currentFlow) {
      return {
        type: 'page',
        target: '/',
        reason: 'Todos los flujos de configuración están completados'
      };
    }

    const currentStep = currentFlow.steps[currentFlow.currentStepIndex];
    if (currentStep) {
      return {
        type: 'step',
        target: currentStep.path,
        reason: `Completar: ${currentStep.title}`
      };
    }

    return {
      type: 'flow',
      target: currentFlow.id,
      reason: `Continuar con: ${currentFlow.name}`
    };
  }

  /**
   * Marcar un paso como completado
   */
  public markStepCompleted(stepId: string, userId: string): boolean {
    if (!this.userState?.currentFlow) {
      return false;
    }

    const step = this.userState.currentFlow.steps.find(s => s.id === stepId);
    if (!step) {
      return false;
    }

    // Verificar dependencias
    if (!this.areDependenciesMet(step, this.getCompletedStepIds())) {
      logger.warn('user_activity', 'Step completion blocked by dependencies', {
        userId,
        stepId,
        dependencies: step.dependencies
      });
      return false;
    }

    step.isCompleted = true;

    // Actualizar índice del paso actual
    this.userState.currentFlow.currentStepIndex = this.findCurrentStepIndex(
      this.userState.currentFlow,
      this.getCompletedStepIds()
    );

    // Actualizar acción recomendada
    this.userState.recommendedNextAction = this.getRecommendedNextAction(
      this.userState.currentFlow
    );

    logger.logUserActivity('navigation_step_completed', userId, {
      stepId,
      flowId: this.userState.currentFlow.id,
      currentStepIndex: this.userState.currentFlow.currentStepIndex
    });

    return true;
  }

  /**
   * Obtener IDs de pasos completados
   */
  private getCompletedStepIds(): string[] {
    if (!this.userState?.currentFlow) {
      return [];
    }

    return this.userState.currentFlow.steps
      .filter(step => step.isCompleted)
      .map(step => step.id);
  }

  /**
   * Obtener el estado actual de navegación
   */
  public getUserNavigationState(): UserNavigationState | null {
    return this.userState;
  }

  /**
   * Verificar si un usuario puede acceder a una ruta específica
   */
  public canAccessRoute(
    path: string,
    userRole: UserRole,
    userPermissions: Permission[]
  ): { canAccess: boolean; reason?: string } {
    // Buscar si la ruta está en algún paso de flujo
    for (const flow of Object.values(NAVIGATION_FLOWS)) {
      for (const step of flow.steps) {
        if (step.path === path || path.startsWith(step.path)) {
          // Verificar roles requeridos
          if (step.requiredRoles && !step.requiredRoles.includes(userRole)) {
            return {
              canAccess: false,
              reason: `Requiere uno de estos roles: ${step.requiredRoles.join(', ')}`
            };
          }

          // Verificar permisos requeridos
          if (step.requiredPermissions) {
            const hasPermission = step.requiredPermissions.some(perm => 
              userPermissions.includes(perm)
            );
            if (!hasPermission) {
              return {
                canAccess: false,
                reason: `Requiere uno de estos permisos: ${step.requiredPermissions.join(', ')}`
              };
            }
          }

          return { canAccess: true };
        }
      }
    }

    // Si no está en ningún flujo, permitir acceso por defecto
    return { canAccess: true };
  }

  /**
   * Obtener progreso del usuario en porcentaje
   */
  public getUserProgress(): { overall: number; currentFlow?: number } {
    if (!this.userState) {
      return { overall: 0 };
    }

    const totalSteps = this.userState.availableFlows.reduce(
      (total, flow) => total + flow.steps.filter(step => step.isRequired).length,
      0
    );

    const completedSteps = this.userState.availableFlows.reduce(
      (total, flow) => total + flow.steps.filter(step => step.isRequired && step.isCompleted).length,
      0
    );

    const overall = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 100;

    let currentFlow: number | undefined;
    if (this.userState.currentFlow) {
      const flowRequiredSteps = this.userState.currentFlow.steps.filter(step => step.isRequired);
      const flowCompletedSteps = flowRequiredSteps.filter(step => step.isCompleted);
      currentFlow = flowRequiredSteps.length > 0 
        ? Math.round((flowCompletedSteps.length / flowRequiredSteps.length) * 100)
        : 100;
    }

    return { overall, currentFlow };
  }
}

// Instancia singleton
export const navigationFlowManager = NavigationFlowManager.getInstance(); 