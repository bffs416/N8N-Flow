
'use client';

import React, { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';


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

  const handleSelectArea = (area: string) => {
    setSelectedMainAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };
  
  return (
    <div className="flex flex-col gap-4">
       {/* Filter Toggles */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Complexity Filter */}
        <div className="w-full sm:w-1/3">
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
        
        {selectedMainAreas.length > 0 && (
            <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedMainAreas([])}
                disabled={disabled}
            >
                Limpiar filtros ({selectedMainAreas.length})
            </Button>
        )}
      </div>

       {/* Main Area Filter */}
       {mainAreas.length > 0 && (
        <div className="flex flex-wrap gap-2">
            {mainAreas.map(area => (
                <Button
                    key={area}
                    variant={selectedMainAreas.includes(area) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSelectArea(area)}
                    disabled={disabled}
                    className="rounded-full"
                >
                    {area}
                </Button>
            ))}
        </div>
       )}
    </div>
  );
}
