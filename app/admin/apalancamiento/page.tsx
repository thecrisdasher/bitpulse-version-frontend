"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MarketCategory } from '@/lib/config/leverage';

interface LeverageSettings {
  [key: string]: number;
}

const categories: MarketCategory[] = ['acciones', 'materias-primas', 'criptomonedas', 'divisas', 'indices'];

const AdminLeveragePage: React.FC = () => {
  const [settings, setSettings] = useState<LeverageSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/admin/leverage', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.leverageSettings || {});
      } else {
        toast.error('Error al cargar apalancamientos');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSave = async (category: MarketCategory) => {
    const value = settings[category];
    const res = await fetch(`/api/admin/leverage/${category}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leverage: Number(value) }),
    });
    if (res.ok) {
      toast.success('Apalancamiento actualizado');
    } else {
      toast.error('Error al actualizar');
    }
  };

  if (loading) {
    return <p className="p-6">Cargando...</p>;
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Apalancamientos por Mercado</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize">
                <Badge variant="secondary" className="text-sm">
                  {category}
                </Badge>
                Apalancamiento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="number"
                min={1}
                value={settings[category] ?? ''}
                onChange={(e) => setSettings({ ...settings, [category]: Number(e.target.value) })}
              />
              <Button onClick={() => handleSave(category)}>Guardar</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminLeveragePage; 