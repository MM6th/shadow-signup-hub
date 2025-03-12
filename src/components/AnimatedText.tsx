
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  wordByWord?: boolean;
  as?: React.ElementType;
  permanent?: boolean;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className,
  delay = 0,
  wordByWord = false,
  as: Component = 'div',
  permanent = false,
}) => {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    // Add animation class after a small delay
    const timer = setTimeout(() => {
      element.classList.add('animate-blur-in');
      // If permanent, don't fade out
      if (permanent) {
        element.style.opacity = '1';
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, permanent]);

  if (wordByWord) {
    const words = text.split(' ');
    
    return (
      <Component 
        ref={textRef} 
        className={cn('opacity-0', className)}
        style={permanent ? { transition: 'opacity 0.8s' } : undefined}
      >
        {words.map((word, index) => (
          <span
            key={index}
            className="inline-block animate-delayed"
            style={{ '--delay': index + 1 } as React.CSSProperties}
          >
            {word}{' '}
          </span>
        ))}
      </Component>
    );
  }

  return (
    <Component 
      ref={textRef} 
      className={cn('opacity-0', className)}
      style={permanent ? { transition: 'opacity 0.8s' } : undefined}
    >
      {text}
    </Component>
  );
};

export default AnimatedText;
