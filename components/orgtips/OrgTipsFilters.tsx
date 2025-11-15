'use client';

import React, { useCallback, useState } from 'react';
import AppIcon from '@/components/ui/AppIcon';

interface OrgTipsFiltersProps {
  onSearchChange: (text: string) => void;
  onTagsChange: (tags: string[]) => void;
  selectedTags: string[];
}

const AVAILABLE_TAGS = ['Rotina', 'Casa', 'Estudos', 'Autocuidado'];

export function OrgTipsFilters({
  onSearchChange,
  onTagsChange,
  selectedTags,
}: OrgTipsFiltersProps) {
  const [searchText, setSearchText] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchText(text);
      if (searchTimeout) clearTimeout(searchTimeout);
      const timeout = setTimeout(() => {
        onSearchChange(text);
      }, 250);
      setSearchTimeout(timeout);
    },
    [searchTimeout, onSearchChange]
  );

  const handleTagToggle = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onTagsChange(newTags);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <AppIcon name="search" size={18} className="absolute left-3 top-3 text-support-3 pointer-events-none" />
        <input
          type="text"
          value={searchText}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar dica..."
          className="w-full rounded-lg border border-white/60 bg-white pl-10 pr-3 py-2 text-sm text-support-1 placeholder-support-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Tag Pills */}
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagToggle(tag)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTags.includes(tag)
                ? 'bg-primary text-white'
                : 'bg-white/60 text-support-2 hover:bg-white/80'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
