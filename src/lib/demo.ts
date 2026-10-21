import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { UserRole } from '../providers/auth-provider';
import type { BookingValues } from '../types/booking';
import { getDubaiDate } from './uae-time';

export const DEMO_USERS: Record<UserRole, { id: string; name: string; email: string; title: string; titleAr: string }> = {
  customer: {
    id: 'demo-customer-amal',
    name: 'Amal Hassan',
    email: 'amal.customer@demo.dabbetha.ae',
    title: 'Customer',
    titleAr: 'عميلة',
  },
  technician: {
    id: 'demo-technician-ali',
    name: 'Ali Mansoor',
    email: 'ali.technician@demo.dabbetha.ae',
    title: 'Technician',
    titleAr: 'فني',
  },
  landlord: {
    id: 'demo-landlord-mariam',
    name: 'Mariam Al Nuaimi',
    email: 'mariam.landlord@demo.dabbetha.ae',
    title: 'Property manager',
    titleAr: 'مديرة عقارات',
  },
  admin: {
    id: 'demo-admin-omar',
    name: 'Omar Khalid',
    email: 'omar.admin@demo.dabbetha.ae',
    title: 'Administrator',
    titleAr: 'مدير النظام',
  },
};

export type DemoBooking = {
  id: string;
  reference: string;
  customerId: string;
  customerName: string;
  technicianId: string | null;
  technicianName: string | null;
  serviceId: string;
  serviceName: string;
  serviceNameAr: string;
  status: 'requested' | 'confirmed' | 'technician_assigned' | 'technician_en_route' | 'in_progress' | 'awaiting_approval' | 'completed' | 'cancelled';
  emirate: 'Ajman' | 'Sharjah';
  area: string;
  address: string;
  details: string;
  scheduledAt: string;
  priceAed: number;
  quotePending: boolean;
};

export type DemoProperty = {
  id: string;
  name: string;
  emirate: string;
  area: string;
  address: string;
  tenant: string;
};

const seededBookings: DemoBooking[] = [
  {
    id: 'demo-booking-1001',
    reference: 'DBT-10428',
    customerId: DEMO_USERS.customer.id,
    customerName: DEMO_USERS.customer.name,
    technicianId: DEMO_USERS.technician.id,
    technicianName: DEMO_USERS.technician.name,
    serviceId: '10000000-0000-4000-8000-000000000001',
    serviceName: 'AC repair',
    serviceNameAr: 'صيانة التكييف',
    status: 'technician_assigned',
    emirate: 'Ajman',
    area: 'Al Nuaimia',
    address: 'Al Yasmeen Tower, Apartment 1204, Sheikh Khalifa Bin Zayed Street',
    details: 'Living room AC is not cooling properly.',
    scheduledAt: `${getDubaiDate(1)}T09:00:00+04:00`,
    priceAed: 99,
    quotePending: false,
  },
  {
    id: 'demo-booking-1002',
    reference: 'DBT-10416',
    customerId: DEMO_USERS.customer.id,
    customerName: DEMO_USERS.customer.name,
    technicianId: DEMO_USERS.technician.id,
    technicianName: DEMO_USERS.technician.name,
    serviceId: '10000000-0000-4000-8000-000000000002',
    serviceName: 'Plumbing',
    serviceNameAr: 'السباكة',
    status: 'completed',
    emirate: 'Sharjah',
    area: 'Al Majaz',
    address: 'Al Majaz Waterfront, Building C, Apartment 508',
    details: 'Kitchen sink tap has a slow leak.',
    scheduledAt: `${getDubaiDate(-4)}T13:00:00+04:00`,
    priceAed: 129,
    quotePending: false,
  },
  {
    id: 'demo-booking-1003',
    reference: 'DBT-10431',
    customerId: 'demo-customer-noor',
    customerName: 'Noor Al Mazrouei',
    technicianId: DEMO_USERS.technician.id,
    technicianName: DEMO_USERS.technician.name,
    serviceId: '10000000-0000-4000-8000-000000000003',
    serviceName: 'Electrical',
    serviceNameAr: 'الكهرباء',
    status: 'technician_en_route',
    emirate: 'Sharjah',
    area: 'Muwaileh',
    address: 'Muweilah Commercial, Al Zahia Avenue, Villa 18',
    details: 'Please check the hallway light switches.',
    scheduledAt: `${getDubaiDate(0)}T13:00:00+04:00`,
    priceAed: 89,
    quotePending: false,
  },
  {
    id: 'demo-booking-1004',
    reference: 'DBT-10435',
    customerId: 'demo-customer-sara',
    customerName: 'Sara Rahman',
    technicianId: null,
    technicianName: null,
    serviceId: '10000000-0000-4000-8000-000000000004',
    serviceName: 'Handyman',
    serviceNameAr: 'خدمات الصيانة',
    status: 'requested',
    emirate: 'Ajman',
    area: 'Al Rashidiya',
    address: 'City Towers, Tower 2, Apartment 903',
    details: 'Install two curtain rails in the living room.',
    scheduledAt: `${getDubaiDate(2)}T17:00:00+04:00`,
    priceAed: 69,
    quotePending: false,
  },
  {
    id: 'demo-booking-1005',
    reference: 'DBT-10439',
    customerId: 'demo-customer-yousef',
    customerName: 'Yousef Ahmed',
    technicianId: DEMO_USERS.technician.id,
    technicianName: DEMO_USERS.technician.name,
    serviceId: '10000000-0000-4000-8000-000000000001',
    serviceName: 'AC repair',
    serviceNameAr: 'صيانة التكييف',
    status: 'awaiting_approval',
    emirate: 'Ajman',
    area: 'Al Jurf',
    address: 'Ajman One, Tower 4, Apartment 1811',
    details: 'AC inspection found a part that needs replacement.',
    scheduledAt: `${getDubaiDate(3)}T09:00:00+04:00`,
    priceAed: 245,
    quotePending: true,
  },
];

