'use client';

import React from 'react';
import AppIcon from '@/components/ui/AppIcon';
import { CheckCircle2 } from 'lucide-react';
import type { PlannerItem } from './SimplePlannerSheet';

interface SimplePlannerListProps {
  items: PlannerItem[];
  onToggleDone: (id: string) => void;
}

export function SimplePlannerList({ items, onToggleDone }: SimplePlannerListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-support-2">Nenhum item adicionado ainda.</p>
        <p className="text-xs text-support-2/60 mt-1">Use o botão "Adicionar item" para começar.</p>
      </div>
    );
  }

  const activeTodos = items.filter((item) => !item.done);
  const completedTodos = items.filter((item) => item.done);

  return (
    <div className="space-y-4">
      {/* Active todos */}
      {activeTodos.length > 0 && (
        <div className="space-y-2">
          {activeTodos.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-xl bg-white/70 border border-white/40 p-3 hover:shadow-soft transition-shadow"
            >
              <button
                onClick={() => onToggleDone(item.id)}
                className="mt-1 flex-shrink-0 rounded-lg w-5 h-5 border-2 border-support-2 bg-white hover:border-primary transition-colors flex items-center justify-center"
                aria-label="Marcar como feito"
              >
                <span className="sr-only">Marcar como feito</span>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-support-1 line-clamp-2">{item.title}</p>
                {item.time && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-support-2">
                    <AppIcon name="clock" size={12} decorative />
                    {item.time}
                  </div>
                )}
                {item.note && <p className="text-xs text-support-2/70 mt-1">{item.note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed todos */}
      {completedTodos.length > 0 && (
        <div>
          <p className="text-xs font-medium text-support-2/60 mb-2">Concluído ({completedTodos.length})</p>
          <div className="space-y-2">
            {completedTodos.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-xl bg-support-1/5 border border-support-1/10 p-3 opacity-60"
              >
                <button
                  onClick={() => onToggleDone(item.id)}
                  className="mt-1 flex-shrink-0 rounded-lg w-5 h-5 bg-support-1 flex items-center justify-center"
                  aria-label="Desmarcar"
                >
                  <AppIcon name="check" size={14} decorative className="text-white" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-support-1 line-clamp-2 line-through">{item.title}</p>
                  {item.time && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-support-2">
                      <AppIcon name="clock" size={12} decorative />
                      {item.time}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
