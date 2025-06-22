'use client';

import React from 'react';
import { Shield, Eye, Database, Share2, Clock, UserCheck, FileText, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface PrivacyPolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyPolicyModal({ open, onOpenChange }: PrivacyPolicyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Política de Privacidad</DialogTitle>
              <p className="text-sm text-muted-foreground">Mello Trader - Última actualización: {new Date().toLocaleDateString('es-ES')}</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-180px)] px-6 py-4">
          <div className="space-y-6">
            {/* Quiénes Somos */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Quiénes Somos</h2>
              </div>
              <div className="pl-7 space-y-2">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Mello Trader ofrece servicios financieros en todo el mundo, como soluciones de inversión, 
                  opciones de compensación para bancos y corporaciones, servicios de administración de dinero 
                  para clientes minoristas y administradores de dinero. Mello Trader desarrolla sus propios 
                  productos y soluciones de software que se consideran entre los mejores disponibles en la 
                  industria de los mercados financieros.
                </p>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Dirección de nuestro sitio web:</p>
                  <a 
                    href="https://bitpulse-frontend.fly.dev/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    https://bitpulse-frontend.fly.dev/
                  </a>
                </div>
              </div>
            </section>

            <Separator />

            {/* Comentarios */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-600" />
                <h2 className="text-lg font-semibold">Comentarios</h2>
              </div>
              <div className="pl-7">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Cuando los visitantes dejan comentarios en el sitio, recopilamos los datos que se muestran 
                  en el formulario de comentarios, y también la dirección IP del visitante y la cadena del 
                  agente de usuario del navegador para ayudar a la detección de spam.
                </p>
              </div>
            </section>

            <Separator />

            {/* Medios */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold">Medios</h2>
              </div>
              <div className="pl-7">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Si carga imágenes en el sitio web, debe evitar cargar imágenes con datos de ubicación 
                  incrustados (GPS EXIF) incluidos. Los visitantes del sitio web pueden descargar y extraer 
                  cualquier dato de ubicación de las imágenes del sitio web.
                </p>
              </div>
            </section>

            <Separator />

            {/* Cookies */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-orange-600" />
                <h2 className="text-lg font-semibold">Cookies</h2>
              </div>
              <div className="pl-7 space-y-3">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Si deja un comentario en nuestro sitio, puede optar por guardar su nombre, dirección de 
                  correo electrónico y sitio web en cookies. Estos son para su conveniencia para que no 
                  tenga que volver a completar sus datos cuando deje otro comentario. Estas cookies durarán un año.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Si visita nuestra página de inicio de sesión, configuraremos una cookie temporal para 
                  determinar si su navegador acepta cookies. Esta cookie no contiene datos personales y 
                  se descarta cuando cierra su navegador.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Cuando inicie sesión, también configuraremos varias cookies para guardar su información 
                  de inicio de sesión y sus opciones de visualización de pantalla. Las cookies de inicio 
                  de sesión duran dos días y las cookies de opciones de pantalla duran un año. Si selecciona 
                  «Recordarme», su inicio de sesión se mantendrá durante dos semanas. Si cierra sesión en 
                  su cuenta, se eliminarán las cookies de inicio de sesión.
                </p>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>Nota:</strong> Si edita o publica un artículo, se guardará una cookie adicional 
                    en su navegador. Esta cookie no incluye datos personales y simplemente indica el ID de 
                    publicación del artículo que acaba de editar. Caduca después de 1 día.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Contenido Incrustado */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold">Contenido Incrustado de Otros Sitios Web</h2>
              </div>
              <div className="pl-7 space-y-2">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Los artículos de este sitio pueden incluir contenido incrustado (por ejemplo, videos, 
                  imágenes, artículos, etc.). El contenido incrustado de otros sitios web se comporta 
                  exactamente de la misma manera que si el visitante hubiera visitado el otro sitio web.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Estos sitios web pueden recopilar datos sobre usted, utilizar cookies, incrustar un 
                  seguimiento adicional de terceros y supervisar su interacción con ese contenido 
                  incrustado, incluido el seguimiento de su interacción con el contenido incrustado 
                  si tiene una cuenta y ha iniciado sesión en ese sitio web.
                </p>
              </div>
            </section>

            <Separator />

            {/* Compartir Datos */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold">Con Quién Compartimos Sus Datos</h2>
              </div>
              <div className="pl-7">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Si solicita un restablecimiento de contraseña, su dirección IP se incluirá en el 
                  correo electrónico de restablecimiento.
                </p>
              </div>
            </section>

            <Separator />

            {/* Retención de Datos */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <h2 className="text-lg font-semibold">Cuánto Tiempo Conservamos Sus Datos</h2>
              </div>
              <div className="pl-7 space-y-2">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Si deja un comentario, el comentario y sus metadatos se conservan indefinidamente. 
                  Esto es para que podamos reconocer y aprobar cualquier comentario de seguimiento 
                  automáticamente en lugar de mantenerlos en una cola de moderación.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Para los usuarios que se registran en nuestro sitio web (si corresponde), también 
                  almacenamos la información personal que proporcionan en su perfil de usuario. Todos 
                  los usuarios pueden ver, editar o eliminar su información personal en cualquier momento 
                  (excepto que no pueden cambiar su nombre de usuario). Los administradores del sitio 
                  web también pueden ver y editar esa información.
                </p>
              </div>
            </section>

            <Separator />

            {/* Derechos del Usuario */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">Qué Derechos Tiene Sobre Sus Datos</h2>
              </div>
              <div className="pl-7 space-y-2">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Si tiene una cuenta en este sitio o ha dejado comentarios, puede solicitar recibir 
                  un archivo exportado de los datos personales que tenemos sobre usted, incluidos los 
                  datos que nos haya proporcionado.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  También puede solicitar que borremos cualquier dato personal que tengamos sobre usted. 
                  Esto no incluye ningún dato que estemos obligados a conservar con fines administrativos, 
                  legales o de seguridad.
                </p>
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Sus derechos incluyen:</strong> Acceso, rectificación, portabilidad y 
                    eliminación de sus datos personales.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Envío de Datos */}
            <section className="space-y-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-slate-600" />
                <h2 className="text-lg font-semibold">A Dónde Enviamos Sus Datos</h2>
              </div>
              <div className="pl-7">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Los comentarios de los visitantes pueden verificarse a través de un servicio de 
                  detección automática de spam.
                </p>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-8 p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-medium">Contacto para Asuntos de Privacidad</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Si tiene preguntas sobre esta política de privacidad o sobre cómo manejamos sus datos, 
                puede contactarnos a través de nuestro sitio web o mediante los canales oficiales de soporte.
              </p>
            </div>
          </div>
        </ScrollArea>

        <div className="border-t px-6 py-4">
          <div className="flex justify-end">
            <Button 
              onClick={() => onOpenChange(false)}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              Entendido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 