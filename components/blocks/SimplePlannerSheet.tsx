'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import AppIcon from '@/components/ui/AppIcon';

export interface PlannerItem {
  id: string;
  createdAt: number;
  title: string;
  note?: string;
  time?: string;
  done: boolean;
}

export type PlannerDraft = Omit<PlannerItem, 'id' | 'createdAt' | 'done'> & {
  done?: boolean;
};

interface SimplePlannerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (draft: PlannerDraft) => void;
}

export function SimplePlannerSheet({ isOpen, onClose, onAdd }: SimplePlannerSheetProps) {
  const [titulo, setTitulo] = useState('');
  const [nota, setNota] = useState('');
  const [horario, setHorario] = useState('');

  const handleAdd = () => {
    if (!titulo.trim()) {
      return;
    }

    onAdd({
      title: titulo.trim(),
      note: nota.trim() || undefined,
      time: horario.trim() || undefined,
    });

    // Clear form
    setTitulo('');
    setNota('');
    setHorario('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm md:items-center">
      <div className="w-full max-w-lg px-4 pb-12 pt-6 sm:px-0">
        <Card className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-support-1">Adicionar Item</h3>
            <button
              onClick={onClose}
              className="text-support-2 hover:text-support-1 transition-colors"
              aria-label="Fechar"
            >
              <AppIcon name="x" size={20} decorative />
            </button>
          </div>

          <div className="space-y-4">
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-support-1 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Digite o título do item"
                className="w-full rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-support-1 placeholder:text-support-2/60 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Horário */}
            <div>
              <label className="block text-sm font-medium text-support-1 mb-2">
                Horário (opcional)
              </label>
              <input
                type="time"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="w-full rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-support-1 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Nota */}
            <div>
              <label className="block text-sm font-medium text-support-1 mb-2">
                Nota (opcional)
              </label>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Adicione detalhes..."
                className="w-full rounded-2xl border border-white/40 bg-white/70 p-3 text-sm text-support-1 placeholder:text-support-2/60 shadow-soft focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                size="md"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleAdd}
                disabled={!titulo.trim()}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <AppIcon name="plus" size={16} decorative />
                Adicionar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
