export type Service = {
  id: string;
  title: string;
  arabicTitle: string;
  description: string;
  icon: string;
  priceFrom: number;
};

export const services: Service[] = [
  { id: '10000000-0000-4000-8000-000000000001', title: 'AC repair', arabicTitle: 'صيانة التكييف', description: 'Cooling, servicing & repairs', icon: '❄️', priceFrom: 99 },
  { id: '10000000-0000-4000-8000-000000000002', title: 'Plumbing', arabicTitle: 'السباكة', description: 'Leaks, taps & drain care', icon: '🚿', priceFrom: 79 },
  { id: '10000000-0000-4000-8000-000000000003', title: 'Electrical', arabicTitle: 'الكهرباء', description: 'Safe home electrical work', icon: '⚡', priceFrom: 89 },
  { id: '10000000-0000-4000-8000-000000000004', title: 'Handyman', arabicTitle: 'خدمات الصيانة', description: 'Repairs and installations', icon: '🛠️', priceFrom: 69 },
  { id: '10000000-0000-4000-8000-000000000005', title: 'Appliance repair', arabicTitle: 'إصلاح الأجهزة', description: 'Help for household appliances', icon: '🧺', priceFrom: 99 },
  { id: '10000000-0000-4000-8000-000000000006', title: 'Painting', arabicTitle: 'الدهان', description: 'Refresh rooms and walls', icon: '🖌️', priceFrom: 149 },
  { id: '10000000-0000-4000-8000-000000000007', title: 'Deep cleaning', arabicTitle: 'التنظيف العميق', description: 'A detailed home clean', icon: '✨', priceFrom: 199 },
  { id: '10000000-0000-4000-8000-000000000008', title: 'Water heater', arabicTitle: 'سخان المياه', description: 'Inspection and maintenance', icon: '♨️', priceFrom: 99 },
];

export const serviceAreas: Record<'Ajman' | 'Sharjah', string[]> = {
  Ajman: ['Al Nuaimia', 'Al Rashidiya', 'Al Jurf'],
  Sharjah: ['Al Majaz', 'Al Nahda', 'Muwaileh'],
};
