import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { createPosition, validatePosition } from '@/lib/trading/positionService';
import { ZodError } from 'zod';
import { TradePositionSchema } from '@/lib/types/trading';

/**
 * Endpoint para crear una nueva posición de trading.
 * Realiza validación de datos, autenticación y lógica de negocio.
 */
export async function POST(request: Request) {
  try {
    // 1. Autenticación y autorización
    const { user } = await getAuth(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No autorizado' },
        { status: 401 }
      );
    }

    // 2. Obtener y parsear el cuerpo de la solicitud
    const body = await request.json();

    // 3. Validar los datos de entrada con Zod
    let positionData = TradePositionSchema.parse({
      ...body,
      userId: user.id, // Añadir el ID del usuario a los datos
      status: 'open', // Establecer estado inicial
      openTimestamp: new Date().toISOString(), // Establecer timestamp de apertura
    });

    // Calcular valor de la posición y margen requerido en el backend
    // Esta lógica podría ser más compleja dependiendo de las reglas de negocio
    const contractSize = getContractSize(positionData.instrumentName);
    const positionValue = positionData.openPrice * contractSize * (positionData.lotSize || 1);
    const marginRequired = positionValue / (positionData.leverage || 100); // Usar apalancamiento o un default

    positionData = {
      ...positionData,
      positionValue,
      marginRequired,
    };

    // 4. Lógica de negocio (ej. verificar saldo, calcular margen)
    const validationResult = await validatePosition(user, positionData);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, message: validationResult.message },
        { status: 400 }
      );
    }

    // 5. Crear y "guardar" la posición (actualmente en memoria)
    // TODO: Reemplazar con guardado en base de datos (Prisma)
    const newPosition = await createPosition(positionData);

    return NextResponse.json(
      { success: true, data: newPosition, message: 'Posición creada exitosamente' },
      { status: 201 }
    );

  } catch (error) {
    // Manejo de errores de validación de Zod
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, message: 'Datos de entrada inválidos', errors: error.errors },
        { status: 400 }
      );
    }

    // Manejo de otros errores
    console.error('[API_CREATE_POSITION_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Determina el tamaño del contrato basado en el nombre del instrumento.
 * @param instrumentName - El nombre del instrumento (ej. 'BTCUSD', 'EURUSD').
 * @returns El tamaño del contrato para el cálculo del valor de la posición.
 */
function getContractSize(instrumentName: string): number {
  if (instrumentName.includes('BTC') || instrumentName.includes('ETH')) {
    return 1; // Crypto
  }
  if (instrumentName.includes('XAU')) {
    return 100; // Gold
  }
  return 100000; // Forex standard
} 