import React from 'react';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  id?: string;
}

export function ScreenReaderOnly({ children, id }: ScreenReaderOnlyProps) {
  return (
    <span
      id={id}
      className="sr-only absolute -m-px h-px w-px overflow-hidden border-0 p-0 whitespace-nowrap"
      style={{
        clip: 'rect(0, 0, 0, 0)',
        clipPath: 'inset(50%)',
      }}
    >
      {children}
    </span>
  );
}
