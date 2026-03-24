/**
 * MongoDB seed script — clears all collections and seeds realistic hospital data.
 * Run: npm run seed
 */

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Role, Priority, TicketStatus } = require('./models/enums');
const Department = require('./models/Department.model');
const Category = require('./models/Category.model');
const Subcategory = require('./models/Subcategory.model');
const Location = require('./models/Location.model');
const SLAConfig = require('./models/SLAConfig.model');
const User = require('./models/User.model');
const Ticket = require('./models/Ticket.model');
const TicketComment = require('./models/TicketComment.model');
const TicketAttachment = require('./models/TicketAttachment.model');
const TicketActivityLog = require('./models/TicketActivityLog.model');

const MONGO_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/tms_hospital';
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

// ---------------------------------------------------------------------------
// Seed data definitions
// ---------------------------------------------------------------------------

const SLA_CONFIGS = [
  { priority: Priority.LOW, firstResponseMinutes: 240, resolutionMinutes: 2880, escalationMinutes: 2160 },
  { priority: Priority.MEDIUM, firstResponseMinutes: 120, resolutionMinutes: 1440, escalationMinutes: 1080 },
  { priority: Priority.HIGH, firstResponseMinutes: 60, resolutionMinutes: 480, escalationMinutes: 360 },
  { priority: Priority.CRITICAL, firstResponseMinutes: 15, resolutionMinutes: 120, escalationMinutes: 90 },
];

const DEPARTMENTS = [
  { name: 'Information Technology', code: 'IT', description: 'IT infrastructure and support' },
  { name: 'Biomedical Engineering', code: 'BIOENG', description: 'Medical device maintenance and calibration' },
  { name: 'Cardiology', code: 'CARDIO', description: 'Heart and cardiovascular care' },
  { name: 'Radiology', code: 'RADIO', description: 'Imaging and diagnostics' },
  { name: 'Emergency', code: 'ER', description: 'Emergency and trauma care' },
  { name: 'Intensive Care', code: 'ICU', description: 'Critical care units' },
  { name: 'Administration', code: 'ADMIN', description: 'Hospital administration' },
  { name: 'Pharmacy', code: 'PHARMA', description: 'Pharmacy and dispensing' },
  { name: 'Laboratory', code: 'LAB', description: 'Pathology and diagnostics lab' },
  { name: 'Nursing', code: 'NURS', description: 'Nursing and ward management' },
  { name: 'Pediatrics', code: 'PEDIA', description: 'Child and adolescent care' },
  { name: 'Orthopedics', code: 'ORTHO', description: 'Bone, joint, and musculoskeletal care' },
  { name: 'Neurology', code: 'NEURO', description: 'Brain and nervous system care' },
  { name: 'Oncology', code: 'ONCO', description: 'Cancer care and chemotherapy' },
  { name: 'General Surgery', code: 'SURG', description: 'Surgical services and operating theatres' },
  { name: 'Anesthesia', code: 'ANES', description: 'Anesthesia and perioperative care' },
  { name: 'Obstetrics & Gynecology', code: 'OBGYN', description: "Maternity and women's health" },
  { name: 'Psychiatry', code: 'PSYCH', description: 'Mental health services' },
  { name: 'ENT', code: 'ENT', description: 'Ear, nose, and throat' },
  { name: 'Ophthalmology', code: 'OPHTH', description: 'Eye care' },
  { name: 'Dermatology', code: 'DERM', description: 'Skin and dermatologic care' },
  { name: 'Physiotherapy', code: 'PHYST', description: 'Rehabilitation and physical therapy' },
  { name: 'Nutrition & Dietetics', code: 'DIET', description: 'Clinical nutrition' },
  { name: 'Medical Records', code: 'MEDREC', description: 'Health information management' },
  { name: 'Human Resources', code: 'HR', description: 'Staffing and HR operations' },
  { name: 'Finance & Billing', code: 'FIN', description: 'Billing, insurance, and finance' },
  { name: 'Security', code: 'SEC', description: 'Hospital security and access control' },
  { name: 'Housekeeping', code: 'HKEEP', description: 'Environmental and cleaning services' },
];

