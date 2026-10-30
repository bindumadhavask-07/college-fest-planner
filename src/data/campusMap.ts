/** Campus map configuration supplied with the team's MapBot prototype.
 * Coordinates are percentages on an ILLUSTRATIVE diagram, not GPS coordinates.
 * Replace them with positions on an approved campus plan before real navigation use.
 */
export const CAMPUS_MAP_CONFIG = {
  collegeName: 'NITK Surathkal (sample fest)',
  mapImage: '',
  locations: [
    { venueId: 'venue_convocation_hall', x: 48, y: 34, photo: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=85', directions: 'Sample directions: from the main gate, head toward the central quadrangle. Verify this route on a real campus plan.', accessibility: ['Sample: step-free access', 'Confirm seating with organizers'] },
    { venueId: 'venue_oat_grounds', x: 76, y: 66, photo: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1000&q=85', directions: 'Sample directions: approach the amphitheatre from Lakeside Walk. Verify this route on a real campus plan.', accessibility: ['Sample: west entrance', 'Confirm facilities with organizers'] },
    { venueId: 'venue_kalam_seminar', x: 27, y: 56, photo: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1000&q=85', directions: 'Sample directions: enter the engineering block. Verify the room location before the event.', accessibility: ['Sample: ground-floor venue', 'Confirm facilities with organizers'] },
    { venueId: 'venue_turing_labs', x: 59, y: 78, photo: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1000&q=85', directions: 'Sample directions: find the CSE building. Confirm the lab floor and room with event staff.', accessibility: ['Sample: lift access', 'Confirm facilities with organizers'] },
  ]
} as const;
