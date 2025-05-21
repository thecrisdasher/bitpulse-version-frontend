"use client"

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { InfoIcon, BookOpen, MessageSquare, HelpCircle, Search } from "lucide-react"

// Preguntas frecuentes simuladas reducidas
const faqs = [
  {
    question: "¿Cómo puedo crear una cuenta?",
    answer: "Para crear una cuenta, haz clic en el botón 'Registrarse' en la esquina superior derecha de la página principal. Completa el formulario con tu información personal."
  },
  {
    question: "¿Es seguro invertir en criptomonedas?",
    answer: "La inversión en criptomonedas conlleva riesgos debido a su alta volatilidad. Recomendamos investigar a fondo antes de invertir."
  },
  {
    question: "¿Por qué no se cargan los datos de algunas criptomonedas?",
    answer: "Esto puede deberse a problemas temporales con nuestros proveedores de datos. BitPulse utiliza múltiples fuentes y cambia automáticamente entre ellas cuando una falla."
  },
  {
    question: "¿Cómo puedo exportar mis datos de portfolio?",
    answer: "Para exportar tus datos, ve a Configuración > Cuenta > Opciones de cuenta y selecciona 'Exportar datos'."
  }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [contactFormData, setContactFormData] = useState({
    name: "",
    email: "",
    message: ""
  })
  
  // Filtrar FAQs basado en la búsqueda
  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Manejar cambios en el formulario de contacto
  const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Enviar formulario de contacto (simulado)
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Tu mensaje ha sido enviado. Te responderemos a la brevedad.");
    setContactFormData({
      name: "",
      email: "",
      message: ""
    });
  };
  
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Ayuda y Soporte</h1>
            <p className="text-muted-foreground">
              Encuentra respuestas, aprende a usar BitPulse y contacta con nuestro equipo
            </p>
          </header>
          
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              type="search"
              placeholder="Buscar en ayuda y soporte..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs defaultValue="faq" className="mb-8">
            <TabsList className="grid grid-cols-1 md:grid-cols-3 mb-4">
              <TabsTrigger value="faq">
                <HelpCircle className="h-4 w-4 mr-2" />
                Preguntas Frecuentes
              </TabsTrigger>
              <TabsTrigger value="docs">
                <BookOpen className="h-4 w-4 mr-2" />
                Documentación
              </TabsTrigger>
              <TabsTrigger value="contact">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contacto
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="faq">
              <Card>
                <CardHeader>
                  <CardTitle>Preguntas Frecuentes</CardTitle>
                  <CardDescription>
                    Respuestas a las preguntas más comunes sobre BitPulse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {searchQuery && filteredFaqs.length === 0 ? (
                    <div className="text-center py-6">
                      <InfoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">No se encontraron resultados</p>
                      <p className="text-muted-foreground">Intenta con otra búsqueda o contacta con soporte</p>
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="w-full">
                      {filteredFaqs.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger>{faq.question}</AccordionTrigger>
                          <AccordionContent>{faq.answer}</AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="docs">
              <Card>
                <CardHeader>
                  <CardTitle>Documentación</CardTitle>
                  <CardDescription>
                    Guías y tutoriales para aprovechar al máximo BitPulse
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Documentación en proceso</p>
                    <p className="text-muted-foreground">Estamos trabajando en la documentación completa de BitPulse</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle>Contacta con Nosotros</CardTitle>
                  <CardDescription>
                    Estamos aquí para ayudarte. Envíanos tu consulta y te responderemos a la brevedad.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                          Nombre
                        </label>
                        <Input
                          id="name"
                          name="name"
                          value={contactFormData.name}
                          onChange={handleContactFormChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                          Correo electrónico
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={contactFormData.email}
                          onChange={handleContactFormChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium">
                        Mensaje
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        rows={6}
                        value={contactFormData.message}
                        onChange={handleContactFormChange}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Enviar mensaje
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
} 