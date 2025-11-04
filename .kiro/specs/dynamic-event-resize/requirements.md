# Requirements Document

## Introduction

This feature enhances the Study Planner's DynamicScheduleView component to provide Google Calendar-like event interaction capabilities. The system will enable events to visually scale according to their actual duration, support precise drag-and-drop behavior with 15-minute snapping, and allow users to resize events using intuitive drag handles. The enhancement maintains all existing functionality including popup modals, Supabase synchronization, and the current StudyAI visual theme while delivering a fluid, professional calendar experience.

## Glossary

- **DynamicScheduleView**: The React component that renders the weekly/daily calendar grid interface for the Study Planner
- **Event Block**: A visual representation of a scheduled event displayed on the calendar grid
- **Time Slot**: A 30-minute interval in the calendar grid (48 slots per day from 00:00 to 23:30)
- **Resize Handle**: An interactive UI element (top or bottom edge of an event) that allows users to adjust event duration
- **Snapping**: The behavior where dragged or resized events automatically align to 15-minute intervals
- **Absolute Positioning**: CSS positioning strategy where events are positioned relative to the calendar container rather than within grid cells
- **Event Duration**: The time span between an event's start time and end time, measured in minutes
- **Supabase**: The backend database service used for persisting schedule events
- **StudyAI Theme**: The existing color scheme, styling, and visual design language of the application

## Requirements

### Requirement 1

**User Story:** As a student, I want events to display with heights proportional to their actual duration, so that I can quickly understand my schedule at a glance

#### Acceptance Criteria

1. WHEN an Event Block is rendered, THE DynamicScheduleView SHALL calculate the visual height based on the Event Duration using a ratio of 1.33 pixels per minute
2. WHEN an Event Block has a duration of 15 minutes, THE DynamicScheduleView SHALL render the Event Block with a height of 20 pixels
3. WHEN an Event Block has a duration of 30 minutes, THE DynamicScheduleView SHALL render the Event Block with a height of 40 pixels
4. WHEN an Event Block has a duration of 60 minutes, THE DynamicScheduleView SHALL render the Event Block with a height of 80 pixels
5. WHEN an Event Block has a duration of 120 minutes, THE DynamicScheduleView SHALL render the Event Block with a height of 160 pixels

### Requirement 2

**User Story:** As a student, I want to resize events by dragging their edges, so that I can quickly adjust my schedule without opening modal dialogs

#### Acceptance Criteria

1. WHEN a user hovers over an Event Block, THE DynamicScheduleView SHALL display Resize Handles at the top and bottom edges of the Event Block
2. WHEN a user initiates a drag on a Resize Handle, THE DynamicScheduleView SHALL track mouse movement and update the Event Block height in real-time
3. WHEN a user drags the top Resize Handle, THE DynamicScheduleView SHALL adjust the event start time while keeping the end time fixed
4. WHEN a user drags the bottom Resize Handle, THE DynamicScheduleView SHALL adjust the event end time while keeping the start time fixed
5. WHEN a user releases a Resize Handle, THE DynamicScheduleView SHALL snap the adjusted time to the nearest 15-minute interval

### Requirement 3

**User Story:** As a student, I want resized events to automatically save to the database, so that my schedule changes persist without manual confirmation

#### Acceptance Criteria

1. WHEN a user completes a resize operation, THE DynamicScheduleView SHALL invoke the updateScheduleEvent function with the modified start time or end time
2. WHEN the updateScheduleEvent function is invoked, THE DynamicScheduleView SHALL persist the changes to Supabase
3. IF a resize operation fails to save, THEN THE DynamicScheduleView SHALL revert the Event Block to its original dimensions
4. WHEN multiple resize operations occur within 500 milliseconds, THE DynamicScheduleView SHALL debounce the Supabase write operations to prevent excessive database calls

### Requirement 4

**User Story:** As a student, I want events to use absolute positioning on the calendar grid, so that they can span multiple time slots accurately

#### Acceptance Criteria

1. THE DynamicScheduleView SHALL render Event Blocks using Absolute Positioning within the calendar day column container
2. WHEN calculating Event Block position, THE DynamicScheduleView SHALL compute the top offset based on minutes from midnight multiplied by 1.33 pixels per minute
3. WHEN an event starts at 09:00 AM, THE DynamicScheduleView SHALL position the Event Block at 720 pixels from the top (540 minutes × 1.33)
4. THE DynamicScheduleView SHALL render Time Slots as empty clickable cells for creating new events
5. THE DynamicScheduleView SHALL render Event Blocks in a separate layer above the Time Slot grid with pointer events enabled

