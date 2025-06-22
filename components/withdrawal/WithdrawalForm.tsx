'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, DollarSign, Building, Banknote } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface WithdrawalFormProps {
  userBalance: number
  onSuccess?: () => void
  onCancel?: () => void
}

export default function WithdrawalForm({ userBalance, onSuccess, onCancel }: WithdrawalFormProps) {
  const [withdrawalType, setWithdrawalType] = useState<'bank_account' | 'crypto'>('bank_account')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Comunes
    amount: '',
    
    // Cuenta Bancaria
    bankName: '',
    accountType: '',
    accountNumber: '',
    city: '',
    
    // Criptomonedas
    cryptoType: '',
    networkType: '',
    walletAddress: ''
  })

  // Función para calcular el valor interpretado (simplificada)
  const calculateParsedAmount = (inputAmount: string): number => {
    if (!inputAmount || inputAmount.trim() === '') return 0
    
    // Limpieza básica
    let clean = inputAmount.trim().replace(/[^\d.,]/g, '')
    
    // Casos específicos comunes
    if (clean === "50000") return 50000
    if (clean === "50.000") return 50000
    if (clean === "5000") return 5000
    if (clean === "5.000") return 5000
    
    // Remover comas (siempre son separadores de miles)
    clean = clean.replace(/,/g, '')
    
    // Si no hay puntos, es número entero
    if (!clean.includes('.')) {
      const num = parseFloat(clean)
      return isNaN(num) ? 0 : num
    }
    
    // Si hay un punto
    const parts = clean.split('.')
    if (parts.length === 2) {
      // Si después del punto hay exactamente 3 dígitos, es separador de miles
      if (parts[1].length === 3 && /^\d+$/.test(parts[1])) {
        const combined = parts[0] + parts[1]
        const num = parseFloat(combined)
        return isNaN(num) ? 0 : num
      } else {
        // Es punto decimal
        const num = parseFloat(clean)
        return isNaN(num) ? 0 : num
      }
    }
    
    // Múltiples puntos: los primeros son separadores de miles
    const lastDotIndex = clean.lastIndexOf('.')
    const beforeLast = clean.substring(0, lastDotIndex).replace(/\./g, '')
    const afterLast = clean.substring(lastDotIndex)
    const combined = beforeLast + afterLast
    const num = parseFloat(combined)
    return isNaN(num) ? 0 : num
  }

  const parsedAmount = calculateParsedAmount(formData.amount)
  


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = parsedAmount
    
    // Validaciones
    if (!amount || amount <= 0) {
      toast({
        title: "Error",
        description: "El monto debe ser mayor a 0",
        variant: "destructive"
      })
      return
    }

    if (amount > userBalance) {
      toast({
        title: "Saldo insuficiente",
        description: `No puedes retirar más de $${userBalance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}. Estás intentando retirar $${amount.toLocaleString('es-CO', { minimumFractionDigits: 2 })}`,
        variant: "destructive"
      })
      return
    }

    // Validar campos específicos según tipo
    if (withdrawalType === 'bank_account') {
      if (!formData.bankName || !formData.accountType || !formData.accountNumber || !formData.city) {
        toast({
          title: "Campos incompletos",
          description: "Completa todos los campos de la cuenta bancaria",
          variant: "destructive"
        })
        return
      }
    } else {
      if (!formData.cryptoType || !formData.networkType || !formData.walletAddress) {
        toast({
          title: "Campos incompletos", 
          description: "Completa todos los campos de criptomoneda",
          variant: "destructive"
        })
        return
      }
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          type: withdrawalType,
          amount,
          bankName: withdrawalType === 'bank_account' ? formData.bankName : undefined,
          accountType: withdrawalType === 'bank_account' ? formData.accountType : undefined,
          accountNumber: withdrawalType === 'bank_account' ? formData.accountNumber : undefined,
          city: withdrawalType === 'bank_account' ? formData.city : undefined,
          cryptoType: withdrawalType === 'crypto' ? formData.cryptoType : undefined,
          networkType: withdrawalType === 'crypto' ? formData.networkType : undefined,
          walletAddress: withdrawalType === 'crypto' ? formData.walletAddress : undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Solicitud enviada",
          description: "Tu solicitud de retiro ha sido enviada y está pendiente de aprobación",
          variant: "default"
        })
        
        // Limpiar formulario
        setFormData({
          amount: '',
          bankName: '',
          accountType: '',
          accountNumber: '',
          city: '',
          cryptoType: '',
          networkType: '',
          walletAddress: ''
        })
        
        onSuccess?.()
      } else {
        toast({
          title: "Error",
          description: result.message || "Error al procesar la solicitud",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error)
      toast({
        title: "Error",
        description: "Error de conexión. Intenta nuevamente.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Solicitar Retiro
        </CardTitle>
        <CardDescription>
          Saldo disponible: ${userBalance.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto a retirar (USD) *</Label>
            <Input
              id="amount"
              type="text"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              placeholder="50.000 o 50000.00"
              required
            />
            {formData.amount && parsedAmount > 0 && (
              <div className="text-sm text-muted-foreground">
                Valor interpretado: <span className="font-medium text-green-600">
                  ${parsedAmount.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                </span>
                {parsedAmount > userBalance && (
                  <span className="text-red-600 ml-2">⚠️ Excede el saldo disponible</span>
                )}
              </div>
            )}
          </div>

          {/* Tipo de retiro */}
          <Tabs value={withdrawalType} onValueChange={(value) => setWithdrawalType(value as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="bank_account" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Cuenta Bancaria
              </TabsTrigger>
              <TabsTrigger value="crypto" className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Criptomonedas
              </TabsTrigger>
            </TabsList>

            {/* Formulario Cuenta Bancaria */}
            <TabsContent value="bank_account" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankName">Banco *</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                    placeholder="Nombre del banco"
                    required={withdrawalType === 'bank_account'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountType">Tipo de cuenta *</Label>
                  <Select 
                    value={formData.accountType} 
                    onValueChange={(value) => setFormData({...formData, accountType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ahorros">Ahorros</SelectItem>
                      <SelectItem value="corriente">Corriente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Número de cuenta *</Label>
                  <Input
                    id="accountNumber"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                    placeholder="1234567890"
                    required={withdrawalType === 'bank_account'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ciudad *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Ciudad del banco"
                    required={withdrawalType === 'bank_account'}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Formulario Criptomonedas */}
            <TabsContent value="crypto" className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cryptoType">Criptomoneda *</Label>
                  <Select 
                    value={formData.cryptoType} 
                    onValueChange={(value) => setFormData({...formData, cryptoType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cripto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USDT">USDT</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                      <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="networkType">Tipo de red *</Label>
                  <Input
                    id="networkType"
                    value={formData.networkType}
                    onChange={(e) => setFormData({...formData, networkType: e.target.value})}
                    placeholder="ej: TRC20, ERC20, BEP20"
                    required={withdrawalType === 'crypto'}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="walletAddress">Dirección de wallet *</Label>
                <Input
                  id="walletAddress"
                  value={formData.walletAddress}
                  onChange={(e) => setFormData({...formData, walletAddress: e.target.value})}
                  placeholder="Dirección de tu wallet de criptomonedas"
                  required={withdrawalType === 'crypto'}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Advertencia */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
              <div className="text-sm text-yellow-800">
                <strong>Importante:</strong> Las solicitudes de retiro son revisadas manualmente. 
                El procesamiento puede tomar de 1 a 3 días hábiles. Una vez aprobada, 
                el monto será descontado de tu saldo disponible.
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Enviando...' : 'Solicitar Retiro'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 