/**
 * Prisma seed: clears DB and seeds dummy hospital data.
 * Run: npm run seed (or npx prisma db seed)
 * For full reset: npx prisma migrate reset
 */

const { PrismaClient, Role, Priority, TicketStatus } = require('../generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
const DEFAULT_PASSWORD = 'Test@12345';

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function hoursAgo(hours) {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
}

async function clearDatabase() {
  await prisma.ticketAttachment.deleteMany({});
  await prisma.ticketComment.deleteMany({});
  await prisma.ticketActivityLog.deleteMany({});
  await prisma.ticket.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.subcategory.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.sLAConfig.deleteMany({});
}

async function seedSlaConfigs() {
  await prisma.sLAConfig.createMany({
    data: [
      { priority: Priority.CRITICAL, firstResponseMinutes: 15, resolutionMinutes: 120, escalationMinutes: 90 },
      { priority: Priority.HIGH, firstResponseMinutes: 30, resolutionMinutes: 480, escalationMinutes: 360 },
      { priority: Priority.MEDIUM, firstResponseMinutes: 60, resolutionMinutes: 1440, escalationMinutes: 720 },
      { priority: Priority.LOW, firstResponseMinutes: 120, resolutionMinutes: 2880, escalationMinutes: 1440 },
    ],
  });
}

async function seedDepartments() {
  await prisma.department.createMany({
    data: [
      { name: 'Cardiology', code: 'CARD', description: 'Cardiology & Cardiac Care' },
      { name: 'Emergency', code: 'ER', description: 'Emergency Department' },
      { name: 'ICU', code: 'ICU', description: 'Intensive Care Unit' },
      { name: 'Radiology', code: 'RAD', description: 'Imaging & Radiology' },
      { name: 'Pharmacy', code: 'PHRM', description: 'Pharmacy Services' },
      { name: 'IT', code: 'IT', description: 'Information Technology' },
      { name: 'Facilities', code: 'FAC', description: 'Facilities & Maintenance' },
      { name: 'Security', code: 'SEC', description: 'Security & Safety' },
    ],
  });
}

async function seedCategoriesAndSubcategories() {
  const categories = [
    { name: 'IT Support', code: 'IT', subcategories: [
      { name: 'Network', code: 'NET' },
      { name: 'Hardware', code: 'HW' },
      { name: 'Software', code: 'SW' },
      { name: 'Email & Communication', code: 'EMAIL' },
      { name: 'Access & Security', code: 'ACCESS' },
    ]},
    { name: 'Biomedical Equipment', code: 'BIO', subcategories: [
      { name: 'Ventilators', code: 'VENT' },
      { name: 'Monitors', code: 'MON' },
      { name: 'Infusion Pumps', code: 'PUMP' },
      { name: 'Diagnostics (ECG/X-Ray)', code: 'DIAG' },
      { name: 'Defibrillators', code: 'DEFIB' },
    ]},
    { name: 'Facilities & Maintenance', code: 'FAC', subcategories: [
      { name: 'Plumbing', code: 'PLUMB' },
      { name: 'Electrical', code: 'ELEC' },
      { name: 'HVAC', code: 'HVAC' },
      { name: 'Carpentry', code: 'CARP' },
      { name: 'Housekeeping', code: 'HK' },
    ]},
    { name: 'Pharmacy', code: 'PHRM', subcategories: [
      { name: 'Stock Shortage', code: 'STOCK' },
      { name: 'Storage & Temperature', code: 'STORAGE' },
      { name: 'Dispensing', code: 'DISP' },
    ]},
    { name: 'Security', code: 'SEC', subcategories: [
      { name: 'CCTV & Surveillance', code: 'CCTV' },
      { name: 'Access Control', code: 'ACCESS' },
      { name: 'Fire & Alarm', code: 'FIRE' },
    ]},
  ];

  for (const cat of categories) {
    const { subcategories, ...catData } = cat;
    const created = await prisma.category.create({ data: catData });
    await prisma.subcategory.createMany({
      data: subcategories.map((s) => ({ ...s, categoryId: created.id })),
    });
  }
}

async function seedLocations() {
  await prisma.location.createMany({
    data: [
      { block: 'A', floor: '1', ward: 'General', room: '101', unit: null },
      { block: 'A', floor: '2', ward: 'Cardiology', room: '201', unit: 'CCU' },
      { block: 'B', floor: '1', ward: 'Emergency', room: null, unit: 'ER' },
      { block: 'B', floor: '2', ward: 'ICU', room: '201', unit: 'ICU-1' },
      { block: 'B', floor: '2', ward: 'ICU', room: '202', unit: 'ICU-2' },
      { block: 'C', floor: '1', ward: 'Radiology', room: 'X-Ray-1', unit: null },
      { block: 'C', floor: '1', ward: 'Pharmacy', room: null, unit: 'Main' },
      { block: 'D', floor: '0', ward: 'IT Server Room', room: 'SR-1', unit: null },
      { block: 'A', floor: '1', ward: 'OPD', room: '102', unit: null },
      { block: 'B', floor: '1', ward: 'Emergency', room: null, unit: 'Triage' },
    ],
  });
}

async function seedUsers(departments, adminPassword) {
  const hashedAdmin = await bcrypt.hash(adminPassword, SALT_ROUNDS);
  const hashedDefault = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

  const dept = (code) => departments.find((d) => d.code === code)?.id ?? null;

  const users = [
    { fullName: 'System Administrator', empId: '432156', email: (process.env.SEED_ADMIN_EMAIL || 'admin@tmshospital.com').trim().toLowerCase(), phone: '9999999999', password: hashedAdmin, role: Role.ADMIN, departmentId: null },
    { fullName: 'Jane Helpdesk', empId: '432157', email: 'helpdesk1@tmshospital.com', phone: '1111111001', password: hashedDefault, role: Role.HELPDESK, departmentId: dept('IT') },
    { fullName: 'John Helpdesk', empId: '432158', email: 'helpdesk2@tmshospital.com', phone: '1111111002', password: hashedDefault, role: Role.HELPDESK, departmentId: dept('IT') },
    { fullName: 'Dr. Sarah HOD', empId: '432159', email: 'hod.card@tmshospital.com', phone: '1111112001', password: hashedDefault, role: Role.HOD, departmentId: dept('CARD') },
    { fullName: 'Dr. Mike HOD', empId: '432160', email: 'hod.icu@tmshospital.com', phone: '1111112002', password: hashedDefault, role: Role.HOD, departmentId: dept('ICU') },
    { fullName: 'Alex Technician', empId: '432161', email: 'tech.it1@tmshospital.com', phone: '1111113001', password: hashedDefault, role: Role.TECHNICIAN, departmentId: dept('IT') },
    { fullName: 'Sam Technician', empId: '432162', email: 'tech.it2@tmshospital.com', phone: '1111113002', password: hashedDefault, role: Role.TECHNICIAN, departmentId: dept('IT') },
    { fullName: 'Pat Biomedical', empId: '432163', email: 'tech.bio@tmshospital.com', phone: '1111113003', password: hashedDefault, role: Role.TECHNICIAN, departmentId: dept('ICU') },
    { fullName: 'Chris Facilities', empId: '432164', email: 'tech.fac@tmshospital.com', phone: '1111113004', password: hashedDefault, role: Role.TECHNICIAN, departmentId: dept('FAC') },
    { fullName: 'Nurse Emma', empId: '432165', email: 'nurse.emma@tmshospital.com', phone: '1111114001', password: hashedDefault, role: Role.REQUESTER, departmentId: dept('ICU') },
    { fullName: 'Nurse Liam', empId: '432166', email: 'nurse.liam@tmshospital.com', phone: '1111114002', password: hashedDefault, role: Role.REQUESTER, departmentId: dept('ER') },
    { fullName: 'Dr. Olivia', empId: '432167', email: 'dr.olivia@tmshospital.com', phone: '1111114003', password: hashedDefault, role: Role.REQUESTER, departmentId: dept('CARD') },
    { fullName: 'Receptionist Noah', empId: '432168', email: 'recep.noah@tmshospital.com', phone: '1111114004', password: hashedDefault, role: Role.REQUESTER, departmentId: dept('ER') },
    { fullName: 'Pharmacist Ava', empId: '432169', email: 'pharm.ava@tmshospital.com', phone: '1111114005', password: hashedDefault, role: Role.REQUESTER, departmentId: dept('PHRM') },
    { fullName: 'Radiologist James', empId: '432170', email: 'rad.james@tmshospital.com', phone: '1111114006', password: hashedDefault, role: Role.REQUESTER, departmentId: dept('RAD') },
  ];

  for (const u of users) {
    await prisma.user.create({ data: u });
  }
}

async function seedTickets(departments, categories, subcategories, locations, users) {
  const year = new Date().getFullYear();
  const byCode = (arr, code) => arr.find((x) => x.code === code);
  const userByEmail = (email) => users.find((u) => u.email === email);
  const deptId = (code) => byCode(departments, code)?.id;
  const catId = (code) => byCode(categories, code)?.id;
  const subId = (catCode, subCode) => {
    const cat = byCode(categories, catCode);
    if (!cat) return null;
    return subcategories.find((s) => s.categoryId === cat.id && s.code === subCode)?.id;
  };
  const locId = (block, ward) => locations.find((l) => l.block === block && l.ward === ward)?.id ?? locations[0].id;
  const requesterId = (email) => userByEmail(email)?.id;
  const assigneeId = (email) => userByEmail(email)?.id ?? null;

  const tickets = [
    { title: 'ICU network down - cannot access patient records', description: 'Whole ICU block lost connectivity. Urgent.', departmentCode: 'ICU', categoryCode: 'IT', subCode: 'NET', locationBlock: 'B', locationWard: 'ICU', priority: Priority.CRITICAL, status: TicketStatus.IN_PROGRESS, requesterEmail: 'nurse.emma@tmshospital.com', assigneeEmail: 'tech.it1@tmshospital.com', ticketNumber: `TKT-IT-${year}-000001` },
    { title: 'Printer not working in Cardiology Ward', description: 'HP LaserJet in room 201 not printing.', departmentCode: 'CARD', categoryCode: 'IT', subCode: 'HW', locationBlock: 'A', locationWard: 'Cardiology', priority: Priority.LOW, status: TicketStatus.CLOSED, requesterEmail: 'dr.olivia@tmshospital.com', assigneeEmail: 'tech.it2@tmshospital.com', ticketNumber: `TKT-IT-${year}-000002` },
    { title: 'Outlook sync failing on shared workstations', description: 'Email not syncing on 3 workstations in OPD.', departmentCode: 'IT', categoryCode: 'IT', subCode: 'EMAIL', locationBlock: 'A', locationWard: 'OPD', priority: Priority.MEDIUM, status: TicketStatus.ASSIGNED, requesterEmail: 'recep.noah@tmshospital.com', assigneeEmail: 'tech.it1@tmshospital.com', ticketNumber: `TKT-IT-${year}-000003` },
    { title: 'Ventilator alarm - Bed 3 ICU-2', description: 'Continuous alarm, patient on mechanical ventilation.', departmentCode: 'ICU', categoryCode: 'BIO', subCode: 'VENT', locationBlock: 'B', locationWard: 'ICU', priority: Priority.CRITICAL, status: TicketStatus.IN_PROGRESS, requesterEmail: 'nurse.emma@tmshospital.com', assigneeEmail: 'tech.bio@tmshospital.com', ticketNumber: `TKT-BIO-${year}-000001` },
    { title: 'Patient monitor SpO2 display faulty', description: 'Philips IntelliVue - SpO2 reading blank.', departmentCode: 'ICU', categoryCode: 'BIO', subCode: 'MON', locationBlock: 'B', locationWard: 'ICU', priority: Priority.HIGH, status: TicketStatus.RESOLVED, requesterEmail: 'nurse.emma@tmshospital.com', assigneeEmail: 'tech.bio@tmshospital.com', ticketNumber: `TKT-BIO-${year}-000002` },
    { title: 'ECG machine calibration overdue', description: 'GE MAC 5500 in Cardiology - due for annual calibration.', departmentCode: 'CARD', categoryCode: 'BIO', subCode: 'DIAG', locationBlock: 'A', locationWard: 'Cardiology', priority: Priority.MEDIUM, status: TicketStatus.OPEN, requesterEmail: 'dr.olivia@tmshospital.com', assigneeEmail: null, ticketNumber: `TKT-BIO-${year}-000003` },
    { title: 'Water leakage in ICU corridor', description: 'Ceiling leak near ICU-1, risk of slip.', departmentCode: 'FAC', categoryCode: 'FAC', subCode: 'PLUMB', locationBlock: 'B', locationWard: 'ICU', priority: Priority.HIGH, status: TicketStatus.IN_PROGRESS, requesterEmail: 'nurse.emma@tmshospital.com', assigneeEmail: 'tech.fac@tmshospital.com', ticketNumber: `TKT-FAC-${year}-000001` },
    { title: 'AC not cooling in Server Room', description: 'Server room temperature rising; risk to equipment.', departmentCode: 'IT', categoryCode: 'FAC', subCode: 'HVAC', locationBlock: 'D', locationWard: 'IT Server Room', priority: Priority.CRITICAL, status: TicketStatus.RESOLVED, requesterEmail: 'tech.it1@tmshospital.com', assigneeEmail: 'tech.fac@tmshospital.com', ticketNumber: `TKT-FAC-${year}-000002` },
    { title: 'Insulin shortage - Emergency stock', description: 'Short expiry batch; need emergency procurement.', departmentCode: 'PHRM', categoryCode: 'PHRM', subCode: 'STOCK', locationBlock: 'C', locationWard: 'Pharmacy', priority: Priority.CRITICAL, status: TicketStatus.ASSIGNED, requesterEmail: 'pharm.ava@tmshospital.com', assigneeEmail: null, ticketNumber: `TKT-PHRM-${year}-000001` },
    { title: 'CCTV camera 12 offline - Emergency', description: 'Camera near ER entrance not recording.', departmentCode: 'SEC', categoryCode: 'SEC', subCode: 'CCTV', locationBlock: 'B', locationWard: 'Emergency', priority: Priority.HIGH, status: TicketStatus.OPEN, requesterEmail: 'recep.noah@tmshospital.com', assigneeEmail: null, ticketNumber: `TKT-SEC-${year}-000001` },
    { title: 'HIMS login slow on radiology workstations', description: 'PACS and HIMS very slow in Radiology.', departmentCode: 'RAD', categoryCode: 'IT', subCode: 'SW', locationBlock: 'C', locationWard: 'Radiology', priority: Priority.MEDIUM, status: TicketStatus.NEW, requesterEmail: 'rad.james@tmshospital.com', assigneeEmail: null, ticketNumber: `TKT-IT-${year}-000004` },
    { title: 'New doctor account and VPN access', description: 'Dr. Smith joining Cardiology - needs account and VPN.', departmentCode: 'CARD', categoryCode: 'IT', subCode: 'ACCESS', locationBlock: 'A', locationWard: 'Cardiology', priority: Priority.LOW, status: TicketStatus.OPEN, requesterEmail: 'dr.olivia@tmshospital.com', assigneeEmail: null, ticketNumber: `TKT-IT-${year}-000005` },
    { title: 'Infusion pump battery not holding', description: 'Alaris pump in ER - battery drains in 2 hours.', departmentCode: 'ER', categoryCode: 'BIO', subCode: 'PUMP', locationBlock: 'B', locationWard: 'Emergency', priority: Priority.MEDIUM, status: TicketStatus.ASSIGNED, requesterEmail: 'nurse.liam@tmshospital.com', assigneeEmail: 'tech.bio@tmshospital.com', ticketNumber: `TKT-BIO-${year}-000004` },
    { title: 'Fire alarm false trigger - Radiology', description: 'Alarm triggered; fire team confirmed no fire.', departmentCode: 'SEC', categoryCode: 'SEC', subCode: 'FIRE', locationBlock: 'C', locationWard: 'Radiology', priority: Priority.MEDIUM, status: TicketStatus.CLOSED, requesterEmail: 'rad.james@tmshospital.com', assigneeEmail: null, ticketNumber: `TKT-SEC-${year}-000002` },
    { title: 'Cold room temperature sensor faulty', description: 'Pharmacy cold storage - sensor shows wrong readings.', departmentCode: 'PHRM', categoryCode: 'PHRM', subCode: 'STORAGE', locationBlock: 'C', locationWard: 'Pharmacy', priority: Priority.HIGH, status: TicketStatus.IN_PROGRESS, requesterEmail: 'pharm.ava@tmshospital.com', assigneeEmail: null, ticketNumber: `TKT-PHRM-${year}-000002` },
  ];

  const now = new Date();
  for (const t of tickets) {
    const dueAt = new Date(now);
    dueAt.setDate(dueAt.getDate() + (t.priority === Priority.CRITICAL ? 1 : t.priority === Priority.HIGH ? 3 : 7));
    const firstRespondedAt = [TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.IN_PROGRESS, TicketStatus.ASSIGNED].includes(t.status) ? hoursAgo(24) : null;
    const resolvedAt = [TicketStatus.RESOLVED, TicketStatus.CLOSED].includes(t.status) ? hoursAgo(12) : null;
    const closedAt = t.status === TicketStatus.CLOSED ? hoursAgo(6) : null;

    await prisma.ticket.create({
      data: {
        ticketNumber: t.ticketNumber,
        title: t.title,
        description: t.description,
        departmentId: deptId(t.departmentCode),
        categoryId: catId(t.categoryCode),
        subcategoryId: subId(t.categoryCode, t.subCode),
        locationId: locId(t.locationBlock, t.locationWard),
        priority: t.priority,
        status: t.status,
        requesterId: requesterId(t.requesterEmail),
        requesterContact: userByEmail(t.requesterEmail)?.phone ?? 'N/A',
        assignedToId: assigneeId(t.assigneeEmail),
        dueAt,
        firstRespondedAt,
        resolvedAt,
        closedAt,
        isOverdue: false,
      },
    });
  }
}

async function seedCommentsAndActivity(users, tickets) {
  const userByEmail = (email) => users.find((u) => u.email === email);
  const ticketByNumber = (num) => tickets.find((t) => t.ticketNumber === num);

  const comments = [
    { ticketNumber: `TKT-IT-${new Date().getFullYear()}-000001`, userEmail: 'tech.it1@tmshospital.com', comment: 'Checking switch and cabling. Will update in 30 min.', isInternal: true },
    { ticketNumber: `TKT-IT-${new Date().getFullYear()}-000002`, userEmail: 'tech.it2@tmshospital.com', comment: 'Paper jam cleared and driver updated. Please try again.', isInternal: false },
    { ticketNumber: `TKT-BIO-${new Date().getFullYear()}-000001`, userEmail: 'tech.bio@tmshospital.com', comment: 'On site. Checking circuit and tubing.', isInternal: true },
    { ticketNumber: `TKT-FAC-${new Date().getFullYear()}-000002`, userEmail: 'tech.fac@tmshospital.com', comment: 'AC unit serviced. Temperature normal now.', isInternal: false },
  ];

  for (const c of comments) {
    const ticket = ticketByNumber(c.ticketNumber);
    const user = userByEmail(c.userEmail);
    if (ticket && user) {
      await prisma.ticketComment.create({
        data: { ticketId: ticket.id, userId: user.id, comment: c.comment, isInternal: c.isInternal },
      });
    }
  }

  for (const ticket of tickets) {
    const requester = users.find((u) => u.id === ticket.requesterId);
    if (requester) {
      await prisma.ticketActivityLog.create({
        data: {
          ticketId: ticket.id,
          userId: requester.id,
          action: 'CREATED',
          newValue: ticket.status,
          remarks: 'Ticket created',
        },
      });
    }
  }
}

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

  console.log('Clearing database...');
  await clearDatabase();

  console.log('Seeding SLA configs...');
  await seedSlaConfigs();

  console.log('Seeding departments...');
  await seedDepartments();
  const departments = await prisma.department.findMany({ orderBy: { id: 'asc' } });

  console.log('Seeding categories and subcategories...');
  await seedCategoriesAndSubcategories();
  const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
  const subcategories = await prisma.subcategory.findMany({ orderBy: { id: 'asc' } });

  console.log('Seeding locations...');
  await seedLocations();
  const locations = await prisma.location.findMany({ orderBy: { id: 'asc' } });

  console.log('Seeding users...');
  await seedUsers(departments, adminPassword);
  const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });

  console.log('Seeding tickets...');
  await seedTickets(departments, categories, subcategories, locations, users);
  const tickets = await prisma.ticket.findMany({ orderBy: { id: 'asc' } });

  console.log('Seeding comments and activity logs...');
  await seedCommentsAndActivity(users, tickets);

  console.log('Seed completed successfully.');
  console.log('Admin login - Emp ID: 432156, Password: (see SEED_ADMIN_PASSWORD or default Admin@12345)');
  console.log('All other users: Emp ID 432157-432170, Password: ' + DEFAULT_PASSWORD);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
