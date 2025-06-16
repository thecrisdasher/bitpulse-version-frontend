'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Code, Heart } from 'lucide-react';
import { usePathname } from 'next/navigation';

/**
 * Footer component para BitPulse Trading Platform
 * Incluye créditos del desarrollador y link al portfolio
 */

interface FooterProps {
  show?: boolean;
}

export default function Footer({ show }: FooterProps) {
  // Prevent server-client hydration mismatch for random particles
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // No mostrar el footer en páginas de autenticación si no se especifica show
  const shouldShow = show !== undefined ? show : !(pathname ?? '').startsWith('/auth');

  if (!shouldShow) {
    return null;
  }

  return (
    <motion.footer 
      className="relative bg-card/50 backdrop-blur-sm border-t border-border mt-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Gradiente decorativo */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
      
      <div className="relative">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Logo y descripción */}
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">₿</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Mello Trader</h3>
                <p className="text-xs text-muted-foreground">Sistema de Trading Avanzado</p>
              </div>
            </motion.div>

            {/* Créditos del desarrollador */}
            <motion.div 
              className="flex items-center gap-2 text-center md:text-right"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Desarrollado con</span>
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    color: ["hsl(var(--muted-foreground))", "hsl(var(--primary))", "hsl(var(--muted-foreground))"]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Heart className="w-3 h-3 fill-current" />
                </motion.div>
                <span>por</span>
              </div>
              
              <motion.a
                href="https://portafolio-cris-sepia.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-xs font-medium transition-all duration-300 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Code className="w-3 h-3" />
                <span>Mejor Llama A Cris</span>
                <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </motion.a>
            </motion.div>
          </div>

          {/* Copyright */}
          <motion.div 
            className="mt-4 pt-4 border-t border-border/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              
              <div className="flex items-center gap-1">
                <span>© {currentYear} Mello Trader Platform.</span>
                <span className="hidden md:inline">Todos los derechos reservados.</span>
              </div>

              <div className="flex items-center gap-1">
                <span>Creado por</span>
                <motion.a
                  href="https://crisdasher-portfolio.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  Cristian Carabali
                </motion.a>
                <span>-</span>
                <span>Desarrollador Web</span>
              </div>

            </div>
          </motion.div>

        </div>
      </div>

      {/* Efecto de partículas flotantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {mounted && [...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/20 rounded-full"
            initial={{ 
              x: Math.random() * 100 + '%', 
              y: '100%',
              scale: 0 
            }}
            animate={{
              y: '-10px',
              scale: [0, 1, 0],
              opacity: [0, 0.6, 0]
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
    </motion.footer>
  );
} 