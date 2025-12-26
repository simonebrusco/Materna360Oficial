'use client';

import { useState, useCallback, useEffect } from 'react';
import AppIcon from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';

export interface MemoryData {
  id: string;
  title: string;
  description: string;
  icon: string;
  image?: string;
  timestamp: string;
}

interface MemoryModalProps {
  isOpen: boolean;
  memory: MemoryData | null;
  onClose: () => void;
  onSave: (memory: MemoryData) => void;
  onDelete: (memoryId: string) => void;
  availableIcons?: string[];
}

const DEFAULT_ICONS = ['heart', 'star', 'sparkles', 'bookmark', 'smile', 'sun', 'crown'];

export function MemoryModal({
  isOpen,
  memory,
  onClose,
  onSave,
  onDelete,
  availableIcons = DEFAULT_ICONS,
}: MemoryModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<string>('heart');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize form when memory changes
  useEffect(() => {
    if (memory) {
      setTitle(memory.title || '');
      setDescription(memory.description || '');
      setSelectedIcon(memory.icon || 'heart');
      setImagePreview(memory.image || null);
      setShowDeleteConfirm(false);
      setSaveStatus('idle');
    } else {
      resetForm();
    }
  }, [memory, isOpen]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedIcon('heart');
    setImagePreview(null);
    setShowDeleteConfirm(false);
    setSaveStatus('idle');
  };

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim() || !description.trim()) {
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');

    // Clear previous timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const newMemory: MemoryData = {
      id: memory?.id || `memory-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      icon: selectedIcon,
      image: imagePreview || undefined,
      timestamp: memory?.timestamp || new Date().toISOString(),
    };

    onSave(newMemory);

    // Show saving status briefly
    const timeout = setTimeout(() => {
      setSaveStatus('saved');
      setIsSaving(false);
      const hideTimeout = setTimeout(() => {
        setSaveStatus('idle');
      }, 1500);
      return () => clearTimeout(hideTimeout);
    }, 300);

    setSaveTimeout(timeout);
  }, [title, description, selectedIcon, imagePreview, memory, onSave, saveTimeout]);

  const handleDeleteClick = useCallback(() => {
    if (!memory?.id) return;
    setShowDeleteConfirm(false);
    onDelete(memory.id);
    onClose();
  }, [memory?.id, onDelete, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* MODAL PANEL */}
      <div
        className="absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.12)] max-h-[90vh] overflow-y-auto animate-[slide-up_0.3s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-label={memory ? 'Editar Memória' : 'Nova Memória'}
      >
        <div className="p-6 md:p-8 space-y-5">
          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[1rem] md:text-[1.1rem] font-semibold text-[#3A3A3A]">
                {memory ? 'Editar Memória' : 'Nova Memória'}
              </h2>
              <p className="text-[0.85rem] text-[#6A6A6A] mt-1">
                Personalize este momento especial.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 rounded-lg p-2 text-[#6A6A6A] hover:bg-[#ffd8e6]/30 transition-colors"
              aria-label="Fechar"
            >
              <AppIcon name="x" size={20} decorative />
            </button>
          </div>

          {/* TITLE FIELD */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#3A3A3A] uppercase tracking-wide">
              Título da memória
            </label>
            <input
              type="text"
              placeholder="Ex: Primeiro sorriso do bebê"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#ffd8e6] bg-white text-[#3A3A3A] placeholder-[#6A6A6A] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF1475]/30 focus:border-[#FF1475] transition-all duration-150"
              autoFocus
            />
          </div>

          {/* DESCRIPTION FIELD */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#3A3A3A] uppercase tracking-wide">
              Descrição
            </label>
            <textarea
              placeholder="Descreva este momento especial em detalhes…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#ffd8e6] bg-white text-[#3A3A3A] placeholder-[#6A6A6A] text-sm focus:outline-none focus:ring-2 focus:ring-[#FF1475]/30 focus:border-[#FF1475] transition-all duration-150 resize-none min-h-[100px]"
            />
          </div>

          {/* ICON SELECTOR */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[#3A3A3A] uppercase tracking-wide">
              Escolha um ícone
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {availableIcons.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`flex-shrink-0 w-10 h-10 rounded-full border-2 transition-all duration-150 flex items-center justify-center ${
                    selectedIcon === icon
                      ? 'border-[#FF1475] bg-[#ffd8e6] shadow-[0_4px_12px_rgba(255,0,94,0.16)]'
                      : 'border-[#ffd8e6] bg-white hover:border-[#FF1475]/50'
                  }`}
                  aria-label={icon}
                  title={icon}
                >
                  <AppIcon
                    name={icon as any}
                    size={18}
                    className={selectedIcon === icon ? 'text-[#FF1475]' : 'text-[#6A6A6A]'}
                    decorative
                  />
                </button>
              ))}
            </div>
          </div>

          {/* IMAGE INPUT */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[#3A3A3A] uppercase tracking-wide">
              Adicionar uma foto
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="w-full px-4 py-2 rounded-xl border border-[#ffd8e6] bg-white text-sm text-[#6A6A6A] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#FF1475]/10 file:text-[#FF1475] hover:file:bg-[#FF1475]/20 transition-all"
            />

            {imagePreview && (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#ffd8e6] bg-white/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Prévia da memória"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setImagePreview(null)}
                  className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-all"
                  aria-label="Remover imagem"
                >
                  <AppIcon name="x" size={16} decorative />
                </button>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="space-y-3 pt-4">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!title.trim() || !description.trim() || isSaving}
              className="w-full h-11 rounded-xl"
            >
              <AppIcon name="check" size={16} decorative className="mr-2" />
              {saveStatus === 'saving' && 'Salvando…'}
              {saveStatus === 'saved' && 'Tudo salvo'}
              {saveStatus === 'idle' && 'Salvar memória'}
            </Button>

            {memory && (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full h-11 rounded-xl"
              >
                <AppIcon name="x" size={16} decorative className="mr-2" />
                Excluir memória
              </Button>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowDeleteConfirm(false)}
                aria-hidden="true"
              />
              <div className="relative bg-white rounded-3xl p-6 max-w-sm mx-4 shadow-[0_20px_48px_rgba(0,0,0,0.15)]">
                <h3 className="text-base font-semibold text-[#3A3A3A] mb-2">
                  Excluir memória?
                </h3>
                <p className="text-sm text-[#6A6A6A] mb-6">
                  Esta ação não pode ser desfeita.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 h-10 rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteClick}
                    className="flex-1 h-10 rounded-xl"
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
