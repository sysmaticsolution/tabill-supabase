
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export type TourStep = {
  target?: () => HTMLElement | null;
  title: string;
  content: string;
  placement?:
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-start'
    | 'top-end'
    | 'bottom-start'
    | 'bottom-end'
    | 'left-start'
    | 'left-end'
    | 'right-start'
    | 'right-end'
    | 'center';
  onNext?: () => void;
};

type GuidedTourProps = {
  steps: TourStep[];
  isActive: boolean;
  onClose: () => void;
};

export function GuidedTour({ steps, isActive, onClose }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const isLastStep = currentStep === steps.length - 1;

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      return;
    }

    const step = steps[currentStep];
    const element = step.target ? step.target() : null;
    
    setTargetElement(element);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, isActive, steps]);

  const handleNext = () => {
    const step = steps[currentStep];
    if (step.onNext) {
      step.onNext();
    }

    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  if (!isActive || currentStep >= steps.length) {
    return null;
  }

  const step = steps[currentStep];
  const isCentered = step.placement === 'center' || !targetElement;
  
  const getSide = () => {
    if (step.placement?.startsWith('top')) return 'top';
    if (step.placement?.startsWith('bottom')) return 'bottom';
    if (step.placement?.startsWith('left')) return 'left';
    if (step.placement?.startsWith('right')) return 'right';
    return 'bottom';
  }

  const getAlign = () => {
    if (step.placement?.endsWith('start')) return 'start';
    if (step.placement?.endsWith('end')) return 'end';
    return 'center';
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0" />
      <div
        className={cn(
          'fixed inset-0 z-[51]',
          isCentered && 'flex items-center justify-center'
        )}
      >
        <Popover open={true}>
          <PopoverAnchor asChild>
            {targetElement ? (
              <div
                className="absolute"
                style={{
                  top: targetElement.offsetTop,
                  left: targetElement.offsetLeft,
                  width: targetElement.offsetWidth,
                  height: targetElement.offsetHeight,
                }}
              >
                <div className="absolute -inset-2 border-2 border-primary border-dashed rounded-lg animate-pulse bg-primary/20" />
              </div>
            ) : <div />}
          </PopoverAnchor>

          <PopoverContent
            side={getSide()}
            align={getAlign()}
            sideOffset={15}
            className={cn(
                "z-[52] w-80 shadow-2xl",
                isCentered && "relative"
            )}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="grid gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold leading-none font-headline text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.content}</p>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Step {currentStep + 1} of {steps.length}
                </span>
                <Button onClick={handleNext}>
                  {isLastStep ? 'Finish' : 'Next'}
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2 h-6 w-6"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