const CATEGORIES_WITH_SUBS = [
  {
    name: 'Hardware',
    code: 'HW',
    description: 'Physical hardware issues',
    subcategories: [
      { name: 'Desktop / Workstation', code: 'HW-DESK' },
      { name: 'Laptop', code: 'HW-LAPT' },
      { name: 'Printer / Scanner', code: 'HW-PRNT' },
      { name: 'Medical Device', code: 'HW-MDEV' },
      { name: 'Network Equipment', code: 'HW-NET' },
    ],
  },
  {
    name: 'Software',
    code: 'SW',
    description: 'Application and OS issues',
    subcategories: [
      { name: 'HIS / EMR', code: 'SW-HIS' },
      { name: 'Operating System', code: 'SW-OS' },
      { name: 'Email / Communication', code: 'SW-MAIL' },
      { name: 'Antivirus / Security', code: 'SW-SEC' },
    ],
  },
  {
    name: 'Network',
    code: 'NET',
    description: 'Connectivity and network issues',
    subcategories: [
      { name: 'Internet / WAN', code: 'NET-WAN' },
      { name: 'LAN / Switch', code: 'NET-LAN' },
      { name: 'Wi-Fi', code: 'NET-WIFI' },
      { name: 'VPN', code: 'NET-VPN' },
    ],
  },
  {
    name: 'Facilities',
    code: 'FAC',
    description: 'Building and facility maintenance',
    subcategories: [
      { name: 'Electrical', code: 'FAC-ELEC' },
      { name: 'Plumbing', code: 'FAC-PLMB' },
      { name: 'HVAC / AC', code: 'FAC-HVAC' },
      { name: 'Housekeeping', code: 'FAC-HKEP' },
    ],
  },
  {
    name: 'Biomedical',
    code: 'BIO',
    description: 'Biomedical equipment service',
    subcategories: [
      { name: 'Ventilator', code: 'BIO-VENT' },
      { name: 'ECG Machine', code: 'BIO-ECG' },
      { name: 'Infusion Pump', code: 'BIO-PUMP' },
      { name: 'Ultrasound', code: 'BIO-US' },
    ],
  },
];

