/**
 * Cliente de Prisma simulado para desarrollo sin base de datos.
 * Este módulo imita la interfaz de Prisma Client para permitir que la aplicación
 * funcione con datos en memoria. Cuando la base de datos real esté lista,
 * este archivo puede ser reemplazado por la inicialización real de Prisma.
 */
import { allUsers, User } from '@/lib/mockData'; // Usamos los usuarios del mock
import { v4 as uuidv4 } from 'uuid';

// Simulación del almacenamiento de posiciones en memoria
let positionsStore: any[] = [];

export const prisma = {
  user: {
    /**
     * Busca un usuario por su ID en la lista de usuarios simulada.
     */
    async findUnique({ where }: { where: { id: string } }) {
      console.log(`[Prisma Mock] Buscando usuario con id: ${where.id}`);
      const user = allUsers.find((u: User) => u.id === where.id);
      return user ? Promise.resolve(user) : Promise.resolve(null);
    },
    /**
     * Actualiza el saldo de Pejecoins de un usuario.
     */
    async update({ where, data }: { where: { id: string }, data: { pejecoins: number } }) {
        console.log(`[Prisma Mock] Actualizando usuario ${where.id} con datos:`, data);
        const userIndex = allUsers.findIndex((u: User) => u.id === where.id);
        if (userIndex !== -1 && data.pejecoins !== undefined) {
            allUsers[userIndex].pejecoins = data.pejecoins;
            return Promise.resolve(allUsers[userIndex]);
        }
        return Promise.resolve(null);
    }
  },
  tradePosition: {
    /**
     * "Crea" una nueva posición de trading guardándola en el array en memoria.
     */
    async create({ data }: { data: any }) {
      console.log('[Prisma Mock] Creando nueva posición:', data);
      const newPosition = {
        ...data,
        id: data.id || uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      positionsStore.push(newPosition);
      return Promise.resolve(newPosition);
    }
  }
};

// Exportamos el tipo User desde mockData para mantener la consistencia
export type { User } from '@/lib/mockData'; 