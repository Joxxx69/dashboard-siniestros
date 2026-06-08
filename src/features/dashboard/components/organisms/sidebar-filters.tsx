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
import {
  PROVINCIAS_DATA,
  CULTIVOS,
  TIPOS_EVENTO,
  ESTADOS_TRAMITE,
  ANIOS,
} from '../../constants/filters.constants';

const toOptions = (values: readonly string[]) =>
  values.map((v) => ({ value: v, label: v }));

export function SidebarFilters() {
  const { filters, setFilter, clearFilters } = useFiltersStore();

  const { watch, reset, setValue } = useForm<FiltersValues>({
    resolver: zodResolver(filtersSchema),
    defaultValues: filters,
  });

  const provinciaValue = watch('provincia');

  const cantonOptions = useMemo(() => {
    const match = PROVINCIAS_DATA.find((p) => p.value === provinciaValue);
    return match ? toOptions(match.cantones) : [];
  }, [provinciaValue]);

  useEffect(() => {
    const sub = watch((values) => {
      Object.entries(values).forEach(([key, val]) => {
        setFilter(key as keyof FiltersValues, val ?? '');
      });
    });
    return () => sub.unsubscribe();
  }, [watch, setFilter]);

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
          AGROPROTEGE
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
            options={PROVINCIAS_DATA}
          />

          <FilterSelect
            label='Cantón'
            value={watch('canton')}
            onChange={(v) => setValue('canton', v)}
            options={cantonOptions}
          />

          <FilterSelect
            label='Cultivo'
            value={watch('cultivo')}
            onChange={(v) => setValue('cultivo', v)}
            options={toOptions(CULTIVOS)}
          />

          <FilterSelect
            label='Tipo de evento'
            value={watch('tipoEvento')}
            onChange={(v) => setValue('tipoEvento', v)}
            options={toOptions(TIPOS_EVENTO)}
          />

          <FilterSelect
            label='Año del siniestro'
            value={watch('anio')}
            onChange={(v) => setValue('anio', v)}
            options={toOptions(ANIOS)}
          />

          <FilterSelect
            label='Estado del trámite'
            value={watch('estado')}
            onChange={(v) => setValue('estado', v)}
            options={toOptions(ESTADOS_TRAMITE)}
          />
        </div>
      </ScrollArea>

      <div className='p-5 border-t border-white/10'>
        <Button
          variant='outline'
          className='w-full text-white border-white/40 bg-transparent hover:bg-white hover:text-[#014d1d] gap-2'
          onClick={handleClear}
        >
          <RotateCcw className='h-4 w-4' />
          Limpiar filtros
        </Button>
      </div>
    </aside>
  );
}
