'use client';
import * as React from 'react';
import { SoftCard } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';

export default function Table({ filtered, page, pageSize, totalPages, setPage }: any) {
  const start = (page - 1) * pageSize;
  const slice = filtered.slice(start, start + pageSize);

  return (
    <SoftCard className="p-0 overflow-x-auto">
      <table className="min-w-[720px] w-full text-sm">
        <thead>
          <tr className="text-left border-b bg-gray-50">
            <th className="p-3 font-semibold text-gray-700">Date</th>
            <th className="p-3 font-semibold text-gray-700">Type</th>
            <th className="p-3 font-semibold text-gray-700">Route</th>
            <th className="p-3 font-semibold text-gray-700">Meta</th>
          </tr>
        </thead>
        <tbody>
          {slice.map((e: any) => (
            <tr key={e.id} className="border-b last:border-0 align-top hover:bg-gray-50">
              <td className="p-3 text-xs text-gray-600">
                {new Date(e.ts).toLocaleString()}
              </td>
              <td className="p-3 text-xs font-mono text-gray-700">{e.type}</td>
              <td className="p-3 text-xs font-mono text-gray-700">{e.route ?? '-'}</td>
              <td className="p-3 text-xs">
                <pre className="whitespace-pre-wrap break-all text-gray-600">
                  {JSON.stringify(e.meta ?? {}, null, 2)}
                </pre>
              </td>
            </tr>
          ))}
          {!slice.length && (
            <tr>
              <td className="p-3 text-center text-gray-500" colSpan={4}>
                No events for current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex items-center justify-between p-3 border-t bg-gray-50">
        <span className="text-xs text-gray-600">
          Page {page} / {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </SoftCard>
  );
}
