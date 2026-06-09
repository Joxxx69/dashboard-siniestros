'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFiltersStore } from '@/store/filters.store';
import {
  filtersSchema,
  type FiltersValues,
} from '../../schemas/filters.schema';
import { FilterSelect } from '../molecules/filter-select';
import { useFilterOptions } from '../../hooks/use-filter-options'
import { useSiniestros } from '../../hooks/use-siniestros';

const toOptions = (values: readonly string[]) =>
  values.map((v) => ({ value: v, label: v }));

export function SidebarFilters() {
  const { filters, setFilters, clearFilters } = useFiltersStore();
  const { provinciasData, cultivos, causas, anios, estados, isLoading: isLoadingOptions } = useFilterOptions();
  const { isLoading: isLoadingSiniestros } = useSiniestros();
  const isLoading = isLoadingOptions || isLoadingSiniestros;

  const { watch, reset, setValue } = useForm<FiltersValues>({
    resolver: zodResolver(filtersSchema),
    defaultValues: filters,
  });

  const provinciaValue = watch('provincia');

  const cantonOptions = useMemo(() => {
    const match = provinciasData.find((p) => p.value === provinciaValue);
    return match ? toOptions(match.cantones) : [];
  }, [provinciaValue, provinciasData]);

  useEffect(() => {
    const sub = watch((values) => {
      const partial: Partial<FiltersValues> = {}
      for (const [k, v] of Object.entries(values)) {
        partial[k as keyof FiltersValues] = v ?? ''
      }
      setFilters(partial)
    });
    return () => sub.unsubscribe();
  }, [watch, setFilters]);

  const handleClear = () => {
    reset();
    clearFilters();
  };

  return (
    <aside className='w-67.5 shrink-0 min-h-screen bg-linear-to-b from-[#014d1d] to-[#006b28] text-white flex flex-col'>
      <div className='p-5 border-b border-white/10'>
        <div className='bg-white text-[#014d1d] rounded-xl p-4 text-center font-bold text-sm leading-tight tracking-wide'>
          SINIESTROS
          <br />
          SEGURO AGRICOLA SUBVENCIONADO
        </div>
      </div>

      <ScrollArea className='flex-1 px-5 py-4'>
        <h2 className='text-base font-semibold mb-4 text-white/90'>Filtros</h2>

        <div className='flex flex-col gap-4'>
          <FilterSelect
            label='Provincia'
            value={watch('provincia')}
            onChange={(v) => {
              setValue('provincia', v);
              setValue('canton', '');
            }}
            options={provinciasData}
            disabled={isLoading}
          />

          <FilterSelect
            label='Cantón'
            value={watch('canton')}
            onChange={(v) => setValue('canton', v)}
            options={cantonOptions}
            disabled={isLoading || !provinciaValue}
          />

          <FilterSelect
            label='Cultivo'
            value={watch('cultivo')}
            onChange={(v) => setValue('cultivo', v)}
            options={toOptions(cultivos)}
            disabled={isLoading}
          />

          <FilterSelect
            label='Tipo de evento'
            value={watch('tipoEvento')}
            onChange={(v) => setValue('tipoEvento', v)}
            options={toOptions(causas)}
            disabled={isLoading}
          />

          <FilterSelect
            label='Año del siniestro'
            value={watch('anio')}
            onChange={(v) => setValue('anio', v)}
            options={toOptions(anios)}
            disabled={isLoading}
          />

          <FilterSelect
            label='Estado'
            value={watch('estado')}
            onChange={(v) => setValue('estado', v)}
            options={toOptions(estados)}
            disabled={isLoading}
          />
        </div>
      </ScrollArea>

      <div className='p-5 border-t border-white/10'>
        <Button
          variant='outline'
          className='w-full text-white border-white/40 bg-transparent hover:bg-white hover:text-[#014d1d] gap-2 disabled:opacity-50 disabled:cursor-not-allowed'
          onClick={handleClear}
          disabled={isLoading}
        >
          <RotateCcw className='h-4 w-4' />
          Limpiar filtros
        </Button>
      </div>
    </aside>
  );
}
