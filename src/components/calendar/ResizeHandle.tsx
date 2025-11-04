import React from 'react';

interface ResizeHandleProps {
  position: 'top' | 'bottom';
  onMouseDown: (e: React.MouseEvent) => void;
}

export const ResizeHandle: React.FC<ResizeHandleProps> = ({ position, onMouseDown }) => {
  return (
    <div
      className={`resize-handle resize-handle-${position}`}
      onMouseDown={onMouseDown}
      role="button"
      aria-label={`Resize event ${position} edge`}
      tabIndex={0}
    >
      <div className="resize-indicator" />
    </div>
  );
};
