export interface GalleryItem {
  title: string;
  label: string;
  caption: string;
  height: number;
}

export const galleryItems: GalleryItem[] = [
  { title: 'Lab discussion', label: 'Activity', caption: 'Placeholder for a research discussion photo.', height: 360 },
  { title: 'Research seminar', label: 'Seminar', caption: 'Placeholder for a SAIL seminar session.', height: 260 },
  { title: 'Conference presentation', label: 'Conference', caption: 'Placeholder for a conference presentation.', height: 420 },
  { title: 'Student meeting', label: 'Mentoring', caption: 'Placeholder for student mentorship and project planning.', height: 300 },
  { title: 'Reading group', label: 'Weekly', caption: 'Placeholder for a reading group photo.', height: 340 },
  { title: 'Workshop', label: 'Workshop', caption: 'Placeholder for a workshop or tutorial activity.', height: 280 },
  { title: 'Lab social activity', label: 'Community', caption: 'Placeholder for a community moment.', height: 410 },
  { title: 'Poster session', label: 'Research', caption: 'Placeholder for posters and project demos.', height: 320 },
  { title: 'Collaboration meeting', label: 'Collaboration', caption: 'Placeholder for a cross-institution research meeting.', height: 270 },
  { title: 'Campus activity', label: 'VinUniversity', caption: 'Placeholder for a campus activity image.', height: 360 },
];