const LOCATIONS = [
  { block: 'A', floor: 'Ground', ward: 'OPD', room: 'A-G-01' },
  { block: 'A', floor: 'Ground', ward: 'OPD', room: 'A-G-02' },
  { block: 'A', floor: '1st', ward: 'Cardiology', room: 'A-1-10' },
  { block: 'B', floor: 'Ground', ward: 'Emergency', room: 'B-G-ER' },
  { block: 'B', floor: '2nd', ward: 'ICU', room: 'B-2-ICU' },
  { block: 'C', floor: 'Ground', ward: 'Radiology', room: 'C-G-RAD' },
  { block: 'C', floor: '1st', ward: 'Lab', room: 'C-1-LAB' },
  { block: 'D', floor: 'Ground', ward: 'Pharmacy', room: 'D-G-PH' },
  { block: 'D', floor: '1st', ward: 'Admin', room: 'D-1-ADM' },
  { block: 'Server Room', floor: 'Basement', ward: null, room: 'SR-B-01' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const hash = (pwd) => bcrypt.hash(pwd, SALT_ROUNDS);

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

const daysAgo = (n) => new Date(Date.now() - n * 86400000);

const buildTicketNumber = (categoryCode, index) => {
  const year = new Date().getUTCFullYear();
  return `TKT-${categoryCode}-${year}-${String(index).padStart(4, '0')}`;
};

// ---------------------------------------------------------------------------
// Main seed
// ---------------------------------------------------------------------------

const seed = async () => {
  try {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  // Clear all collections
  await Promise.all([
    TicketActivityLog.deleteMany({}),
    TicketComment.deleteMany({}),
    TicketAttachment.deleteMany({}),
    Ticket.deleteMany({}),
    User.deleteMany({}),
    Subcategory.deleteMany({}),
    Category.deleteMany({}),
    Department.deleteMany({}),
    Location.deleteMany({}),
    SLAConfig.deleteMany({}),
  ]);
  console.log('Cleared all collections');

  // SLA configs
  await SLAConfig.insertMany(SLA_CONFIGS);
  console.log('Seeded SLA configs');

  // Departments
  const departments = await Department.insertMany(DEPARTMENTS);
  const deptByCode = Object.fromEntries(departments.map((d) => [d.code, d]));
  console.log(`Seeded ${departments.length} departments`);

  // Categories + Subcategories
  const categoryDocs = [];
  const subcategoryDocs = [];

  for (const catDef of CATEGORIES_WITH_SUBS) {
    const { subcategories, ...catData } = catDef;
    const cat = await Category.create(catData);
    categoryDocs.push(cat);

    const subs = subcategories.map((s) => ({ ...s, categoryId: cat._id }));
    const createdSubs = await Subcategory.insertMany(subs);
    subcategoryDocs.push(...createdSubs);
  }
  console.log(`Seeded ${categoryDocs.length} categories, ${subcategoryDocs.length} subcategories`);

  // Locations
  const locations = await Location.insertMany(LOCATIONS);
  console.log(`Seeded ${locations.length} locations`);

  // Users — named accounts plus one requester per department without a named user
  const [adminPwd, helpdeskPwd, hodPwd, requesterPwd] = await Promise.all([
    hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345'),
    hash('Helpdesk@12345'),
    hash('Hod@12345'),
    hash('User@12345'),
  ]);

  const namedUserSpecs = [
    {
      fullName: process.env.SEED_ADMIN_NAME ?? 'System Administrator',
      empId: '10001',
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@tmshospital.com',
      phone: process.env.SEED_ADMIN_PHONE ?? '9999999999',
      password: adminPwd,
      role: Role.ADMIN,
      deptCode: 'IT',
    },
    {
      fullName: 'Helpdesk Agent One',
      empId: '10002',
      email: 'helpdesk1@tmshospital.com',
      phone: '9000000001',
      password: helpdeskPwd,
      role: Role.HELPDESK,
      deptCode: 'IT',
    },
    {
      fullName: 'Helpdesk Agent Two',
      empId: '10003',
      email: 'helpdesk2@tmshospital.com',
      phone: '9000000002',
      password: helpdeskPwd,
      role: Role.HELPDESK,
      deptCode: 'IT',
    },
    {
      fullName: 'Dr. Cardiology HOD',
      empId: '10004',
      email: 'hod.cardio@tmshospital.com',
      phone: '9000000003',
      password: hodPwd,
      role: Role.HOD,
      deptCode: 'CARDIO',
    },
    {
      fullName: 'Dr. Radiology HOD',
      empId: '10005',
      email: 'hod.radio@tmshospital.com',
      phone: '9000000004',
      password: hodPwd,
      role: Role.HOD,
      deptCode: 'RADIO',
    },
    {
      fullName: 'Nurse Anita Patel',
      empId: '10006',
      email: 'anita.patel@tmshospital.com',
      phone: '9000000007',
      password: requesterPwd,
      role: Role.REQUESTER,
      deptCode: 'NURS',
    },
    {
      fullName: 'Dr. Arjun Mehta',
      empId: '10007',
      email: 'arjun.mehta@tmshospital.com',
      phone: '9000000008',
      password: requesterPwd,
      role: Role.REQUESTER,
      deptCode: 'CARDIO',
    },
    {
      fullName: 'Pharmacist Sunita Rao',
      empId: '10008',
      email: 'sunita.rao@tmshospital.com',
      phone: '9000000009',
      password: requesterPwd,
      role: Role.REQUESTER,
      deptCode: 'PHARMA',
    },
  ];

  const deptCodesWithNamedUser = new Set(namedUserSpecs.map((s) => s.deptCode));
  const AUTO_EMP_ID_START = 10009;
  const autoRequesterSpecs = DEPARTMENTS.filter((d) => !deptCodesWithNamedUser.has(d.code)).map((d, idx) => ({
    fullName: `${d.name} Coordinator`,
    empId: String(AUTO_EMP_ID_START + idx).padStart(5, '0'),
    email: `coordinator.${d.code.toLowerCase()}@tmshospital.com`,
    phone: `9100${String(10000 + idx).slice(-4)}`,
    password: requesterPwd,
    role: Role.REQUESTER,
    deptCode: d.code,
  }));

  const allUserSpecs = [...namedUserSpecs, ...autoRequesterSpecs];
  const usersData = allUserSpecs.map(({ deptCode, ...rest }) => ({
    ...rest,
    departmentId: deptByCode[deptCode]._id,
  }));

  const users = await User.insertMany(usersData);
  const userByRole = (role) => users.filter((u) => u.role === role);
  const requesters = userByRole(Role.REQUESTER);
  const helpdesks = userByRole(Role.HELPDESK);
  console.log(`Seeded ${users.length} users`);

  // Tickets
  const ticketDefs = [
    {
      title: 'Workstation not booting in OPD',
      description: 'The desktop in room A-G-01 does not power on since morning.',
      priority: Priority.HIGH,
      status: TicketStatus.OPEN,
      categoryCode: 'HW',
      subCode: 'HW-DESK',
      deptCode: 'IT',
      locIdx: 0,
      createdDaysAgo: 1,
    },
    {
      title: 'HIS application crashing on login',
      description: 'HIS throws an unhandled exception when staff try to log in.',
      priority: Priority.CRITICAL,
      status: TicketStatus.IN_PROGRESS,
      categoryCode: 'SW',
      subCode: 'SW-HIS',
      deptCode: 'IT',
      locIdx: 9,
      createdDaysAgo: 2,
    },
    {
      title: 'Wi-Fi not working in ICU',
      description: 'Nursing staff cannot connect to hospital Wi-Fi in ICU ward.',
      priority: Priority.HIGH,
      status: TicketStatus.ASSIGNED,
      categoryCode: 'NET',
      subCode: 'NET-WIFI',
      deptCode: 'IT',
      locIdx: 4,
      createdDaysAgo: 1,
    },
    {
      title: 'ECG machine display flickering',
      description: 'ECG machine in cardiology ward shows intermittent display issues.',
      priority: Priority.CRITICAL,
      status: TicketStatus.ESCALATED,
      categoryCode: 'BIO',
      subCode: 'BIO-ECG',
      deptCode: 'CARDIO',
      locIdx: 2,
      createdDaysAgo: 3,
    },
    {
      title: 'AC not cooling in Radiology',
      description: 'The HVAC unit in the radiology room is not maintaining temperature.',
      priority: Priority.MEDIUM,
      status: TicketStatus.RESOLVED,
      categoryCode: 'FAC',
      subCode: 'FAC-HVAC',
      deptCode: 'RADIO',
      locIdx: 5,
      createdDaysAgo: 5,
    },
    {
      title: 'Printer offline in pharmacy',
      description: 'Label printer in pharmacy is showing offline status.',
      priority: Priority.LOW,
      status: TicketStatus.CLOSED,
      categoryCode: 'HW',
      subCode: 'HW-PRNT',
      deptCode: 'PHARMA',
      locIdx: 7,
      createdDaysAgo: 7,
    },
    {
      title: 'VPN access not working for remote staff',
      description: 'Remote staff cannot connect to hospital VPN since last update.',
      priority: Priority.HIGH,
      status: TicketStatus.OPEN,
      categoryCode: 'NET',
      subCode: 'NET-VPN',
      deptCode: 'IT',
      locIdx: 9,
      createdDaysAgo: 0,
    },
    {
      title: 'Infusion pump alarm not silencing',
      description: 'Infusion pump in ICU keeps alarming even after acknowledgement.',
      priority: Priority.CRITICAL,
      status: TicketStatus.IN_PROGRESS,
      categoryCode: 'BIO',
      subCode: 'BIO-PUMP',
      deptCode: 'ER',
      locIdx: 3,
      createdDaysAgo: 1,
    },
    {
      title: 'Electrical short circuit in lab',
      description: 'A short circuit tripped the breaker in the lab corridor.',
      priority: Priority.HIGH,
      status: TicketStatus.ASSIGNED,
      categoryCode: 'FAC',
      subCode: 'FAC-ELEC',
      deptCode: 'LAB',
      locIdx: 6,
      createdDaysAgo: 2,
    },
    {
      title: 'Antivirus definitions outdated on nurse stations',
      description: 'Antivirus on nursing floor workstations has not updated in 30 days.',
      priority: Priority.MEDIUM,
      status: TicketStatus.ON_HOLD,
      categoryCode: 'SW',
      subCode: 'SW-SEC',
      deptCode: 'NURS',
      locIdx: 1,
      createdDaysAgo: 4,
    },
    {
      title: 'Duplicate ticket raised by mistake',
      description: 'Requester raised the same issue twice and wants to cancel this ticket.',
      priority: Priority.LOW,
      status: TicketStatus.CANCELLED,
      categoryCode: 'SW',
      subCode: 'SW-MAIL',
      deptCode: 'ADMIN',
      locIdx: 8,
      createdDaysAgo: 2,
    },
    {
      title: 'Ventilator preventive maintenance due',
      description: 'Biomed team needs to complete scheduled PM on ICU ventilators.',
      priority: Priority.MEDIUM,
      status: TicketStatus.OPEN,
      categoryCode: 'BIO',
      subCode: 'BIO-VENT',
      deptCode: 'BIOENG',
      locIdx: 4,
      createdDaysAgo: 1,
    },
    {
      title: 'Patient monitor network dropouts',
      description: 'Central monitoring station loses telemetry from beds 3–6 intermittently.',
      priority: Priority.HIGH,
      status: TicketStatus.IN_PROGRESS,
      categoryCode: 'NET',
      subCode: 'NET-LAN',
      deptCode: 'ICU',
      locIdx: 4,
      createdDaysAgo: 0,
    },
    {
      title: 'Chemo suite fridge temperature alert',
      description: 'Oncology cold-chain fridge reporting high temperature warnings.',
      priority: Priority.CRITICAL,
      status: TicketStatus.ASSIGNED,
      categoryCode: 'FAC',
      subCode: 'FAC-HVAC',
      deptCode: 'ONCO',
      locIdx: 2,
      createdDaysAgo: 1,
    },
    {
      title: 'Ultrasound probe intermittent failure',
      description: 'OBGYN ultrasound probe disconnects during scans.',
      priority: Priority.HIGH,
      status: TicketStatus.OPEN,
      categoryCode: 'BIO',
      subCode: 'BIO-US',
      deptCode: 'OBGYN',
      locIdx: 1,
      createdDaysAgo: 2,
    },
    {
      title: 'EHR downtime drill documentation',
      description: 'Medical records needs IT support for scheduled downtime communications.',
      priority: Priority.LOW,
      status: TicketStatus.ON_HOLD,
      categoryCode: 'SW',
      subCode: 'SW-HIS',
      deptCode: 'MEDREC',
      locIdx: 8,
      createdDaysAgo: 6,
    },
    {
      title: 'Spill cleanup cart restock',
      description: 'Housekeeping requests restock of spill kits on pediatric floor.',
      priority: Priority.LOW,
      status: TicketStatus.RESOLVED,
      categoryCode: 'FAC',
      subCode: 'FAC-HKEP',
      deptCode: 'HKEEP',
      locIdx: 0,
      createdDaysAgo: 4,
    },
  ];

  const catByCode = Object.fromEntries(categoryDocs.map((c) => [c.code, c]));
  const subByCode = Object.fromEntries(subcategoryDocs.map((s) => [s.code, s]));

  const createdTickets = [];

  for (let i = 0; i < ticketDefs.length; i++) {
    const def = ticketDefs[i];
    const requester = randomItem(requesters);
    const assignee = [TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS, TicketStatus.ESCALATED, TicketStatus.RESOLVED, TicketStatus.CLOSED].includes(def.status)
      ? randomItem([...helpdesks])
      : null;

    const createdAt = daysAgo(def.createdDaysAgo);
    const resolvedAt = def.status === TicketStatus.RESOLVED || def.status === TicketStatus.CLOSED
      ? new Date(createdAt.getTime() + 3600000 * 4)
      : null;
    const cancelledAt =
      def.status === TicketStatus.CANCELLED ? new Date(createdAt.getTime() + 3600000) : null;

    const ticket = await Ticket.create({
      ticketNumber: buildTicketNumber(def.categoryCode, i + 1),
      title: def.title,
      description: def.description,
      priority: def.priority,
      status: def.status,
      isOverdue: def.status === TicketStatus.ESCALATED,
      departmentId: deptByCode[def.deptCode]._id,
      categoryId: catByCode[def.categoryCode]._id,
      subcategoryId: subByCode[def.subCode]._id,
      locationId: locations[def.locIdx]._id,
      requesterId: requester._id,
      assignedToId: assignee?._id ?? null,
      resolvedAt,
      cancelledAt,
      createdAt,
      updatedAt: createdAt,
    });

    createdTickets.push(ticket);

    // Activity log — created
    await TicketActivityLog.create({
      ticketId: ticket._id,
      actorId: requester._id,
      action: 'CREATED',
      toValue: TicketStatus.OPEN,
      note: 'Ticket submitted',
      createdAt,
    });

    if (def.status === TicketStatus.CANCELLED) {
      await TicketActivityLog.create({
        ticketId: ticket._id,
        actorId: requester._id,
        action: 'CANCELLED',
        fromValue: TicketStatus.OPEN,
        toValue: TicketStatus.CANCELLED,
        note: 'Ticket cancelled by requester',
        createdAt: cancelledAt,
      });
    }

    // Activity log — assigned/claimed
    if (assignee) {
      await TicketActivityLog.create({
        ticketId: ticket._id,
        actorId: assignee._id,
        action: 'ASSIGNED',
        fromValue: TicketStatus.OPEN,
        toValue: ticket.status,
        note: `Claimed by ${assignee.fullName}`,
        createdAt: new Date(createdAt.getTime() + 1800000),
      });
    }

    // Comment
    await TicketComment.create({
      ticketId: ticket._id,
      authorId: requester._id,
      content: `Issue reported: ${def.description}`,
      isInternal: false,
      createdAt,
    });

    if (assignee) {
      await TicketComment.create({
        ticketId: ticket._id,
        authorId: assignee._id,
        content: 'Acknowledged. Investigating the issue.',
        isInternal: true,
        createdAt: new Date(createdAt.getTime() + 3600000),
      });
    }
  }

  console.log(`Seeded ${createdTickets.length} tickets with comments and activity logs`);

  // Summary
  console.log('\n=== Seed Complete ===');
  console.log(`Departments   : ${departments.length}`);
  console.log(`Categories    : ${categoryDocs.length}`);
  console.log(`Subcategories : ${subcategoryDocs.length}`);
  console.log(`Locations     : ${locations.length}`);
  console.log(`SLA Configs   : ${SLA_CONFIGS.length}`);
  console.log(`Users         : ${users.length}`);
  console.log(`Tickets       : ${createdTickets.length}`);
  console.log('\nAdmin login:');
  console.log(`  empId    : 10001`);
  console.log(`  password : ${process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345'}`);
  } finally {
    await mongoose.disconnect();
  }
};

seed()
  .then(() => {
    console.log('\nDone.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
