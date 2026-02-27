import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { CsvTemplate, CsvImportResult } from '@vcm/shared';

export function useCsvTemplates() {
  return useQuery<CsvTemplate[]>({
    queryKey: ['csv-templates'],
    queryFn: () => api.get('/admin/csv/templates').then((r) => r.data),
  });
}

export function useDownloadCsvTemplate() {
  return useMutation({
    mutationFn: async (type: string) => {
      const response = await api.get(`/admin/csv/templates/${type}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vcm-template-${type}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
}

export function useCsvImport() {
  return useMutation<CsvImportResult, Error, { type: string; file: File }>({
    mutationFn: async ({ type, file }) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/admin/csv/import/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
  });
}