### Requirement 5

**User Story:** As a student, I want resize operations to enforce minimum and maximum duration constraints, so that I cannot create invalid schedule entries

#### Acceptance Criteria

1. WHEN a user attempts to resize an Event Block to less than 15 minutes duration, THE DynamicScheduleView SHALL prevent the resize and maintain a minimum duration of 15 minutes
2. WHEN a user attempts to resize an Event Block to more than 24 hours duration, THE DynamicScheduleView SHALL prevent the resize and maintain a maximum duration of 1440 minutes
3. WHEN a user drags the top Resize Handle past the event end time, THE DynamicScheduleView SHALL prevent the inversion and stop at the end time minus 15 minutes
4. WHEN a user drags the bottom Resize Handle before the event start time, THE DynamicScheduleView SHALL prevent the inversion and stop at the start time plus 15 minutes

### Requirement 6

**User Story:** As a student, I want visual feedback during resize operations, so that I understand what changes will be applied

#### Acceptance Criteria

1. WHILE a user is dragging a Resize Handle, THE DynamicScheduleView SHALL display a floating time label showing the new start and end times
2. WHILE a user is dragging a Resize Handle, THE DynamicScheduleView SHALL apply a visual highlight to the Event Block indicating active resize state
3. WHEN a user hovers over a Resize Handle, THE DynamicScheduleView SHALL change the cursor to a vertical resize cursor (ns-resize)
4. WHILE a user is dragging a Resize Handle, THE DynamicScheduleView SHALL apply smooth CSS transitions to the Event Block height changes

### Requirement 7

**User Story:** As a student, I want the existing drag-to-move functionality to continue working, so that I can reposition events without confusion

#### Acceptance Criteria

1. WHEN a user drags an Event Block from its center area (not the Resize Handles), THE DynamicScheduleView SHALL move the entire event to a new time slot
2. THE DynamicScheduleView SHALL maintain the existing 15-minute Snapping behavior for drag-to-move operations
3. THE DynamicScheduleView SHALL preserve the Event Duration when moving an event to a new time slot
4. WHEN a user drags an Event Block, THE DynamicScheduleView SHALL distinguish between move operations and resize operations based on the drag initiation point

### Requirement 8

**User Story:** As a student, I want the existing drag-to-create functionality to continue working, so that I can quickly add new events by selecting time ranges

#### Acceptance Criteria

1. WHEN a user clicks and drags on empty Time Slots, THE DynamicScheduleView SHALL create a visual selection spanning the dragged time range
2. WHEN a user releases the mouse after drag-to-create, THE DynamicScheduleView SHALL open the ScheduleEventModal with the selected start and end times pre-filled
3. THE DynamicScheduleView SHALL maintain the existing 15-minute Snapping behavior for drag-to-create operations
4. THE DynamicScheduleView SHALL prevent drag-to-create when the user clicks on an existing Event Block

### Requirement 9

**User Story:** As a student, I want all existing features to remain functional, so that the enhancement does not disrupt my current workflow

#### Acceptance Criteria

1. THE DynamicScheduleView SHALL preserve the existing ScheduleEventModal for creating and editing events
2. THE DynamicScheduleView SHALL preserve the existing StudySessionModal for starting study sessions
3. THE DynamicScheduleView SHALL preserve the existing Supabase synchronization logic
4. THE DynamicScheduleView SHALL preserve the existing StudyAI Theme including colors, fonts, and spacing
5. THE DynamicScheduleView SHALL preserve the existing event status indicators (scheduled, in_progress, completed, missed)
6. THE DynamicScheduleView SHALL preserve the existing event type colors (task, study, break, other)

### Requirement 10

**User Story:** As a student, I want smooth animations during resize and drag operations, so that the interface feels polished and professional

#### Acceptance Criteria

1. WHEN an Event Block height changes during resize, THE DynamicScheduleView SHALL apply CSS transitions with a duration of 150 milliseconds
2. WHEN a Resize Handle appears on hover, THE DynamicScheduleView SHALL apply an opacity transition with a duration of 200 milliseconds
3. THE DynamicScheduleView SHALL use requestAnimationFrame for smooth visual updates during drag operations
4. WHEN an Event Block is dropped after a move operation, THE DynamicScheduleView SHALL apply a subtle scale animation to indicate successful placement
