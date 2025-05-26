import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const SplitScreenContainer = styled.div`
  display: flex;
  flex: 1;
  height: 100%;
  overflow: hidden;
  flex-grow: 1;
  position: relative;
`;

const Panel = styled.div`
  height: 100%;
  overflow-y: auto;
  border: 1px solid #e0e0e0;
  background: #f9f9f9;
  transition: width 0.3s ease;

  &:first-child {
    border-right: none;
  }

  &:last-child {
    border-left: none;
  }
`;

const ResizeHandle = styled.div`
  width: 3px;
  background: #e0e0e0;
  cursor: col-resize;
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  z-index: 2;
  transition: background 0.2s ease;

  &:hover {
    background: #4a90e2;
  }

  &:active {
    background: #357abd;
  }
`;

const SplitScreen = ({ children, screenMode }) => {
  const [leftWidth, setLeftWidth] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);
  const handleRef = useRef(null);

  const [left, right] = children;

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      let newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      newWidth = Math.max(10, Math.min(90, newWidth));
      setLeftWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Determine panel visibility and width based on screenMode
  const leftStyle = {
    width: screenMode === 'left' ? '100%' : screenMode === 'right' ? '0%' : `${leftWidth}%`,
    display: screenMode === 'right' ? 'none' : 'block',
  };

  const rightStyle = {
    width: screenMode === 'right' ? '100%' : screenMode === 'left' ? '0%' : `${100 - leftWidth}%`,
    display: screenMode === 'left' ? 'none' : 'block',
  };

  const handleVisibility = screenMode === 'both' ? 'visible' : 'hidden';

  return (
    <SplitScreenContainer ref={containerRef}>
      <Panel style={leftStyle}>{left}</Panel>
      <ResizeHandle
        ref={handleRef}
        onMouseDown={() => setIsResizing(true)}
        style={{ visibility: handleVisibility }}
      />
      <Panel style={rightStyle}>{right}</Panel>
    </SplitScreenContainer>
  );
};

export default SplitScreen;