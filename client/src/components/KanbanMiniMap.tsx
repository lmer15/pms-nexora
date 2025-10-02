import React, { useState, useEffect, useRef } from 'react';
import { LucideZoomIn, LucideZoomOut, LucideMaximize2 } from 'lucide-react';

interface KanbanMiniMapProps {
  columns: Array<{
    id: string;
    title: string;
    tasks: Array<{
      id: string;
      title: string;
      status?: string;
      priority?: string;
    }>;
  }>;
  isDarkMode: boolean;
  onColumnClick?: (columnId: string) => void;
  className?: string;
}

const KanbanMiniMap: React.FC<KanbanMiniMapProps> = ({
  columns,
  isDarkMode,
  onColumnClick,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [hasOverflow, setHasOverflow] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const maxZoom = 2;
  const minZoom = 0.5;

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, maxZoom));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, minZoom));
  };

  // Check for horizontal overflow (but don't auto-collapse)
  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current && mapRef.current) {
        const contentWidth = contentRef.current.scrollWidth;
        const containerWidth = mapRef.current.clientWidth - 16; // Subtract padding
        const isOverflowing = contentWidth > containerWidth;
        
        // Just track overflow state, don't auto-collapse
        setHasOverflow(isOverflowing);
      }
    };

    // Add a small delay to allow the expansion animation to complete
    const timeoutId = setTimeout(checkOverflow, 100);
    
    // Check on window resize
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [columns, isExpanded, zoom]);

  const handleColumnClick = (columnId: string) => {
    onColumnClick?.(columnId);
    // Scroll to column
    const element = document.querySelector(`[data-column-id="${columnId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const getTaskColor = (task: any) => {
    switch (task.priority?.toLowerCase()) {
      case 'high':
        return isDarkMode ? 'bg-red-600' : 'bg-red-500';
      case 'medium':
        return isDarkMode ? 'bg-yellow-600' : 'bg-yellow-500';
      case 'low':
        return isDarkMode ? 'bg-green-600' : 'bg-green-500';
      default:
        return isDarkMode ? 'bg-gray-600' : 'bg-gray-400';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'done':
        return isDarkMode ? 'bg-green-600' : 'bg-green-500';
      case 'in-progress':
      case 'in progress':
        return isDarkMode ? 'bg-blue-600' : 'bg-blue-500';
      case 'blocked':
        return isDarkMode ? 'bg-red-600' : 'bg-red-500';
      default:
        return isDarkMode ? 'bg-gray-600' : 'bg-gray-400';
    }
  };

  if (columns.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-4 right-4 z-30 transition-all duration-300 ${
        isExpanded ? 'w-80 h-60' : 'w-48 h-32'
      } ${className}`}
    >
      {/* Mini Map Container */}
      <div
        ref={mapRef}
        className={`relative w-full h-full rounded-lg border shadow-lg overflow-hidden ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
      >
        {/* Header */}
        <div className={`absolute top-0 left-0 right-0 z-10 p-2 border-b ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Board Overview
            </h3>
            <div className="flex items-center space-x-1">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= minZoom}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Zoom out"
              >
                <LucideZoomOut className="w-3 h-3" />
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= maxZoom}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Zoom in"
              >
                <LucideZoomIn className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Map Content */}
        <div className="absolute top-8 left-0 right-0 bottom-0 overflow-x-auto overflow-y-hidden kanban-minimap">
          <div ref={contentRef} className="flex space-x-1 p-2 min-w-max">
            {columns.map((column) => (
              <div
                key={column.id}
                className="flex-shrink-0 w-16 cursor-pointer"
                onClick={() => handleColumnClick(column.id)}
              >
                {/* Column Header */}
                <div className={`p-1 rounded-t text-xs font-medium truncate ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}>
                  {column.title}
                </div>
                
                {/* Tasks */}
                <div className={`space-y-0.5 p-1 rounded-b min-h-20 ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  {column.tasks.slice(0, 8).map((task) => (
                    <div
                      key={task.id}
                      className={`h-2 rounded-sm ${getTaskColor(task)} opacity-80 hover:opacity-100 transition-opacity`}
                      title={task.title}
                    />
                  ))}
                  {column.tasks.length > 8 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      +{column.tasks.length - 8}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`absolute -top-2 -left-2 p-1 rounded-full shadow-lg transition-colors ${
          isDarkMode 
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
            : 'bg-white hover:bg-gray-50 text-gray-600'
        }`}
        title={isExpanded ? 'Minimize' : 'Expand'}
      >
        <LucideMaximize2 className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Legend */}
      {isExpanded && (
        <div className={`absolute bottom-full left-0 right-0 mb-2 p-2 rounded-lg border shadow-lg ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Legend:</div>
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-sm"></div>
              <span className="text-gray-700 dark:text-gray-300">High Priority</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-sm"></div>
              <span className="text-gray-700 dark:text-gray-300">Medium</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-sm"></div>
              <span className="text-gray-700 dark:text-gray-300">Low Priority</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-sm"></div>
              <span className="text-gray-700 dark:text-gray-300">Default</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanMiniMap;
