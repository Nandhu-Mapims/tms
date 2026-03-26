/**
 * Fresh MongoDB seed script for TMS.
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
const TicketTransferRequest = require('./models/TicketTransferRequest.model');

const MONGO_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/tms_hospital';
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

const SLA_CONFIGS = [
  { priority: Priority.LOW, firstResponseMinutes: 240, resolutionMinutes: 2880, escalationMinutes: 2160 },
  { priority: Priority.MEDIUM, firstResponseMinutes: 120, resolutionMinutes: 1440, escalationMinutes: 1080 },
  { priority: Priority.HIGH, firstResponseMinutes: 60, resolutionMinutes: 480, escalationMinutes: 360 },
  { priority: Priority.CRITICAL, firstResponseMinutes: 15, resolutionMinutes: 120, escalationMinutes: 90 },
];

const DEPARTMENTS = [
  { name: 'Information Technology', code: 'IT', description: 'IT and digital systems support' },
  { name: 'Biomedical Engineering', code: 'BIOENG', description: 'Biomedical equipment support' },
  { name: 'Facilities', code: 'FAC', description: 'Electrical, plumbing, and facility operations' },
  { name: 'Nursing', code: 'NURS', description: 'Nursing operations and ward coordination' },
  { name: 'Pharmacy', code: 'PHARMA', description: 'Pharmacy dispensing and inventory support' },
];

const CATEGORIES = [
  {
    name: 'Hardware',
    code: 'HW',
    description: 'Physical device issues',
    subcategories: [
      { name: 'Desktop / Workstation', code: 'HW-DESK' },
      { name: 'Printer / Scanner', code: 'HW-PRN' },
      { name: 'Medical Device', code: 'HW-MED' },
    ],
  },
  {
    name: 'Software',
    code: 'SW',
    description: 'Applications and systems',
    subcategories: [
      { name: 'HIS / EMR', code: 'SW-HIS' },
      { name: 'Login / Access', code: 'SW-LOGIN' },
      { name: 'Email / Communication', code: 'SW-MAIL' },
    ],
  },
  {
    name: 'Facilities',
    code: 'FAC',
    description: 'Building and utility issues',
    subcategories: [
      { name: 'Electrical', code: 'FAC-ELEC' },
      { name: 'Air Conditioning', code: 'FAC-AC' },
      { name: 'Housekeeping', code: 'FAC-HKP' },
    ],
  },
];

const LOCATIONS = [
  { block: 'A', floor: 'Ground', ward: 'OPD', room: 'A-G-01' },
  { block: 'A', floor: '1st', ward: 'ICU', room: 'A-1-ICU' },
  { block: 'B', floor: '2nd', ward: 'Radiology', room: 'B-2-RAD' },
  { block: 'C', floor: 'Ground', ward: 'Pharmacy', room: 'C-G-PH' },
  { block: 'D', floor: '1st', ward: 'OT', room: 'D-1-OT-04' },
];

const USER_SPECS = [
  { fullName: 'System Administrator', empId: '10001', email: 'admin@tmshospital.com', role: Role.ADMIN, deptCode: 'IT', pwdKey: 'ADMIN' },
  { fullName: 'IT Helpdesk Agent', empId: '10002', email: 'helpdesk.it@tmshospital.com', role: Role.HELPDESK, deptCode: 'IT', pwdKey: 'HELPDESK' },
  { fullName: 'IT Helpdesk Agent Two', empId: '10011', email: 'helpdesk2.it@tmshospital.com', role: Role.HELPDESK, deptCode: 'IT', pwdKey: 'HELPDESK' },
  { fullName: 'Biomedical Helpdesk Agent', empId: '10003', email: 'helpdesk.bio@tmshospital.com', role: Role.HELPDESK, deptCode: 'BIOENG', pwdKey: 'HELPDESK' },
  { fullName: 'Biomedical Helpdesk Agent Two', empId: '10012', email: 'helpdesk2.bio@tmshospital.com', role: Role.HELPDESK, deptCode: 'BIOENG', pwdKey: 'HELPDESK' },
  { fullName: 'Facilities Helpdesk Agent', empId: '10004', email: 'helpdesk.fac@tmshospital.com', role: Role.HELPDESK, deptCode: 'FAC', pwdKey: 'HELPDESK' },
  { fullName: 'Facilities Helpdesk Agent Two', empId: '10013', email: 'helpdesk2.fac@tmshospital.com', role: Role.HELPDESK, deptCode: 'FAC', pwdKey: 'HELPDESK' },
  { fullName: 'IT HOD', empId: '10005', email: 'hod.it@tmshospital.com', role: Role.HOD, deptCode: 'IT', pwdKey: 'HOD' },
  { fullName: 'Nursing HOD', empId: '10006', email: 'hod.nursing@tmshospital.com', role: Role.HOD, deptCode: 'NURS', pwdKey: 'HOD' },
  { fullName: 'Pharmacy HOD', empId: '10007', email: 'hod.pharmacy@tmshospital.com', role: Role.HOD, deptCode: 'PHARMA', pwdKey: 'HOD' },
  { fullName: 'Requester One', empId: '10014', email: 'requester.one@tmshospital.com', role: Role.REQUESTER, deptCode: 'NURS', pwdKey: 'REQUESTER' },
  { fullName: 'Requester Two', empId: '10015', email: 'requester.two@tmshospital.com', role: Role.REQUESTER, deptCode: 'PHARMA', pwdKey: 'REQUESTER' },
  { fullName: 'Requester Three', empId: '10016', email: 'requester.three@tmshospital.com', role: Role.REQUESTER, deptCode: 'IT', pwdKey: 'REQUESTER' },
];

const TICKET_SPECS = [
  {
    title: 'Nurse station printer not working',
    description: 'Printer is showing paper jam error continuously.',
    categoryCode: 'HW',
    subcategoryCode: 'HW-PRN',
    departmentCode: 'IT',
    priority: Priority.HIGH,
    status: TicketStatus.OPEN,
    requesterEmpId: '10016',
    assigneeEmpId: null,
    locationIndex: 0,
    telecomNumber: '6883',
    locationText: 'opthal ward 1 room no 34',
  },
  {
    title: 'Infusion pump alarm issue',
    description: 'Infusion pump keeps alarm beeping after calibration.',
    categoryCode: 'HW',
    subcategoryCode: 'HW-MED',
    departmentCode: 'BIOENG',
    priority: Priority.CRITICAL,
    status: TicketStatus.ASSIGNED,
    requesterEmpId: '10015',
    assigneeEmpId: '10003',
    locationIndex: 1,
    telecomNumber: '7001',
    locationText: 'icu bed side',
  },
  {
    title: 'OT AC cooling failure',
    description: 'AC in OT room is not cooling and temperature is rising.',
    categoryCode: 'FAC',
    subcategoryCode: 'FAC-AC',
    departmentCode: 'FAC',
    priority: Priority.HIGH,
    status: TicketStatus.IN_PROGRESS,
    requesterEmpId: '10005',
    assigneeEmpId: '10004',
    locationIndex: 4,
    telecomNumber: '7440',
    locationText: 'ot ward 1 room no 34',
  },
  {
    title: 'HIS login failed for nursing staff',
    description: 'Multiple users cannot login to HIS after shift change.',
    categoryCode: 'SW',
    subcategoryCode: 'SW-LOGIN',
    departmentCode: 'IT',
    priority: Priority.MEDIUM,
    status: TicketStatus.RESOLVED,
    requesterEmpId: '10005',
    assigneeEmpId: '10002',
    locationIndex: 2,
    telecomNumber: '6110',
    locationText: 'nursing station floor 2',
  },
  // Routed to IT but requested by other department (Requester + HOD variety)
  {
    title: 'HIS EMR showing stale data',
    description: 'EMR dashboard shows stale information for the last 2 hours.',
    categoryCode: 'SW',
    subcategoryCode: 'SW-HIS',
    departmentCode: 'IT',
    priority: Priority.HIGH,
    status: TicketStatus.OPEN,
    requesterEmpId: '10014',
    assigneeEmpId: null,
    locationIndex: 0,
    telecomNumber: '6700',
    locationText: 'nurs ward 2 room no 12',
  },
  {
    title: 'Internet dropouts in OPD',
    description: 'Wi-Fi connection drops intermittently in OPD corridors.',
    categoryCode: 'HW',
    subcategoryCode: 'HW-PRN',
    departmentCode: 'IT',
    priority: Priority.CRITICAL,
    status: TicketStatus.ASSIGNED,
    requesterEmpId: '10006',
    assigneeEmpId: '10002',
    locationIndex: 2,
    telecomNumber: '6123',
    locationText: 'OPD ward room no 34',
  },
  {
    title: 'Printer offline at pharmacy billing',
    description: 'Billing label printer at pharmacy counters is repeatedly going offline.',
    categoryCode: 'HW',
    subcategoryCode: 'HW-PRN',
    departmentCode: 'IT',
    priority: Priority.LOW,
    status: TicketStatus.IN_PROGRESS,
    requesterEmpId: '10015',
    assigneeEmpId: '10002',
    locationIndex: 3,
    telecomNumber: '6999',
    locationText: 'pharmacy ward room no 05',
  },
  {
    title: 'Security HOD ticket routing test',
    description: 'Test ticket raised by a HOD from another department but routed to IT.',
    categoryCode: 'SW',
    subcategoryCode: 'SW-LOGIN',
    departmentCode: 'IT',
    priority: Priority.MEDIUM,
    status: TicketStatus.OPEN,
    requesterEmpId: '10007',
    assigneeEmpId: null,
    locationIndex: 1,
    telecomNumber: '7222',
    locationText: 'bioeng ward 1 room no 01',
  },
  // More cross-department examples for BIOENG/FAC
  {
    title: 'Desktop not responding in ICU',
    description: 'Terminal in ICU is unresponsive and requires hard reset.',
    categoryCode: 'HW',
    subcategoryCode: 'HW-DESK',
    departmentCode: 'BIOENG',
    priority: Priority.HIGH,
    status: TicketStatus.OPEN,
    requesterEmpId: '10016',
    assigneeEmpId: '10003',
    locationIndex: 1,
    telecomNumber: '7888',
    locationText: 'ICU ward 1 room no 22',
  },
  {
    title: 'OT housekeeping request',
    description: 'Housekeeping team requested for OT post-procedure deep cleaning.',
    categoryCode: 'FAC',
    subcategoryCode: 'FAC-HKP',
    departmentCode: 'FAC',
    priority: Priority.LOW,
    status: TicketStatus.RESOLVED,
    requesterEmpId: '10015',
    assigneeEmpId: '10004',
    locationIndex: 4,
    telecomNumber: '7007',
    locationText: 'OT ward room no 10',
  },
  // HOD-managed tickets (assignee role = HOD) for the HOD-to-HOD menu.
  {
    title: 'HOD HOD managed: HIS stale data (routed to IT)',
    description: 'HIS dashboard stale. HOD requested immediate investigation.',
    categoryCode: 'SW',
    subcategoryCode: 'SW-HIS',
    departmentCode: 'IT',
    priority: Priority.HIGH,
    status: TicketStatus.ASSIGNED,
    requesterEmpId: '10006', // Nursing HOD requested
    assigneeEmpId: '10005', // IT HOD manages
    locationIndex: 2,
    telecomNumber: '6990',
    locationText: 'NURS ward 2 room no 10',
  },
  {
    title: 'HOD HOD managed: Login access problem (routed to IT)',
    description: 'Login access failing for HOD staff after password rotation.',
    categoryCode: 'SW',
    subcategoryCode: 'SW-LOGIN',
    departmentCode: 'IT',
    priority: Priority.MEDIUM,
    status: TicketStatus.OPEN,
    requesterEmpId: '10007', // Pharmacy HOD requested
    assigneeEmpId: '10005', // IT HOD manages
    locationIndex: 1,
    telecomNumber: '6991',
    locationText: 'PHARMA ward room no 3',
  },
  {
    title: 'HOD-managed: Printer issue (routed to NURS)',
    description: 'Printer offline in nursing ward. Assigned to nursing HOD.',
    categoryCode: 'HW',
    subcategoryCode: 'HW-PRN',
    departmentCode: 'NURS',
    priority: Priority.LOW,
    status: TicketStatus.IN_PROGRESS,
    requesterEmpId: '10005', // IT HOD requested
    assigneeEmpId: '10006', // Nursing HOD manages
    locationIndex: 0,
    telecomNumber: '6992',
    locationText: 'OPD ward room no 1',
  },
];

const buildTicketNumber = (categoryCode, index) => {
  const year = new Date().getUTCFullYear();
  return `TKT-${categoryCode}-${year}-${String(index + 1).padStart(4, '0')}`;
};

const hashWith = (plainText) => bcrypt.hash(plainText, SALT_ROUNDS);

const clearAllCollections = async () => {
  await Promise.all([
    TicketTransferRequest.deleteMany({}),
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
};

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log(`Connected to MongoDB: ${MONGO_URI}`);

  await clearAllCollections();
  console.log('Cleared existing data');

  await SLAConfig.insertMany(SLA_CONFIGS);
  const departments = await Department.insertMany(DEPARTMENTS);
  const deptByCode = Object.fromEntries(departments.map((item) => [item.code, item]));

  const createdCategories = [];
  const createdSubcategories = [];
  for (const definition of CATEGORIES) {
    const { subcategories, ...categoryData } = definition;
    const category = await Category.create(categoryData);
    createdCategories.push(category);
    const subcategoryDocs = await Subcategory.insertMany(
      subcategories.map((item) => ({ ...item, categoryId: category._id }))
    );
    createdSubcategories.push(...subcategoryDocs);
  }

  const locations = await Location.insertMany(LOCATIONS);
  const categoryByCode = Object.fromEntries(createdCategories.map((item) => [item.code, item]));
  const subcategoryByCode = Object.fromEntries(createdSubcategories.map((item) => [item.code, item]));

  const passwords = {
    ADMIN: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345',
    HELPDESK: process.env.SEED_HELPDESK_PASSWORD ?? 'Helpdesk@12345',
    HOD: process.env.SEED_HOD_PASSWORD ?? 'Hod@12345',
    REQUESTER: process.env.SEED_REQUESTER_PASSWORD ?? 'User@12345',
  };
  const passwordHashes = {
    ADMIN: await hashWith(passwords.ADMIN),
    HELPDESK: await hashWith(passwords.HELPDESK),
    HOD: await hashWith(passwords.HOD),
    REQUESTER: await hashWith(passwords.REQUESTER),
  };

  const userPayload = USER_SPECS.map((item) => ({
    fullName: item.fullName,
    empId: item.empId,
    email: item.email,
    phone: `9${item.empId.padStart(9, '0').slice(0, 9)}`,
    password: passwordHashes[item.pwdKey],
    role: item.role,
    departmentId: deptByCode[item.deptCode]?._id ?? null,
    isActive: true,
  }));
  const users = await User.insertMany(userPayload);
  const userByEmpId = Object.fromEntries(users.map((item) => [item.empId, item]));

  for (let index = 0; index < TICKET_SPECS.length; index += 1) {
    const spec = TICKET_SPECS[index];
    const createdAt = new Date(Date.now() - (index + 1) * 60 * 60 * 1000);
    const ticket = await Ticket.create({
      ticketNumber: buildTicketNumber(spec.categoryCode, index),
      title: spec.title,
      description: spec.description,
      priority: spec.priority,
      status: spec.status,
      departmentId: deptByCode[spec.departmentCode]._id,
      requesterDepartmentId: userByEmpId[spec.requesterEmpId]?.departmentId ?? null,
      categoryId: categoryByCode[spec.categoryCode]._id,
      subcategoryId: subcategoryByCode[spec.subcategoryCode]._id,
      locationId: locations[spec.locationIndex]?._id ?? null,
      locationText: spec.locationText,
      requesterId: userByEmpId[spec.requesterEmpId]._id,
      assignedToId: spec.assigneeEmpId ? userByEmpId[spec.assigneeEmpId]._id : null,
      telecomNumber: spec.telecomNumber,
      createdAt,
      updatedAt: createdAt,
      resolvedAt: spec.status === TicketStatus.RESOLVED ? new Date(createdAt.getTime() + 2 * 60 * 60 * 1000) : null,
    });

    await TicketComment.create({
      ticketId: ticket._id,
      authorId: userByEmpId[spec.requesterEmpId]._id,
      content: `Raised by requester: ${spec.description}`,
      isInternal: false,
      createdAt,
    });

    await TicketActivityLog.create({
      ticketId: ticket._id,
      actorId: userByEmpId[spec.requesterEmpId]._id,
      action: 'CREATED',
      toValue: TicketStatus.OPEN,
      note: 'Ticket created via seed',
      createdAt,
    });
  }

  console.log('Seed complete');
  console.log(`Departments: ${departments.length}`);
  console.log(`Categories: ${createdCategories.length}`);
  console.log(`Subcategories: ${createdSubcategories.length}`);
  console.log(`Locations: ${locations.length}`);
  console.log(`Users: ${users.length}`);
  console.log(`Tickets: ${TICKET_SPECS.length}`);
  console.log(`Admin login => empId: 10001, password: ${passwords.ADMIN}`);
};

seed()
  .then(async () => {
    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  });
