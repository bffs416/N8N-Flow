
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ScrollToBottomButton() {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const scrollToBottom = () => {
    const footer = document.getElementById('footer');
    if (footer) {
        footer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isVisible && (
        <Button
          onClick={scrollToBottom}
          size="icon"
          className="rounded-full h-12 w-12 shadow-lg"
          aria-label="Ir al final de la página"
        >
          <ArrowDown className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}

    