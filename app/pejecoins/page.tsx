"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/Sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/contexts/AuthContext"
import { Coins, History, DollarSign, ArrowRight } from "lucide-react"
import { CompatButton as Button } from "@/components/ui/compat-button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PejecoinsPage() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const [transactions, setTransactions] = useState<any[]>([]);

  // admin management state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState<number>(100);
  const [concept, setConcept] = useState('Asignación de PejeCoins');
  const [balance, setBalance] = useState(user?.pejecoins || 0);

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/admin/users?role=cliente', { credentials: 'include' })
        .then(r => r.json()).then(data => setUsersList(data.users || []));
    }
  }, [isAdmin]);

  useEffect(() => {
    fetch('/api/pejecoins', { credentials: 'include' })
      .then(r=>r.json()).then(d=>{
        if(d.success){
          setBalance(d.data.balance);
          setTransactions(d.data.transactions);
        }
      });
  }, []);

  const handleAssign = async () => {
    if (!selectedUserId || amount <= 0) {
      toast.error('Selecciona usuario y monto válido');
      return;
    }
    const res = await fetch('/api/admin/pejecoins', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selectedUserId, amount, concept })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      toast.success('PejeCoins asignados');
      setSelectedUserId('');
      setAmount(100);
      // refrescar balance si asignamos a nuestro propio usuario o para mostrar consistencia
      fetch('/api/auth/profile', { credentials: 'include' })
        .then(r=>r.json()).then(p=>{ if(p.success && p.data){ setBalance(p.data.pejecoins); } });
    } else {
      toast.error(data.message || 'Error');
    }
  };

  const formatPejecoins = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Coins className="w-8 h-8 text-primary" />
              {isAdmin ? 'Manejo de Dólares' : 'Mis Dólares'}
            </h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'Administra los saldos de Dólares de los usuarios.' : 'Consulta tu saldo y tu historial de transacciones.'}
            </p>
          </header>

          <div className="container mx-auto max-w-7xl space-y-8">
            {isAdmin && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Asignar Dólares a Usuario
                  </CardTitle>
                  <CardDescription>Selecciona un cliente y define el monto.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Usuario</Label>
                      <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                        <SelectTrigger><SelectValue placeholder="Selecciona usuario" /></SelectTrigger>
                        <SelectContent>
                          {usersList.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Monto</Label>
                      <Input type="number" value={amount} onChange={e=>setAmount(Number(e.target.value))} min={1} />
                    </div>
                    <div>
                      <Label>Concepto</Label>
                      <Input value={concept} onChange={e=>setConcept(e.target.value)} />
                    </div>
                    <Button onClick={handleAssign} disabled={!selectedUserId || amount<=0}>Asignar</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="w-full md:w-1/2 lg:w-1/3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  Saldo Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">
                  {formatPejecoins(balance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Este es tu capital de práctica para operar sin riesgo.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Historial de Movimientos
                </CardTitle>
                <CardDescription>
                  Aquí puedes ver todas tus transacciones de Dólares.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell>{new Date(tx.timestamp).toLocaleString('es-CO',{dateStyle:'short', timeStyle:'short'})}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              tx.amount > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {tx.concept === 'Asignación de pejecoins por administrador' ? 'Depósito Admin' : 'Operación'}
                            </span>
                          </TableCell>
                          <TableCell>{tx.concept}</TableCell>
                          <TableCell className={`text-right font-medium ${
                            tx.amount > 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {tx.amount > 0 ? '+' : ''}{formatPejecoins(tx.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No hay transacciones para mostrar.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
} 