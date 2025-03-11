
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  wordByWord?: boolean;
  as?: React.ElementType;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  className,
  delay = 0,
  wordByWord = false,
  as: Component = 'div',
}) => {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    // Add animation class after a small delay
    const timer = setTimeout(() => {
      element.classList.add('animate-blur-in');
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (wordByWord) {
    const words = text.split(' ');
    
    return (
      <Component ref={textRef} className={cn('opacity-0', className)}>
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
    <Component ref={textRef} className={cn('opacity-0', className)}>
      {text}
    </Component>
  );
};

export default AnimatedText;
