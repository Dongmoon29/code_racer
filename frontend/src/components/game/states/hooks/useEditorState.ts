import { useState, useCallback } from 'react';

export const useEditorState = () => {
  const [maximizedEditor, setMaximizedEditor] = useState<
    'my' | 'opponent' | null
  >(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
  const [isFullscreenMy, setIsFullscreenMy] = useState(false);
  const [sizesNormal, setSizesNormal] = useState<number[]>([50, 50]);
  const [isResizing, setIsResizing] = useState(false);

  const handleMaximizeToggle = useCallback((editor: 'my' | 'opponent') => {
    setMaximizedEditor((current) => (current === editor ? null : editor));
  }, []);

  const handleToggleDescription = useCallback(() => {
    setIsDescriptionExpanded((prev) => !prev);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreenMy((prev) => !prev);
  }, []);

  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreenMy(false);
  }, []);

  return {
    maximizedEditor,
    isDescriptionExpanded,
    isFullscreenMy,
    sizesNormal,
    isResizing,
    setMaximizedEditor,
    setSizesNormal,
    setIsResizing,
    handleMaximizeToggle,
    handleToggleDescription,
    handleToggleFullscreen,
    handleCloseFullscreen,
  };
};
