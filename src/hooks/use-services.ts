import { useQuery } from '@tanstack/react-query';
import { services as previewServices, type Service } from '../lib/catalog';
import { isBackendConfigured, supabase } from '../lib/supabase';
import { isDemoMode } from '../lib/mode';

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    enabled: !isDemoMode && isBackendConfigured,
    queryFn: async (): Promise<Service[]> => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { data, error } = await supabase
        .from('services')
        .select('id, name, name_ar, description, base_price_aed')
        .eq('enabled', true)
        .order('name');
      if (error) throw error;
      return (data ?? []).map((service) => ({
        id: service.id,
        title: service.name,
        arabicTitle: service.name_ar,
        description: service.description,
        icon: previewServices.find((item) => item.id === service.id)?.icon ?? '🔧',
        priceFrom: Number(service.base_price_aed),
      }));
    },
  });
}

export function getPreviewServices(): Service[] {
  return previewServices;
}
