
'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FooterProps {
    analysisProgress: {
        total: number;
        current: number;
        title: string;
    };
}

export function Footer({ analysisProgress }: FooterProps) {
    const isAnalyzing = analysisProgress.total > 0;
    const progressValue = isAnalyzing ? (analysisProgress.current / analysisProgress.total) * 100 : 0;

    return (
        <footer
            id="footer"
            className={cn(
                'fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-t transition-all duration-300',
                isAnalyzing ? 'py-3 opacity-100' : 'py-0 opacity-0 pointer-events-none'
            )}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center gap-2">
                        <Progress value={progressValue} className="h-2 w-full">
                           <div
                                className="h-full bg-orange-500 transition-all duration-150"
                                style={{ width: `${progressValue}%` }}
                            />
                        </Progress>
                        <p className="text-xs text-muted-foreground font-medium">
                            {analysisProgress.title}
                        </p>
                    </div>
                )}
            </div>
        </footer>
    );
}
