# Implementation Plan

- [x] 1. Create utility functions and helper hooks


  - Create time calculation utilities (timeToMinutes, snapToQuarterHour, getMinutesFromMidnight, setTimeOnDate)
  - Create useEventPosition custom hook that calculates top position and height based on event start/end times
  - Add validation function for resize operations (minimum 15 minutes, maximum 24 hours)
  - _Requirements: 1.1, 4.2, 4.3, 5.1, 5.2_

- [x] 2. Implement ResizeHandle component


  - [x] 2.1 Create ResizeHandle.tsx component file


    - Create functional component accepting position ('top' | 'bottom') and onMouseDown handler props
    - Render resize handle div with position-specific className
    - Add resize indicator visual element (horizontal bar)
    - _Requirements: 2.1, 6.3_
  
  - [x] 2.2 Add CSS styling for resize handles


    - Style resize handles with absolute positioning at top/bottom edges
    - Set initial opacity to 0 with transition for smooth appearance
    - Add ns-resize cursor on hover
    - Style resize indicator bar with white background and shadow
    - _Requirements: 2.1, 6.3, 10.2_

- [x] 3. Implement EventBlock component


  - [x] 3.1 Create EventBlock.tsx component file


    - Extract event rendering logic from DynamicScheduleView into dedicated component
    - Accept event, style, handlers (onResizeStart, onDragStart, onDragEnd, onClick, onEdit, onDelete), and state flags (isResizing, isDragging) as props
    - Render event container with absolute positioning using provided style prop
    - Integrate ResizeHandle components at top and bottom
    - Render event content (title, time, status indicator, action buttons)
    - _Requirements: 1.1, 2.1, 4.1, 4.5_
  
  - [x] 3.2 Add CSS styling for EventBlock

    - Style event block with absolute positioning, border-radius, padding
    - Add hover effects with box-shadow
    - Add resizing state styles (enhanced shadow, no transition)
    - Add dragging state styles (opacity, scale transform)
    - Add smooth transitions for normal state changes
    - _Requirements: 6.2, 10.1, 10.4_

- [x] 4. Implement useEventResize custom hook


  - [x] 4.1 Create hook state management


    - Define ResizeState interface (isResizing, resizingEventId, resizeHandle, tempEvent)
    - Initialize state with useState
    - _Requirements: 2.2, 6.1_
  
  - [x] 4.2 Implement handleResizeStart function

    - Accept mouse event, event object, and handle position ('top' | 'bottom')
    - Stop event propagation and prevent default
    - Update resize state with active resize information
    - Store initial mouse Y position and original event times
    - Attach mousemove and mouseup event listeners to document
    - _Requirements: 2.2, 2.3, 2.4_
  
  - [x] 4.3 Implement mousemove handler for real-time resize

    - Calculate deltaY from initial mouse position
    - Convert pixel delta to minutes (using 40px = 30min ratio)
    - Snap delta to 15-minute intervals
    - Calculate new start or end time based on resize handle
    - Enforce minimum duration constraint (15 minutes)
    - Enforce maximum duration constraint (24 hours)
    - Prevent time inversion (start past end or end before start)
    - Update tempEvent in state for optimistic UI update
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 6.1_
  
  - [x] 4.4 Implement mouseup handler for resize completion

    - Remove mousemove and mouseup event listeners
    - Call updateScheduleEvent with final tempEvent data
    - Handle success and error cases (revert on error)
    - Reset resize state to initial values
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 4.5 Return hook interface

    - Return resizeState object and handleResizeStart function
    - _Requirements: 2.2_

- [x] 5. Refactor DynamicScheduleView to use absolute positioning


  - [x] 5.1 Update week view grid structure


    - Wrap time slot cells in a grid-layer div with relative positioning
    - Create separate events-layer div with absolute positioning covering the entire day column
    - Set pointer-events: none on events-layer, pointer-events: auto on individual events
    - Maintain existing grid cell rendering for click interactions
    - _Requirements: 4.1, 4.4, 4.5_
  
  - [x] 5.2 Implement event rendering with absolute positioning

    - Filter events by day (not by time slot)
    - Calculate event style using useEventPosition hook for each event
    - Render EventBlock components in events-layer with calculated styles
    - Pass all necessary handlers and state to EventBlock
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.2, 4.3_
  
  - [x] 5.3 Integrate useEventResize hook

    - Import and initialize useEventResize hook in DynamicScheduleView
    - Pass updateScheduleEvent function to hook
    - Extract resizeState and handleResizeStart from hook
    - Pass handleResizeStart to EventBlock components
    - Use resizeState to determine which event is being resized
    - Pass tempEvent to EventBlock for optimistic rendering during resize
    - _Requirements: 2.2, 3.1, 6.1_

