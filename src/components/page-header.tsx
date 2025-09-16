import React from 'react';
import { N8nInsightsLogo } from './icons';

export const PageHeader = () => {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <N8nInsightsLogo className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">n8n Insights</h1>
          </div>
        </div>
      </div>
    </header>
  );
};
