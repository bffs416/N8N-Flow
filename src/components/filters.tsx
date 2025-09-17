
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Star, ChevronDown, Check, X } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface WorkflowFiltersProps {
  mainAreas: string[];
  complexities: string[];
  selectedMainAreas: string[];
  setSelectedMainAreas: (value: string[]) => void;
  complexityFilter: string;
  setComplexityFilter: (value: string) => void;
  showFavorites: boolean;
  setShowFavorites: (value: boolean) => void;
  disabled?: boolean;
}

export function WorkflowFilters({
  mainAreas,
  complexities,
  selectedMainAreas,
  setSelectedMainAreas,
  complexityFilter,
  setComplexityFilter,
  showFavorites,
  setShowFavorites,
  disabled,
}: WorkflowFiltersProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredAreas = useMemo(() => {
    if (!search) return mainAreas;
    return mainAreas.filter(area =>
      area.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, mainAreas]);

  const handleSelectArea = (area: string) => {
    setSelectedMainAreas(
      selectedMainAreas.includes(area)
        ? selectedMainAreas.filter(a => a !== area)
        : [...selectedMainAreas, area]
    );
  };
  
  const handleClear = () => {
    setSelectedMainAreas([]);
    setSearch('');
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {/* Main Area Filter */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={disabled}
            >
              {selectedMainAreas.length > 0
                ? `Categorías (${selectedMainAreas.length})`
                : "Todas las Categorías"}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="start">
             <Command>
                <CommandInput 
                    placeholder="Buscar categoría..." 
                    value={search}
                    onValueChange={setSearch}
                />
                <CommandList className="max-h-none">
                    <CommandEmpty>No se encontraron categorías.</CommandEmpty>
                    <CommandGroup>
                    {filteredAreas.map(area => (
                        <CommandItem
                        key={area}
                        onSelect={() => handleSelectArea(area)}
                        className="cursor-pointer"
                        >
                        <Checkbox
                            checked={selectedMainAreas.includes(area)}
                            className="mr-2"
                        />
                        {area}
                        </CommandItem>
                    ))}
                    </CommandGroup>
                </CommandList>
                <div className="p-2 border-t flex justify-end gap-2">
                   <Button variant="ghost" size="sm" onClick={handleClear} disabled={selectedMainAreas.length === 0}>
                        Limpiar
                   </Button>
                </div>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Complexity Filter */}
        <Select
          value={complexityFilter}
          onValueChange={setComplexityFilter}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por dificultad..." />
          </SelectTrigger>
          <SelectContent>
            {complexities.map(comp => (
              <SelectItem key={comp} value={comp}>
                {comp === 'all' ? 'Todas las Dificultades' : comp}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Favorites Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="favorites-only"
          checked={showFavorites}
          onCheckedChange={setShowFavorites}
          disabled={disabled}
        />
        <Label htmlFor="favorites-only" className="flex items-center gap-2 cursor-pointer">
          <Star className="h-4 w-4 text-yellow-500" />
          <span>Solo Favoritos</span>
        </Label>
      </div>
    </div>
  );
}
