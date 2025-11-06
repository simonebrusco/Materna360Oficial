'use client';

import React, { useState } from 'react';
import { MentorCard } from './MentorCard';
import { MENTORS_CATALOG } from '@/app/(tabs)/cuidar/mentors.catalog';
import { Button } from '@/components/ui/Button';
import AppIcon from '@/components/ui/AppIcon';
import { useToast } from '@/components/ui/Toast';

interface MentorshipSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MentorshipSheet({ isOpen, onClose }: MentorshipSheetProps) {
  const [activeTab, setActiveTab] = useState<'mentoras' | 'tira-duvidas'>('mentoras');
  const [tema, setTema] = useState('');
  const [pergunta, setPergunta] = useState('');
  const { show: showToast } = useToast();

  if (!isOpen) return null;

  const handleEnviar = () => {
    if (tema && pergunta) {
      showToast('Pergunta enviada com sucesso! Em breve você receberá uma resposta.', 'success');
      setTema('');
      setPergunta('');
      setActiveTab('mentoras');
      onClose();
    }
  };

  const handleViewAvailability = (mentorName: string) => {
    showToast(`Conectando com ${mentorName}...`, 'info');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
          aria-hidden
        />
      )}

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="sticky top-0 border-b border-white/60 bg-white rounded-t-2xl p-4 md:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-title font-semibold text-support-1">Mentoria</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/60 rounded-full transition-colors"
              aria-label="Fechar"
            >
              <AppIcon name="x" size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab('mentoras')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'mentoras'
                  ? 'bg-primary text-white'
                  : 'bg-white/60 text-support-2 hover:bg-white/80'
              }`}
            >
              Mentoras
            </button>
            <button
              onClick={() => setActiveTab('tira-duvidas')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === 'tira-duvidas'
                  ? 'bg-primary text-white'
                  : 'bg-white/60 text-support-2 hover:bg-white/80'
              }`}
            >
              Tira-dúvidas
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-5 pb-24">
          {activeTab === 'mentoras' ? (
            <div className="space-y-4">
              <p className="text-sm text-support-2 mb-4">
                Escolha uma mentora para conversar ou agendar uma sessão.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MENTORS_CATALOG.map((mentor) => (
                  <MentorCard
                    key={mentor.id}
                    name={mentor.name}
                    specialty={mentor.specialty}
                    bullets={mentor.bullets}
                    avatarUrl={mentor.avatarUrl}
                    onViewAvailability={() => handleViewAvailability(mentor.name)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl">
              <p className="text-sm text-support-2">
                Envie uma pergunta rápida e receba uma resposta em até 24 horas.
              </p>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-support-1 mb-2">
                    Tema da pergunta
                  </label>
                  <select
                    value={tema}
                    onChange={(e) => setTema(e.target.value)}
                    className="w-full rounded-lg border border-white/60 bg-white px-3 py-2 text-sm text-support-1 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Selecione um tema...</option>
                    <option value="desenvolvimento">Desenvolvimento infantil</option>
                    <option value="saude">Saúde e bem-estar</option>
                    <option value="comportamento">Comportamento</option>
                    <option value="educacao">Educação</option>
                    <option value="alimentacao">Alimentação</option>
                    <option value="sono">Sono</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-support-1 mb-2">
                    Sua pergunta
                  </label>
                  <textarea
                    value={pergunta}
                    onChange={(e) => setPergunta(e.target.value)}
                    placeholder="Descreva sua dúvida..."
                    rows={4}
                    className="w-full rounded-lg border border-white/60 bg-white px-3 py-2 text-sm text-support-1 placeholder-support-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <Button
                  variant="primary"
                  onClick={handleEnviar}
                  disabled={!tema || !pergunta}
                  className="w-full"
                >
                  Enviar pergunta
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
