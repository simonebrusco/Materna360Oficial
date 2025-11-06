'use client';

import React, { useMemo, useState } from 'react';
import { OrgTipsFilters } from './OrgTipsFilters';
import { OrgTipCard } from './OrgTipCard';
import { ORGTIPS_CATALOG } from '@/app/(tabs)/cuidar/orgtips.catalog';
import { Empty } from '@/components/ui/Empty';
import { useToast } from '@/components/ui/Toast';
import GridRhythm from '@/components/common/GridRhythm';

export function OrgTipsClient() {
  const [searchText, setSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { toast } = useToast();

  // Filter and sort logic
  const filteredTips = useMemo(() => {
    return ORGTIPS_CATALOG.filter((tip) => {
      // Text filter
      const textMatch =
        searchText === '' ||
        tip.title.toLowerCase().includes(searchText.toLowerCase()) ||
        tip.summary.toLowerCase().includes(searchText.toLowerCase());

      // Tag filter (AND)
      const tagsMatch =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => tip.tags.includes(tag));

      return textMatch && tagsMatch;
    })
      .sort((a, b) => {
        // Relevance scoring
        let scoreA = 0;
        let scoreB = 0;

        // Text match scoring
        if (searchText) {
          const searchLower = searchText.toLowerCase();
          if (a.title.toLowerCase().includes(searchLower)) scoreA += 2;
          if (a.summary.toLowerCase().includes(searchLower)) scoreA += 1;
          if (b.title.toLowerCase().includes(searchLower)) scoreB += 2;
          if (b.summary.toLowerCase().includes(searchLower)) scoreB += 1;
        }

        // Tag match scoring
        scoreA += a.tags.filter((tag) => selectedTags.includes(tag)).length;
        scoreB += b.tags.filter((tag) => selectedTags.includes(tag)).length;

        return scoreB - scoreA;
      });
  }, [searchText, selectedTags]);

  const handleSave = (tipTitle: string) => {
    toast({ title: `"${tipTitle}" salva no Planner`, kind: 'success' });
    // Telemetry
    console.log('[telemetry] orgtips.saved_to_planner', { tip: tipTitle });
  };

  const handleClearFilters = () => {
    setSearchText('');
    setSelectedTags([]);
  };

  return (
    <div className="space-y-6">
      <OrgTipsFilters
        onSearchChange={setSearchText}
        onTagsChange={setSelectedTags}
        selectedTags={selectedTags}
      />

      {filteredTips.length > 0 ? (
        <GridRhythm className="grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTips.map((tip) => (
            <OrgTipCard
              key={tip.id}
              title={tip.title}
              summary={tip.summary}
              tags={tip.tags}
              details={tip.details}
              onSave={() => handleSave(tip.title)}
              onDetails={() => {
                console.log('[telemetry] orgtips.view_details', { tip: tip.id });
              }}
            />
          ))}
        </GridRhythm>
      ) : (
        <Empty
          icon="sparkles"
          title="Nenhuma dica encontrada"
          subtitle="Tente ajustar os filtros para encontrar mais dicas."
          actionLabel="Limpar filtros"
          onAction={handleClearFilters}
        />
      )}
    </div>
  );
}

export const OrgTips = OrgTipsClient;
