export const LANGUAGES = [
  'Arabic', 'English', 'Hindi', 'Urdu', 'Tagalog', 'Russian',
  'French', 'Swahili', 'Gujarati', 'Bengali',
  'Tamil', 'Telugu', 'Punjabi', 'Sinhala', 'Nepali', 'Amharic',
];

export const NATIONALITIES = [
  'Emirati', 'Filipino', 'Indian', 'Pakistani', 'Bangladeshi',
  'Sri Lankan', 'Nepali', 'Egyptian', 'Jordanian', 'Lebanese',
  'Syrian', 'Sudanese', 'Yemeni', 'Russian', 'Kenyan',
  'Ethiopian', 'Nigerian', 'British',
];

export const NEIGHBORHOODS = [
  'Khalidiyah', 'Al Bateen', 'Al Markaziyah', 'Corniche', 'Al Mushrif',
  'Al Karamah', 'Reem Island', 'Saadiyat Island', 'Yas Island',
  'Khalifa City', 'Mussafah', 'MBZ City',
  'Al Raha', 'Al Bahia', 'Mina Zayed', 'Al Maryah Island',
];

export const NEIGHBORHOOD_COORDS: Record<string, { lat: number; lng: number }> = {
  'Khalidiyah':        { lat: 24.4750, lng: 54.3635 },
  'Al Bateen':         { lat: 24.4565, lng: 54.3480 },
  'Al Markaziyah':     { lat: 24.4880, lng: 54.3760 },
  'Corniche':          { lat: 24.4790, lng: 54.3460 },
  'Al Mushrif':        { lat: 24.4430, lng: 54.3760 },
  'Al Karamah':        { lat: 24.4605, lng: 54.3800 },
  'Reem Island':       { lat: 24.4985, lng: 54.3960 },
  'Saadiyat Island':   { lat: 24.5220, lng: 54.4520 },
  'Yas Island':        { lat: 24.4850, lng: 54.6050 },
  'Khalifa City':      { lat: 24.4310, lng: 54.5780 },
  'Mussafah':          { lat: 24.3540, lng: 54.5025 },
  'MBZ City':          { lat: 24.4005, lng: 54.5530 },
  'Al Raha':           { lat: 24.4170, lng: 54.6280 },
  'Al Bahia':          { lat: 24.5260, lng: 54.5800 },
  'Mina Zayed':        { lat: 24.5025, lng: 54.3760 },
  'Al Maryah Island':  { lat: 24.4970, lng: 54.3870 },
};
