import React, { ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  return (
    <div className="group relative flex justify-center w-full h-full">
      {children}
      <div className="pointer-events-none absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
        <div className="bg-slate-900 text-white text-xs py-1.5 px-3 rounded shadow-lg whitespace-nowrap">
          {content}
          {/* Arrow */}
          <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
        </div>
      </div>
    </div>
  );
};

export default Tooltip;