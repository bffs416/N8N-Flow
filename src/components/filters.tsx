
'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';

interface WorkflowFiltersProps {
  mainAreas: string[];
  complexities: string[];
  mainAreaFilter: string;
  setMainAreaFilter: (value: string) => void;
  complexityFilter: string;
  setComplexityFilter: (value: string) => void;
  showFavorites: boolean;
  setShowFavorites: (value: boolean) => void;
  disabled?: boolean;
}

export function WorkflowFilters({
  mainAreas,
  complexities,
  mainAreaFilter,
  setMainAreaFilter,
  complexityFilter,
  setComplexityFilter,
  showFavorites,
  setShowFavorites,
  disabled,
}: WorkflowFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {/* Main Area Filter */}
        <Select
          value={mainAreaFilter}
          onValueChange={setMainAreaFilter}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por categoría..." />
          </SelectTrigger>
          <SelectContent>
            {mainAreas.map(area => (
              <SelectItem key={area} value={area}>
                {area === 'all' ? 'Todas las Categorías' : area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
        <Label htmlFor="favorites-only" className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <span>Solo Favoritos</span>
        </Label>
      </div>
    </div>
  );
}