- [x] 6. Add visual feedback for resize operations


  - [x] 6.1 Implement floating time label during resize

    - Create state for floating label visibility and content
    - Calculate new start and end times from tempEvent during resize
    - Format times using date-fns format function (12-hour AM/PM)
    - Render floating label with fixed positioning following cursor
    - Style label with blue background, white text, rounded corners, shadow
    - _Requirements: 6.1_
  
  - [x] 6.2 Add resize state visual indicators

    - Pass isResizing flag to EventBlock based on resizeState
    - Apply resizing className to EventBlock when active
    - Update CSS to show enhanced shadow and disable transitions during resize
    - _Requirements: 6.2, 10.1_

- [x] 7. Ensure backward compatibility with existing features



  - [x] 7.1 Verify drag-to-move functionality

    - Test that dragging event center (not handles) still moves the event
    - Verify 15-minute snapping works during move
    - Verify event duration is preserved during move
    - Ensure draggedEvent state management doesn't conflict with resize state
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [x] 7.2 Verify drag-to-create functionality

    - Test that clicking and dragging empty cells creates selection
    - Verify selection doesn't start when clicking on events
    - Verify modal opens with correct pre-filled times
    - Ensure isSelecting state doesn't conflict with resize state
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 7.3 Verify modal interactions

    - Test ScheduleEventModal opens and functions correctly
    - Test StudySessionModal opens and functions correctly
    - Verify edit and delete buttons work on events
    - _Requirements: 9.1, 9.2_
  
  - [x] 7.4 Verify styling and theme preservation

    - Check that all existing colors are maintained (event types, status indicators)
    - Verify StudyAI theme colors, fonts, and spacing unchanged
    - Test in both light and dark modes
    - _Requirements: 9.4, 9.5, 9.6_

- [x] 8. Add performance optimizations



  - [x] 8.1 Memoize event calculations


    - Wrap calculateEventStyle calls in useMemo with proper dependencies
    - Memoize getEventsForDate results per day
    - _Requirements: 1.1, 4.2_
  
  - [x] 8.2 Implement debouncing for database writes


    - Create debounced version of updateScheduleEvent with 500ms delay
    - Use debounced function in resize completion handler
    - _Requirements: 3.4_
  
  - [ ]* 8.3 Add requestAnimationFrame for smooth updates
    - Wrap tempEvent state updates in requestAnimationFrame
    - Ensure 60fps performance during resize operations
    - _Requirements: 10.3_

- [ ]* 9. Add error handling and edge cases
  - [ ]* 9.1 Implement error recovery for failed saves
    - Add try-catch block in resize completion handler
    - Show user-friendly error toast on save failure
    - Revert event to original state on error
    - _Requirements: 3.3_
  
  - [ ]* 9.2 Handle edge cases
    - Test and handle events crossing midnight
    - Test and handle events at start/end of day boundaries
    - Test and handle rapid resize operations
    - Test and handle overlapping events
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 10. Testing and validation
  - [ ]* 10.1 Manual testing checklist
    - Test resize from top handle (adjusts start time)
    - Test resize from bottom handle (adjusts end time)
    - Test minimum duration enforcement (15 minutes)
    - Test maximum duration enforcement (24 hours)
    - Test 15-minute snapping behavior
    - Test visual feedback (floating label, hover states)
    - Test drag-to-move still works
    - Test drag-to-create still works
    - Test modal interactions still work
    - Test in week view and day view
    - Test with various event durations (15min, 30min, 1hr, 2hr, 4hr)
    - _Requirements: All_
  
  - [ ]* 10.2 Browser compatibility testing
    - Test in Chrome/Edge
    - Test in Firefox
    - Test in Safari
    - _Requirements: All_
