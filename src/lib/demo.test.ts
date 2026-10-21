import { beforeEach, describe, expect, it } from '@jest/globals';
import { DEMO_USERS, useDemoStore } from './demo';
import { getDubaiDate } from './uae-time';

describe('offline demonstration data', () => {
  beforeEach(() => {
    useDemoStore.getState().resetDemo();
  });

  it('starts with fictional bookings and exposes all four demonstration roles', () => {
    const { bookings } = useDemoStore.getState();
    expect(bookings.length).toBeGreaterThan(0);
    expect(Object.keys(DEMO_USERS)).toEqual(['customer', 'technician', 'landlord', 'admin']);
    expect(DEMO_USERS.customer.email).toContain('@demo.dabbetha.ae');
  });

  it('adds a booking locally and provides a reference without a backend', () => {
    const reference = useDemoStore.getState().addBooking({
      details: 'The bathroom tap has a small leak.',
      emirate: 'Ajman',
      area: 'Al Nuaimia',
      address: 'Corniche Residence, Building A, Apartment 402',
      scheduledDate: getDubaiDate(2),
      timeWindow: 'afternoon',
    }, {
      id: '10000000-0000-4000-8000-000000000002',
      title: 'Plumbing',
      arabicTitle: 'السباكة',
      priceFrom: 79,
    });
    const created = useDemoStore.getState().bookings.find((booking) => booking.reference === reference);
    expect(reference).toMatch(/^DBT-\d{5}$/);
    expect(created).toMatchObject({ status: 'requested', serviceName: 'Plumbing', priceAed: 79 });
  });

  it('updates local technician assignment and job status', () => {
    const store = useDemoStore.getState();
    store.assignTechnician('demo-booking-1004');
    store.updateStatus('demo-booking-1004', 'technician_en_route');
    expect(useDemoStore.getState().bookings.find((booking) => booking.id === 'demo-booking-1004')).toMatchObject({
      status: 'technician_en_route',
      technicianId: DEMO_USERS.technician.id,
    });
  });
});
