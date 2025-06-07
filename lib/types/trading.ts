import { z } from 'zod';

/**
 * Esquema de Zod para validar los datos de una posición de trading.
 * Este esquema se utilizará tanto en el frontend como en el backend
 * para garantizar la consistencia y la integridad de los datos.
 */
export const TradePositionSchema = z.object({
  // --- Datos Esenciales ---
  id: z.string().uuid().optional(), // El ID se genera en el backend
  userId: z.string(),
  instrumentId: z.string(),
  instrumentName: z.string(),
  direction: z.enum(['up', 'down']), // 'up' para compra (long), 'down' para venta (short)
  
  // --- Datos Financieros ---
  amount: z.number().positive('El monto de inversión debe ser positivo'),
  stake: z.number().positive('El stake debe ser positivo'),
  openPrice: z.number(),
  closePrice: z.number().optional(),

  // --- Datos de Tiempo ---
  openTimestamp: z.string().datetime(),
  closeTimestamp: z.string().datetime().optional(),
  duration: z.object({
    value: z.number(),
    unit: z.enum(['minute', 'hour', 'day']),
  }),

  // --- Estado y Resultado ---
  status: z.enum(['open', 'closed']),
  pnl: z.number().optional(), // Profit and Loss

  // --- Datos de Riesgo (Opcionales por ahora) ---
  leverage: z.number().optional(),
  capitalFraction: z.number().optional(),
  lotSize: z.number().optional(),
  marginRequired: z.number().optional(),
  positionValue: z.number().optional(),
});

// Tipo inferido de Zod
export type TradePosition = z.infer<typeof TradePositionSchema>; 