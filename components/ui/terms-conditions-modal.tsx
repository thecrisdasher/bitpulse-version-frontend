'use client';

import React from 'react';
import { FileText, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TermsConditionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TermsConditionsModal({ open, onOpenChange }: TermsConditionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Términos y Condiciones</DialogTitle>
              <p className="text-sm text-muted-foreground">Mello Trader - Última modificación: Abril de 2021</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-180px)] px-6 py-4">
          <div className="space-y-6 text-sm leading-relaxed">
            
            <div className="space-y-4">
              <p>
                Estos Términos y Condiciones fueron modificados por última vez en Abril de 2021.
              </p>
              
              <p>
                El grupo de empresas Mello Trader (colectivamente, «Mello Trader») se complace en proporcionarle información, contenido, herramientas, productos y servicios en los sitios https://bitpulse-frontend.fly.dev/ (el término «Sitios Mello Trader» se refiere a todos los sitios web de Mello Trader, así como a su contenido incluyendo productos y servicios). Estos Términos y Condiciones también incluyen importantes revelaciones e información relacionada con ciertos productos y servicios. El uso de sitios Mello Trader está sujeto a estos términos y condiciones.
              </p>
              
              <p>
                Estos Términos y Condiciones constituyen un acuerdo vinculante entre usted y Mello Trader. El acceso y uso de este sitio web implica la aceptación de los Términos y Condiciones y cualquier otro aviso legal y declaraciones contenidas en este sitio web. Al utilizar los Sitios de Mello Trader se regirá por la versión de los Términos y Condiciones vigentes a la fecha en la que accedió a cada sitio de Mello Trader.
              </p>
              
              <p>
                Mello Trader puede modificar estos Términos y Condiciones en cualquier momento y sin previo aviso. Usted debe revisar la versión más actualizada de estos Términos y Condiciones, visitando cualquier sitio de Mello Trader y haciendo clic en los hipervínculos de Términos y Condiciones ubicados en la parte inferior de la página. Su continuo acceso y uso de este sitio web implica la aceptación de estos Términos y Condiciones y sus modificaciones. El único aviso de cambio o modificación a estos Términos y Condiciones será cuando Mello Trader publique los Términos y Condiciones revisados en el sitio web, Mello Trader no le notificará por separado cualquier cambio o modificación.
              </p>
              
              <p>
                Los presentes Términos y Condiciones son adicionales a cualquier otro acuerdo entre usted y Mello Trader, incluyendo cualquier cliente o contratos de cuenta y cualquier otro acuerdo que rijan el uso de la información, contenidos, herramientas, productos y servicios disponibles a través de los Sitios de Mello Trader
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">USO DE SITIOS Mello Trader</h2>
              <p>
                Los Sitios de Mello Trader están destinados únicamente para su uso personal, no comercial, a menos que usted y Mello Trader acuerden lo contrario por escrito.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">DISTRIBUCIÓN Y RESPONSABILIDAD DE LOS VISITANTES</h2>
              <p>
                La información en este sitio web no está destinado a su distribución o uso por ninguna persona en ningún país o jurisdicción donde dicha distribución o uso sea contrario a la ley o regulación local. Ninguno de los servicios o inversiones que se mencionan en los sitios de Mello Trader están disponibles para las personas residentes en cualquier país donde la provisión de tal servicio o inversión sería contraria a la ley o regulación local.
              </p>
              <p>
                Es responsabilidad de los visitantes a este sitio web el conocer los términos y cumplir con cualquier ley local o regulación a la que estén sujetos. Nada en los Sitios Mello Trader se considerará una solicitud de compra o una oferta para vender cualquier producto o servicio a cualquier persona en cualquier jurisdicción en la que dicha oferta, solicitud, compra o venta sea ilegal bajo las leyes de dicha jurisdicción.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">LIMITACIONES DE LA GUÍA DE INVERSIONES Y ASESORAMIENTO PROFESIONAL</h2>
              <p>
                Los Sitios Mello Trader no están destinados a proporcionar asesoramiento legal, fiscal o de inversión. Usted es el único responsable de determinar si cualquier inversión, estrategia de inversión o transacción relacionada es apropiado para usted basado en sus objetivos de inversión personal, condiciones financieras y tolerancia al riesgo. Usted debe consultar a un profesional legal o fiscal sobre su situación específica.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">PROPIEDAD INTELECTUAL</h2>
              <p>
                Los Sitios de Mello Trader están protegidos por las leyes de propiedad intelectual aplicables. A excepción de lo expresamente indicado en este documento, no podrá, sin previa autorización por escrito de Mello Trader, alterar, modificar, reproducir, distribuir o explotar comercialmente cualquier material, incluyendo textos, gráficos, video, audio, código de software, diseño o logos interfaz de usuario, de este o cualquier Sitio de Mello Trader.
              </p>
              <p>
                Si usted enlaza desde otra página web a un sitio Mello Trader, su sitio web, así como el propio enlace, no podrá, sin previa autorización por escrito de Mello Trader, sugerir que Mello Trader respalda, patrocina o está afiliada a cualquier sitio web que no sea de Mello Trader, entidad, servicio o producto, y no puede hacer uso de cualquier marca de Mello Trader o marcas de servicio que sean distintas a las contenidas en el texto del enlace.
              </p>
              <p>
                Los Sitios de Mello Trader, con exclusión de los contenidos de terceros, son obras originales de autoría publicados por Mello Trader. Mello Trader tiene los derechos exclusivos a reproducir, mostrar, realizar trabajos derivados o distribuir. Los nombres, logotipos, marcas comerciales, derechos de autor y otros derechos de propiedad intelectual en todo el material y el software en este sitio web son propiedad de Mello Trader o de sus licenciantes. Todos los materiales de propiedad de terceros que figuran en la página web se reproducen con el permiso de los respectivos propietarios.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">NULO DONDE ESTÉ PROHIBIDO</h2>
              <p>
                A pesar de que los Sitios de Mello Trader, incluyendo los productos y servicios, son accesibles a todo el mundo, no todas las características, productos o servicios mencionados, referencias, prestadas u ofertadas a través de, o en el Sitio, están disponibles para todas las personas o en todas las jurisdicciones o apropiados o estén disponibles para su uso en ciertas jurisdicciones. Mello Trader se reserva el derecho de limitar, a su entera discreción, los productos y servicios que pone a disposición, lo que suministra y la cantidad a cualquier persona.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">PAGOS Y POLÍTICA DE REEMBOLSO</h2>
              <p>
                Los Sitios de Mello Trader utiliza Soluciones de vendedor de diversos proveedores de ventas («Soluciones de vendedor») para el pago en línea, procesamiento de pedidos, entrega de pedidos, y otras soluciones comerciales. La facturación se produce en el momento, o poco después, de su transacción. Si la tarjeta de crédito está siendo utilizada para una transacción, Mello Trader puede obtener una aprobación previa por un monto hasta la cantidad de la orden. Usted acepta que pagará por todos los productos que usted compre a través de las Soluciones de vendedor y que Mello Trader puede cargar a su tarjeta de crédito cualquier producto comprado.
              </p>
              <p>
                Para ver cómo cada PSP maneja transacciones, lea los Términos de Uso en la pagina del PSP
              </p>
              <p>
                Todas las ventas de productos son finales. Los gastos de los productos y servicios no son reembolsables.
              </p>
              <p>
                Los precios de los productos ofrecidos a través de las Soluciones de vendedor pueden cambiar en cualquier momento, y las Soluciones de vendedor no proporciona protección de precios o reembolsos en caso de una reducción de precios u ofertas promocionales.
              </p>
              <p>
                Si un producto no se encuentra disponible tras su adquisición, pero antes de la descarga, la única solución es un reembolso. Si los problemas técnicos o demoras inaceptables impiden la entrega de su producto, su único y exclusivo remedio es el reemplazo o el reembolso del precio pagado, según lo determinado por Mello Trader
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">DISPONIBILIDAD DE CONTENIDO</h2>
              <p>
                Mello Trader se reserva el derecho de cambiar el contenido, productos y servicios (incluida la elegibilidad de las características particulares, productos y / o servicios) sin previo aviso.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">CONTENIDO DE TERCEROS Y DE INVESTIGACIÓN</h2>
              <p>
                Los Sitios de Mello Trader pueden incluir noticias e información general, consejos generales, herramientas interactivas, citas, informes de investigación y datos relativos a los mercados de divisas, otros mercados financieros y otros temas.
              </p>
              <p>
                Algunos de estos contenidos pueden ser suministrados por empresas que no están afiliadas a ninguna entidad de Mello Trader («Contenido de Terceros»). La fuente de todo el Contenido de Terceros está claramente identificada y destacada en los sitios de Mello Trader.
              </p>
              <p>
                El Contenido de Terceros puede estar disponible a través de las áreas enmarcadas, a través de enlaces a sitios web de terceros, o simplemente publicada en el sitio. El contenido de terceros está protegido por leyes de propiedad intelectual y los tratados internacionales y es propiedad de o con licencia del proveedor acreditado de contenido de terceros (s).
              </p>
              <p>
                Mello Trader no respalda ni aprueba explícita o implícitamente tal Contenido de Terceros. Los proveedores de contenido de terceros no respaldan ni aprueban de forma implícita o explícita el contenido de terceros, ni su contenido debe ser interpretado como legal, de impuestos o inversiones.
              </p>
              <p>
                Mientras Mello Trader hace todo lo posible para proporcionar información precisa y oportuna para atender las necesidades de los usuarios, ni Mello Trader ni los Proveedores de Contenido de Terceros garantizan la exactitud, puntualidad, integridad o utilidad, y no son responsables por cualquier contenido, incluyendo cualquier tipo de publicidad, productos u otros materiales en o disponibles en sitios de terceros. Contenido de terceros se proporciona con fines informativos únicamente y Mello Trader y los proveedores de contenido de terceros niegan específicamente cualquier responsabilidad por contenidos de terceros disponibles en el sitio. Usted utilizará el Contenido de Terceros sólo a su propio riesgo. El contenido de terceros se proporciona «tal cual». Los proveedores de contenido de terceros rechazan expresamente todas las garantías de cualquier clase, expresada o implícita, incluyendo sin limitación cualquier garantía de comercialización, idoneidad para un propósito particular o no infracción.
              </p>
              <p>
                Los terceros proveedores de contenido y sus filiales, subsidiarias, afiliados, proveedores de servicios, licencias, oficiales, directores o empleados no serán responsables por ningún daño directo, indirecto, incidental, especial o derivados de o en relación con el uso o la imposibilidad de uso del contenido de terceros, incluyendo pero no limitado a daños por pérdida de beneficios, uso, datos o de otros daños intangibles, incluso si dicha parte ha sido advertida de la posibilidad de tales daños.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">EXACTITUD DE LA INFORMACIÓN</h2>
              <p>
                Mientras Mello Trader ha hecho todo lo posible para garantizar la exactitud de la información en este sitio web, la información y el contenido en el sitio web está sujeta a cambios sin previo aviso y se proporciona con el único propósito de ayudar a los traders a tomar decisiones de inversión independientes. Mello Trader ha tomado medidas razonables para asegurar la exactitud de la información en el sitio Web. Sin embargo, Mello Trader no garantiza su exactitud, y no aceptará ninguna responsabilidad por cualquier pérdida o daño que pueda surgir directa o indirectamente del contenido o de su incapacidad para acceder al sitio Web, por cualquier demora o falla en la transmisión o la recepción de cualquier instrucción o notificación enviada a través de este sitio Web.
              </p>
              <p>
                Todo el contenido de los sitios de Mello Trader se presenta sólo a partir de la fecha de publicación o indicado, y puede ser superado por los acontecimientos del mercado posteriores o por otras razones. Además, usted es responsable de establecer los valores de memoria caché de su navegador para asegurarse de que está recibiendo los datos más recientes.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">USOS PROHIBIDOS</h2>
              <p>
                Debido a que todos los servidores tienen una capacidad limitada y son utilizados por muchas personas, no utilice Páginas de Mello Trader de cualquier forma que pueda dañar o sobrecargar cualquier servidor de Mello Trader, o de cualquier red conectada a un servidor de Mello Trader. No utilice los sitios de Mello Trader en cualquier forma que pueda interferir con el uso de los Sitios de Mello Trader por terceras partes.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">USO DE ENLACES</h2>
              <p>
                El sitio web de Mello Trader puede contener enlaces a sitios web operados por otras partes. Mello Trader no controla el contenido o exactitud de la información en dichos sitios web y por lo mismo no respalda, el material colocado en tales sitios. Los vínculos se proporcionan como referencia solamente y Mello Trader excluye toda responsabilidad por el contenido o funcionamiento de estos sitios web de terceros.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">EXCLUSIÓN DE GARANTÍAS</h2>
              <p>
                Mello Trader no hace ninguna garantía expresa o implícita sobre los sitios de Mello Trader, incluyendo, pero no limitado a las garantías implícitas de comercialización, aptitud para un propósito particular o no infracción. los sitios de Mello Trader se ponen a su disposición «tal cual» y «como disponible» y Mello Trader no garantiza que cualquier defecto o imprecisiones serán corregidas.
              </p>
              <p>
                Mello Trader no garantiza que los sitios de Mello Trader cumplan con sus necesidades o que será ininterrumpido, oportuno, seguro o libre de errores. Mello Trader además no garantiza que los resultados obtenidos por el uso de los sitios de Mello Trader serán exactos o confiables, o que la calidad de los productos, servicios, información u otro material comprado u obtenido por usted a través de los sitios de Mello Trader cumpla sus expectativas.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">RENUNCIA Y LIMITACIÓN DE LA RESPONSABILIDAD</h2>
              <p>
                En la medida máxima permitida por la ley, Mello Trader no será responsable de ningún daño incidental, especial, directo o indirecto (incluyendo, pero no limitado a la pérdida de beneficios, pérdidas comerciales o daños que resulten del uso o imposibilidad de uso del sitio de Mello Trader y contenido de terceros, inconveniencia o retraso). esto es cierto inclusive si Mello Trader ha sido advertido de la posibilidad de tales daños y perjuicios.
              </p>
              <p>
                A excepción de lo que exija la ley, Mello Trader no será responsable ante usted o cualquier otra persona por cualquier pérdida resultante de una causa por la que Mello Trader no tiene control directo. esto incluye fallo electrónico o mecánico del equipo o líneas de comunicación (incluyendo teléfono, cable e internet), acceso no autorizado, virus, robo, errores del operador, mal tiempo (incluyendo inundación, terremoto, u otro acto de dios), incendios, guerras, insurrección, acto terrorista, disturbios, conflictos laborales y otros problemas laborales, accidente, emergencia o acción de gobierno.
              </p>
              <p>
                Si vive en un estado, país o jurisdicción que no permiten la exclusión o limitación de responsabilidad por daños directos o indirectos, algunas o todas las limitaciones y exclusiones pueden no aplicar a usted.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">INDEMNIZACIÓN</h2>
              <p>
                Como condición de su uso de los Sitios de Mello Trader, usted se compromete a indemnizar y mantener indemne a Mello Trader y sus proveedores de contenido de terceros de y contra cualquier y todo tipo de reclamo, pérdidas, responsabilidades, costos y gastos (incluyendo, pero no limitado a los honorarios de abogados) que surjan de su uso de los Sitios de Mello Trader, o de su violación de estos Términos.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">CONFIDENCIALIDAD</h2>
              <p>
                Es su obligación el mantener la confidencialidad de los números y contraseñas de cuentas de Mello Trader. Usted reconoce y acepta que cualquier instrucción o comunicación que se le transmita a usted o en su nombre a través de cualquier sitio de Mello Trader es a su propio riesgo. Usted autoriza a Mello Trader a confiar y actuar en consecuencia, y considerarlo plenamente autorizado y vinculado a usted, cualquier instrucción dada a Mello Trader y que Mello Trader cree que se ha dado por usted o en su nombre por cualquier agente o intermediario quien Mello Trader cree de buena fe que han sido debidamente autorizados por usted. Usted reconoce y acepta que Mello Trader tendrá derecho a confiar en su número de cuenta y / o contraseña para identificarlo y se compromete a no divulgar esta información a cualquier persona que no esté debidamente autorizada por usted.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">CANCELACIÓN</h2>
              <p>
                Mello Trader se reserva el derecho de suspender el uso de los Sitios de Mello Trader en cualquier momento, por cualquier razón, con o sin motivo y sin previo aviso.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">SEVERABILIDAD</h2>
              <p>
                Si por cualquier razón se considera cualquier disposición de estos Términos y Condiciones inválida o inejecutable, dicha disposición se aplicará en la medida máxima permitida, y las disposiciones restantes permanecerán en pleno vigor y efecto.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">LEGISLACIÓN APLICABLE Y JURISDICCIÓN</h2>
              <p>
                Salvo acuerdo contrario, estos Términos y Condiciones y su ejecución se regirán e interpretarán de acuerdo con las leyes del estado de Nueva York sin tener en cuenta los principios de conflicto de leyes, y redundará en beneficio de los sucesores y cesionarios de Mello Trader, ya sea por fusión, consolidación, o de otra manera. Este es el caso, independientemente de donde usted resida o haga negocios con Mello Trader.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-bold text-blue-600">Mello Trader SOFTWARE CONTRATO DE LICENCIA</h2>
              <p>
                Mello Trader («Mello Trader»), incluyendo todos los afiliados y subsidiarias (colectivamente, «Mello Trader») le concede la licencia del software (se define a continuación) únicamente con la condición de que acepte todos los términos contenidos en este fin de contrato de licencia de usuario («EULA»). Este acuerdo es un acuerdo legal entre usted y Mello Trader. Lea cuidadosamente antes de completar el proceso de instalación y / o el uso del software. al utilizar el software usted reconoce que ha leído los términos de la EULA y está de acuerdo con ellos. Si está de acuerdo con estos términos en nombre de una empresa u otra entidad legal, manifiesta que tiene la autoridad legal para vincular la entidad legal con estos términos. Si usted no tiene esa autoridad o si no desea estar obligado por los términos, entonces usted no puede usar el software identificado abajo o cualquier otro soporte en el que el software este contenido.
              </p>

              <h3 className="text-md font-bold text-green-600 mt-6">1. DEFINICIONES.</h3>
              <p className="ml-4">
                <strong>1.1 Software.</strong> Software se define como las plataformas descargables de Mello Trader y API's, incluyendo pero no limitando a la Estación de Operaciones, Active Trader, así como cualquier otro software, actualizaciones o correcciones de errores proporcionados por Mello Trader, y cualquier dato asociada, medios, archivos, manuales de usuario, señales, mensajes, alertas y otros documentos proporcionados a usted por Mello Trader o difundidos de otra manera por Mello Trader.
              </p>
              <p className="ml-4">
                <strong>1.2 Licencia.</strong> Licencia se define como el derecho limitado, revocable, no sub-licenciable, no exclusivo y no transferible para utilizar un software, concedido a usted.
              </p>

              <h3 className="text-md font-bold text-green-600 mt-6">2. CONCESIÓN DE LICENCIA.</h3>
              <p className="ml-4">
                Mello Trader le otorga el derecho de instalar, utilizar, tener acceso, mostrar y ejecutar el software en cualquier computador o dispositivo móvil, en su caso, que usted posee o controla, para uso personal, no comercial, a menos que usted y Mello Trader acuerden lo contrario por escrito y siempre y cuando cumpla con todos los términos y condiciones de este EULA.
              </p>

              <h3 className="text-md font-bold text-green-600 mt-6">3. ALCANCE Y LIMITACIONES.</h3>
              <p className="ml-4">
                Usted no puede alquilar, arrendar, prestar, vender, distribuir, reutilizar, retransmitir, sub-licenciar o explotar el software incluyendo el texto, gráficos, vídeo, audio, códigos, diseño de interfaz de usuario o troncos del software. Usted no puede copiar (salvo que esté expresamente permitido por este EULA), descompilar, realizar ingeniería inversa, desmontar, intentar derivar el código fuente, modificar o crear trabajos derivados del software, las actualizaciones, o cualquier parte del mismo, incluyendo, pero no limitado al texto, gráficos, vídeos, sonido, código de diseño de interfaz de usuario o troncos del software. Cualquier intento de hacerlo es una violación de los derechos de Mello Trader. Los términos del Acuerdo gobernarán cualquier actualización proporcionada por Mello Trader que sustituyen y / o complementan el software original, a menos que dicha actualización esté acompañada por una licencia independiente, en cuyo caso los términos de dicha licencia gobernaran.
              </p>
              <p className="ml-4">
                El software no está diseñado para la distribución a, o uso por cualquier persona en cualquier país o jurisdicción donde dicha distribución o uso sea contrario a la ley o regulación local. Es su responsabilidad de determinar los términos del EULA y cumplir con cualquier ley local o regulación a la que está sujeto. Usted no utilizará ni permitirá que nadie use el software con fines ilegales o no autorizados.
              </p>
              <p className="ml-4">
                La información proporcionada a usted en el software es el contenido propiedad exclusiva de Mello Trader, y en su caso, sus proveedores externos, cedentes y las filiales de la misma. Nada en este acuerdo le proporcionará ningún derecho de propiedad del Software o de cualquier información proporcionada por este.
              </p>

              <h3 className="text-md font-bold text-green-600 mt-6">4. RIESGOS.</h3>
              <p className="ml-4">
                Como condición de esta Licencia usted entiende y acepta que la descarga y / o uso del software lo expone a riesgos asociados con la descarga y / o el uso de software que no sea compatible con su computador. Usted se compromete a aceptar estos riesgos, incluyendo, pero no limitado a, fallas o daños a, hardware, software, líneas de comunicación o sistemas y equipos / u otro equipo. Mello Trader se exime expresamente de toda responsabilidad con respecto a la anterior, y usted acepta indemnizar, defender y mantener indemne a Mello Trader de cualquier y todos los daños, responsabilidades, pérdidas, costos y gastos que pudieran derivarse de ello.
              </p>

              <h3 className="text-md font-bold text-green-600 mt-6">5. CONSENTIMIENTO PARA EL USO DE DATOS.</h3>
              <p className="ml-4">
                Usted acepta que Mello Trader puede recopilar y utilizar datos técnicos e información relacionada, incluyendo pero no limitado a la información técnica sobre su equipo, sistema y software de aplicación, y periféricos, que se recogen periódicamente para facilitar la entrega de actualizaciones de software, soporte técnico del producto y otros servicios a usted (si los hay) en relación con este Acuerdo.
              </p>

              <h3 className="text-md font-bold text-green-600 mt-6">6. LINKS A CONTENIDO DE TERCEROS.</h3>
              <p className="ml-4">
                Usted puede enlazar a contenidos de terceros a través del uso del software. Los sitios de terceros no están bajo el control de Mello Trader y Mello Trader no es responsable por el contenido de los sitios externos, o por cualquier cambio o actualización en sitios de terceros. La inclusión de estos vínculos no implica aprobación por parte de Mello Trader del sitio de terceros.
              </p>
              <p className="ml-4">
                Cierta información de terceros transmitido en el software puede requerir aprobación adicional por parte del vendedor o un tercero que suministra dicha información. Usted es responsable de presentar la solicitud y la recepción de dicha aprobación por escrito del tercero y el pago de las tarifas o cargos en el caso que aplique.
              </p>

              <h3 className="text-md font-bold text-green-600 mt-6">7. TERMINACIÓN</h3>
              <p className="ml-4">
                La licencia concedida a usted bajo este acuerdo puede ser terminada por Mello Trader en cualquier momento sin previo aviso, con o sin causa. Mello Trader se reserva el derecho de suspender sus derechos bajo esta Licencia sin previo aviso de Mello Trader y si usted no cumple con cualquier término (s) de este EULA. A la terminación de la Licencia, usted deberá dejar de utilizar el software y destruir todas las copias, totales o parciales, de dicho software.
              </p>
              <p className="ml-4">
                Usted reconoce que cierta información está siendo suministrada por terceros con los que Mello Trader ha llegado a un acuerdo. En el evento que se termine todo acuerdo entre un proveedor externo de la información o el software y Mello Trader, Mello Trader dejará que le proporciona esta información o el software de forma inmediata y sin previo aviso. De conformidad con los términos del artículo 10, ni Mello Trader ni ningún proveedor tercero o proveedor de información con la que Mello Trader ha llegado a un acuerdo tendrá ninguna responsabilidad hacia usted en relación con dicha terminación.
              </p>

              <h3 className="text-md font-bold text-green-600 mt-6">8. PROPIEDAD INTELECTUAL.</h3>
              <p className="ml-4">
                Usted reconoce que el Software está protegido por derechos de autor y otras leyes de propiedad intelectual. Además, reconoce que todos los derechos, títulos e intereses sobre el mismo son propiedad exclusiva de Mello Trader y sus licenciantes, en su caso, y que usted no tiene ningún derecho, título o interés en el Software salvo especificado en este sitio. Usted se compromete a no impugnar los derechos ni de Mello Trader o los de ningún tercero o cualquier otro intento de hacer valer cualquier derecho en el software, salvo los contemplados en el presente acuerdo.
              </p>

              <h3 className="text-md font-bold text-green-600 mt-6">9. SIN GARANTÍA:</h3>
              <p className="ml-4">
                Mello Trader no hace ninguna garantía expresa o implícita sobre el software, incluyendo, pero no limitado a las garantías implícitas de comercialización, aptitud para un propósito particular o no infracción. el software se pone a usted «como es» y «según disponibilidad» y Mello Trader no garantiza que cualquier defecto o imprecisiones serán corregidos. Mello Trader no garantiza que el software cumpla con sus necesidades o que su uso será ininterrumpido, oportuno, seguro o libre de errores. Mello Trader también no garantiza que los resultados obtenidos por el uso del software serán exactos o confiables, o que la calidad de los productos, servicios, información u otro material relacionado con el software cumplan sus expectativas. ninguna información o consejo oral o escrito ofrecido por Mello Trader o su representante autorizado creará una garantía. Mello Trader y sus terceros proveedores de contenido, licencias de terceros y los afiliados del mismo no hacen ninguna garantía expresa o implícita respecto a la precisión o puntualidad de cualquier información suministrada a través del software. algunas jurisdicciones no permiten la exclusión de garantías implícitas o limitaciones de los derechos legales aplicables de un consumidor, por lo que la exclusión y limitaciones no se aplique en su caso.
              </p>

              <h3 className="text-md font-bold text-green-600 mt-6">10. LIMITACIÓN DE RESPONSABILIDAD:</h3>
              <p className="ml-4">
                En la medida que la ley, en ningún caso Mello Trader, cualquier tercero proveedor de contenido, cualquier licencia de terceros o cualquier afiliado de los mismos serán responsables por daños personales o daños indirectos, especiales, indirectos o emergentes de ningún tipo, incluyendo, sin limitación, daños por pérdida de beneficios, pérdida de datos o interrupción del negocio o cualquier otro daño o pérdida («pérdidas») comercial, derivados o relacionados con el uso o imposibilidad de uso del software por cualquier razón, con independencia de la teoría de la responsabilidad ( contrato, agravio o de otro tipo) e incluso si Mello Trader, cualquier tercero proveedor de contenido, cualquier licencia de terceros o cualquier afiliado de estas han sido advertidos de la posibilidad de tales daños. además, con la excepción de lo exija la ley, Mello Trader no será responsable ante usted o cualquier otra persona por cualquier pérdida resultante de una causa por la que dicho Mello Trader no tiene control directo. esto incluye fallo equipo electrónico o mecánico o líneas de comunicación (incluyendo teléfono, cable e internet), acceso no autorizado, virus, robo, errores del operador, condiciones de tiempo extraordinarias (incluyendo inundación, terremoto, u otro acto de dios), incendios, guerras, insurrección, acto terrorista, disturbios, conflictos laborales y otros problemas laborales, accidente, de emergencia o acción de gobierno. algunas jurisdicciones no permiten la limitación de la responsabilidad por daños personales o de daños directos o indirectos, por lo que puede que esta limitación no se aplique en su caso. el uso de cualquier software de terceros, se regirán por el contrato de licencia aplicable, en su caso, con dicho tercero. Mello Trader no es responsable de cualquier software de terceros y no se hará responsable de ningún tipo de pérdidas que resulten de su uso de dicho software de terceros con software de Mello Trader. Mello Trader ofrece ninguna garantía de ningún tipo con respecto a dicho software de terceros.
              </p>

              <h3 className="text-md font-bold text-green-600 mt-6">11. LEYES APLICABLES Y JURISDICCIÓN.</h3>
              <p className="ml-4">
                A menos que se acuerde lo contrario, el presente acuerdo y su ejecución se regirá por las leyes del estado de Nueva York, sin considerar los principios de conflicto de leyes, y redundará en beneficio de los sucesores y cesionarios de Mello Trader, ya sea por fusión, consolidación, o de otra manera . Este es el caso, independientemente de si reside o hace transacciones con Mello Trader en Nueva York o en otro lugar. A menos que un litigio se rige por una cláusula de arbitraje aplicable, usted irrevocablemente acepta someterse a la jurisdicción de los tribunales estatales y federales ubicados dentro de la ciudad y el condado de Nueva York, Nueva York y por la presente renuncia a cualquier objeción a la conveniencia o idoneidad del lugar en el mismo. Siempre, sin embargo, que nada de lo aquí contenido impedirá Mello Trader de emprender acciones legales en los tribunales de cualquier otra jurisdicción. Si por alguna razón un tribunal de jurisdicción competente considera que alguna cláusula o parte de los mismos, no es exigible, el resto de esta licencia continuará en pleno vigor y efecto.
              </p>

              <h3 className="text-md font-bold text-green-600 mt-6">12. IDIOMA OFICIAL.</h3>
              <p className="ml-4">
                Cualquier traducción de esta licencia se realiza para los requerimientos locales o para su conveniencia. En el caso de una disputa entre el las versiones no inglesas y la versión en inglés, la versión en inglés de esta Licencia se regirá, en la medida en que no esté prohibido por la ley en su jurisdicción.
              </p>

              <h3 className="text-md font-bold text-green-600 mt-6">13. LAS MODIFICACIONES DEL EULA.</h3>
              <p className="ml-4">
                Mello Trader se reserva el derecho a modificar los términos y condiciones del EULA en cualquier momento con o sin previo aviso mediante la publicación de dichas modificaciones en el sitio web https://bitpulse-frontend.fly.dev/auth?redirect=%2F&reason=no_token   Usted es responsable de revisar regularmente estos términos y condiciones para cualquier modificación y acepta que quedará vinculado por el mismo.
              </p>
            </div>

            {/* Aviso de Riesgo Destacado */}
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-6 rounded-lg mt-8">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">
                    Aviso de Riesgo
                  </h3>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Nuestros servicios incluyen productos que se operan al margen y con riesgos de pérdidas por encima de los fondos depositados. Los productos pueden no ser aptos para todos los inversionistas. Por favor asegúrese de entender los riesgos involucrados.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
