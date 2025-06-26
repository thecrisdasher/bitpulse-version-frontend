import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealTimeIndicatorProps {
  isConnected: boolean;
  error?: string | null;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const RealTimeIndicator: React.FC<RealTimeIndicatorProps> = ({
  isConnected,
  error,
  className,
  showText = true,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const getStatus = () => {
    if (error) {
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        text: 'Error de conexión',
        pulse: false
      };
    }
    
    if (isConnected) {
      return {
        icon: Wifi,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        text: 'Tiempo real',
        pulse: true
      };
    }
    
    return {
      icon: WifiOff,
      color: 'text-gray-400',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      text: 'Desconectado',
      pulse: false
    };
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium',
        status.bgColor,
        status.borderColor,
        className
      )}
      title={error || status.text}
    >
      <div className="relative">
        <Icon className={cn(sizeClasses[size], status.color)} />
        {status.pulse && (
          <div className={cn(
            'absolute inset-0 rounded-full animate-ping',
            status.color.replace('text-', 'bg-'),
            'opacity-75'
          )} />
        )}
      </div>
      
      {showText && (
        <span className={status.color}>
          {error ? 'Error' : status.text}
        </span>
      )}
    </div>
  );
};

export default RealTimeIndicator; 