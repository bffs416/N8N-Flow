
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
import { Star, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [searchCategory, setSearchCategory] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredAreas = useMemo(() => {
    return mainAreas.filter(area =>
      area.toLowerCase().includes(searchCategory.toLowerCase())
    );
  }, [mainAreas, searchCategory]);

  const handleSelectArea = (area: string) => {
    setSelectedMainAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {/* Category Filter */}
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full sm:w-auto justify-start"
            disabled={disabled || mainAreas.length === 0}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Categorías
            {selectedMainAreas.length > 0 && (
              <span className="ml-2 rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                {selectedMainAreas.length}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[650px]">
           <DialogHeader>
             <DialogTitle>Filtrar por Categoría</DialogTitle>
           </DialogHeader>
            <div className="p-2 -mt-4">
                <Input
                placeholder="Buscar categoría..."
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="h-9"
                />
            </div>
          <ScrollArea className="h-[350px] border rounded-md">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1 p-4">
              {filteredAreas.map(area => (
                <Label
                  key={area}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                >
                  <Checkbox
                    checked={selectedMainAreas.includes(area)}
                    onCheckedChange={() => handleSelectArea(area)}
                    id={`checkbox-${area}`}
                  />
                  <span className="text-sm font-normal">{area}</span>
                </Label>
              ))}
            </div>
          </ScrollArea>
           <DialogFooter className='sm:justify-between'>
                {selectedMainAreas.length > 0 && (
                    <Button 
                        variant="ghost" 
                        onClick={() => setSelectedMainAreas([])}
                        disabled={disabled}
                    >
                        Limpiar filtros ({selectedMainAreas.length})
                    </Button>
                )}
                <Button onClick={() => setIsDialogOpen(false)}>Cerrar</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Complexity Filter */}
      <div className="w-full sm:w-auto sm:min-w-[200px]">
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
