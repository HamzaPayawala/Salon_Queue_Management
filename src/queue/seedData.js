// Realistic starting data so every screen can be demonstrated immediately.
// Owner Settings > Reset demo data restores exactly this state.
const minutesAgo = (now, minutes) => now - minutes * 60_000

export function createSeedState(now = Date.now()) {
  const salon = {
    name: 'Lumière Salon',
    initials: 'LS',
    isOpen: true,
    onlineJoiningOpen: true,
    openingTime: '10:00',
    closingTime: '20:00',
    // Demo-only access control. Documented as not suitable for public deployment.
    staffPins: { reception: '1234', barber: '2222', owner: '3333' },
  }

  const services = [
    { id: 's1', nameEn: 'Haircut', nameGu: 'હેરકટ', durationMin: 30, price: 350, enabled: true },
    { id: 's2', nameEn: 'Beard Trim', nameGu: 'દાઢી ટ્રિમ', durationMin: 15, price: 150, enabled: true },
    { id: 's3', nameEn: 'Hair Colour', nameGu: 'વાળનો રંગ', durationMin: 60, price: 1200, enabled: true },
    { id: 's4', nameEn: 'Head Massage', nameGu: 'માથાની માલિશ', durationMin: 20, price: 300, enabled: true },
    { id: 's5', nameEn: 'Facial', nameGu: 'ફેશિયલ', durationMin: 45, price: 800, enabled: true },
    { id: 's6', nameEn: 'Kids Haircut', nameGu: 'બાળકોનો હેરકટ', durationMin: 20, price: 250, enabled: true },
  ]

  const barbers = [
    { id: 'b1', name: 'Arjun', nameGu: 'અર્જુન', onDuty: true, onBreak: false },
    { id: 'b2', name: 'Nina', nameGu: 'નીના', onDuty: true, onBreak: false },
    { id: 'b3', name: 'Raj', nameGu: 'રાજ', onDuty: true, onBreak: true },
  ]

  const entries = [
    {
      id: 'e101', token: 'A101', name: 'Meera Patel', phone: '9876543210',
      serviceIds: ['s1'], preferredBarberId: 'b1', assignedBarberId: 'b1',
      source: 'online', status: 'in_chair', createdAt: minutesAgo(now, 24),
      calledAt: minutesAgo(now, 18), startedAt: minutesAgo(now, 12), completedAt: null,
    },
    {
      id: 'e102', token: 'A102', name: 'Rohan Shah', phone: '9876543211',
      serviceIds: ['s2'], preferredBarberId: 'b1', assignedBarberId: null,
      source: 'online', status: 'waiting', createdAt: minutesAgo(now, 10),
      calledAt: null, startedAt: null, completedAt: null,
    },
    {
      id: 'e103', token: 'A103', name: 'Disha Joshi', phone: '9876543212',
      serviceIds: ['s1', 's2'], preferredBarberId: 'any', assignedBarberId: null,
      source: 'online', status: 'waiting', createdAt: minutesAgo(now, 7),
      calledAt: null, startedAt: null, completedAt: null,
    },
    {
      id: 'e104', token: 'A104', name: 'Karan Trivedi', phone: '9876543213',
      serviceIds: ['s5'], preferredBarberId: 'b2', assignedBarberId: null,
      source: 'walk-in', status: 'waiting', createdAt: minutesAgo(now, 4),
      calledAt: null, startedAt: null, completedAt: null,
    },
    {
      id: 'e105', token: 'A105', name: 'Anjali Desai', phone: '9876543214',
      serviceIds: ['s2'], preferredBarberId: 'any', assignedBarberId: 'b2',
      source: 'online', status: 'called', createdAt: minutesAgo(now, 6),
      calledAt: minutesAgo(now, 1), startedAt: null, completedAt: null,
    },
    {
      id: 'e106', token: 'A106', name: 'Vikram Mehta', phone: '9876543215',
      serviceIds: ['s1'], preferredBarberId: 'b1', assignedBarberId: 'b1',
      source: 'online', status: 'done', createdAt: minutesAgo(now, 92),
      calledAt: minutesAgo(now, 80), startedAt: minutesAgo(now, 78), completedAt: minutesAgo(now, 48),
    },
    {
      id: 'e107', token: 'A107', name: 'Nisha Rao', phone: '9876543216',
      serviceIds: ['s2'], preferredBarberId: 'any', assignedBarberId: 'b3',
      source: 'online', status: 'no_show', createdAt: minutesAgo(now, 70),
      calledAt: minutesAgo(now, 60), startedAt: null, completedAt: minutesAgo(now, 49),
    },
  ]

  return {
    version: 1,
    salon,
    services,
    barbers,
    entries,
    lastCall: { token: 'A105', barberId: 'b2', at: minutesAgo(now, 1) },
    nextToken: 108,
    updatedAt: now,
  }
}