export const DEMO_PROPERTIES: DemoProperty[] = [
  {
    id: 'demo-property-1',
    name: 'Al Noor Residences · Unit 508',
    emirate: 'Sharjah',
    area: 'Al Majaz',
    address: 'Al Noor Tower, Corniche Street, Apartment 508',
    tenant: 'Noor Al Mazrouei',
  },
  {
    id: 'demo-property-2',
    name: 'Garden Villa 18',
    emirate: 'Ajman',
    area: 'Al Jurf',
    address: 'Al Jurf 2, Street 14, Villa 18',
    tenant: 'Yousef Ahmed',
  },
];

type DemoState = {
  activeRole: UserRole;
  bookings: DemoBooking[];
  selectRole: (role: UserRole) => void;
  addBooking: (values: BookingValues, service: { id: string; title: string; arabicTitle: string; priceFrom: number }) => string;
  updateStatus: (bookingId: string, status: DemoBooking['status']) => void;
  assignTechnician: (bookingId: string) => void;
  decideQuotation: (bookingId: string, approved: boolean) => void;
  resetDemo: () => void;
};

export const useDemoStore = create<DemoState>()(persist(
  (set, get) => ({
    activeRole: 'customer',
    bookings: seededBookings,
    selectRole: (activeRole) => set({ activeRole }),
    addBooking: (values, service) => {
      const reference = `DBT-${Math.floor(10000 + Math.random() * 89999)}`;
      const id = `demo-booking-${Date.now()}`;
      const user = DEMO_USERS[get().activeRole];
      const hour = values.timeWindow === 'morning' ? '09:00' : values.timeWindow === 'afternoon' ? '13:00' : '17:00';
      const scheduledAt = new Date(`${values.scheduledDate}T${hour}:00+04:00`).toISOString();
      const booking: DemoBooking = {
        id,
        reference,
        customerId: user.id,
        customerName: user.name,
        technicianId: null,
        technicianName: null,
        serviceId: service.id,
        serviceName: service.title,
        serviceNameAr: service.arabicTitle,
        status: 'requested',
        emirate: values.emirate,
        area: values.area,
        address: values.address,
        details: values.details,
        scheduledAt,
        priceAed: service.priceFrom,
        quotePending: false,
      };
      set({ bookings: [booking, ...get().bookings] });
      return reference;
    },
    updateStatus: (bookingId, status) => set((state) => ({
      bookings: state.bookings.map((booking) => booking.id === bookingId ? { ...booking, status } : booking),
    })),
    assignTechnician: (bookingId) => set((state) => ({
      bookings: state.bookings.map((booking) => booking.id === bookingId ? {
        ...booking,
        technicianId: DEMO_USERS.technician.id,
        technicianName: DEMO_USERS.technician.name,
        status: 'technician_assigned',
      } : booking),
    })),
    decideQuotation: (bookingId, approved) => set((state) => ({
      bookings: state.bookings.map((booking) => booking.id === bookingId ? {
        ...booking,
        quotePending: false,
        status: approved ? 'technician_assigned' : 'cancelled',
      } : booking),
    })),
    resetDemo: () => set({ activeRole: 'customer', bookings: seededBookings }),
  }),
  {
    name: 'dabbetha-demo-v1',
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (state) => ({ activeRole: state.activeRole, bookings: state.bookings }) as DemoState,
  },
));
