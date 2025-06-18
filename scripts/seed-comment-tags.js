/**
 * Script para insertar etiquetas predeterminadas para comentarios de clientes
 * Ejecutar con: node scripts/seed-comment-tags.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_TAGS = [
  {
    name: 'Poco Interesado',
    color: '#EF4444',
    description: 'Cliente muestra poco interés en el trading o las sesiones de aprendizaje'
  },
  {
    name: 'Muy Motivado',
    color: '#10B981',
    description: 'Cliente está muy motivado y comprometido con el aprendizaje'
  },
  {
    name: 'Necesita Refuerzo',
    color: '#F59E0B',
    description: 'Cliente requiere refuerzo adicional en conceptos básicos'
  },
  {
    name: 'Progreso Excelente',
    color: '#3B82F6',
    description: 'Cliente muestra un progreso excelente en su aprendizaje'
  },
  {
    name: 'Dificultades Técnicas',
    color: '#8B5CF6',
    description: 'Cliente tiene dificultades con aspectos técnicos de la plataforma'
  },
  {
    name: 'Gestión de Riesgo',
    color: '#06B6D4',
    description: 'Comentarios relacionados con la gestión de riesgo del cliente'
  },
  {
    name: 'Estrategia Básica',
    color: '#84CC16',
    description: 'Cliente está aprendiendo estrategias básicas de trading'
  },
  {
    name: 'Análisis Técnico',
    color: '#EC4899',
    description: 'Comentarios sobre el aprendizaje de análisis técnico'
  },
  {
    name: 'Control Emocional',
    color: '#F97316',
    description: 'Cliente trabaja en el control emocional durante el trading'
  },
  {
    name: 'Listo para Avanzar',
    color: '#10B981',
    description: 'Cliente está listo para conceptos más avanzados'
  },
  {
    name: 'Sesión Cancelada',
    color: '#6B7280',
    description: 'Cliente canceló o no asistió a la sesión programada'
  },
  {
    name: 'Dudas Frecuentes',
    color: '#F59E0B',
    description: 'Cliente tiene dudas frecuentes que requieren atención'
  }
];

async function seedCommentTags() {
  try {
    console.log('🌱 Insertando etiquetas predeterminadas para comentarios...');

    // Verificar si ya existen etiquetas
    const existingTags = await prisma.commentTag.findMany();
    
    if (existingTags.length > 0) {
      console.log(`ℹ️  Ya existen ${existingTags.length} etiquetas. Omitiendo inserción.`);
      return;
    }

    // Insertar etiquetas predeterminadas
    const createdTags = [];
    
    for (const tag of DEFAULT_TAGS) {
      try {
        const created = await prisma.commentTag.create({
          data: tag
        });
        createdTags.push(created);
        console.log(`✅ Etiqueta creada: ${tag.name}`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Etiqueta ya existe: ${tag.name}`);
        } else {
          console.error(`❌ Error creando etiqueta ${tag.name}:`, error.message);
        }
      }
    }

    console.log(`🎉 Proceso completado. ${createdTags.length} etiquetas creadas.`);
    
    // Mostrar resumen
    const allTags = await prisma.commentTag.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log('\n📋 Etiquetas disponibles:');
    allTags.forEach(tag => {
      console.log(`  • ${tag.name} (${tag.color})`);
    });

  } catch (error) {
    console.error('❌ Error en el proceso de inserción:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedCommentTags();
  } catch (error) {
    console.error('❌ Error ejecutando el script:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar solo si el script se llama directamente
if (require.main === module) {
  main();
}

module.exports = { seedCommentTags, DEFAULT_TAGS }; 