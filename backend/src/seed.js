/**
 * Fresh MongoDB seed script for TMS.
 * Run: npm run seed
 */
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Role, Priority, TicketStatus } = require('./models/enums');
const Department = require('./models/Department.model');
const SubDepartment = require('./models/SubDepartment.model');
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
  { name: 'Engineering', code: 'ENGG', description: 'Engineering and maintenance services' },
  { name: 'House Keeping', code: 'HK', description: 'Housekeeping and sanitation services' },
  { name: 'Biomedical Engineering', code: 'BME', description: 'Biomedical equipment support' },
  { name: 'Laundry', code: 'LAUNDRY', description: 'Laundry and linen services' },
  { name: 'Transport / Ambulance', code: 'TRANSPORT', description: 'Transport and ambulance services' },
];

const SUB_DEPARTMENTS = [
  { name: 'HVAC', code: 'ENGG-HVAC', deptCode: 'ENGG', description: 'Heating, ventilation and air conditioning' },
  { name: 'Electrical', code: 'ENGG-ELEC', deptCode: 'ENGG', description: 'Electrical systems maintenance' },
  { name: 'CGSS', code: 'ENGG-CGSS', deptCode: 'ENGG', description: 'Central gas supply system' },
  { name: 'Furniture', code: 'ENGG-FURN', deptCode: 'ENGG', description: 'Furniture repair and maintenance' },
  { name: 'Plumbing', code: 'ENGG-PLMB', deptCode: 'ENGG', description: 'Plumbing and water systems' },
  { name: 'Fire & Safety', code: 'ENGG-FIRE', deptCode: 'ENGG', description: 'Fire safety systems and equipment' },
  { name: 'HR', code: 'HK-HR', deptCode: 'HK', description: 'Housekeeping human resources' },
  { name: 'BME', code: 'BME-BME', deptCode: 'BME', description: 'Biomedical engineering operations' },
  { name: 'AGM', code: 'LAUNDRY-AGM', deptCode: 'LAUNDRY', description: 'Assistant general manager – laundry' },
];

const CATEGORIES = [
  {
    name: 'HVAC',
    code: 'ENGG-HVAC',
    deptCode: 'ENGG',
    description: 'Heating, ventilation and air conditioning issues',
    subcategories: [
      { name: 'AC Not Cooling', code: 'HVAC-COOL' },
      { name: 'AC Leaking', code: 'HVAC-LEAK' },
      { name: 'Ventilation Issue', code: 'HVAC-VENT' },
    ],
  },
  {
    name: 'Electrical',
    code: 'ENGG-ELEC',
    deptCode: 'ENGG',
    description: 'Electrical systems and wiring issues',
    subcategories: [
      { name: 'Power Failure', code: 'ELEC-PWR' },
      { name: 'Short Circuit', code: 'ELEC-SHORT' },
      { name: 'Light / Fan Issue', code: 'ELEC-LIGHT' },
    ],
  },
  {
    name: 'Plumbing',
    code: 'ENGG-PLMB',
    deptCode: 'ENGG',
    description: 'Plumbing and water supply issues',
    subcategories: [
      { name: 'Water Leakage', code: 'PLMB-LEAK' },
      { name: 'Drainage Block', code: 'PLMB-DRAIN' },
      { name: 'Tap / Faucet Issue', code: 'PLMB-TAP' },
    ],
  },
  {
    name: 'Fire & Safety',
    code: 'ENGG-FIRE',
    deptCode: 'ENGG',
    description: 'Fire safety equipment and systems',
    subcategories: [
      { name: 'Extinguisher Expired', code: 'FIRE-EXT' },
      { name: 'Alarm Malfunction', code: 'FIRE-ALM' },
      { name: 'Sprinkler Issue', code: 'FIRE-SPRK' },
    ],
  },
  {
    name: 'Furniture',
    code: 'ENGG-FURN',
    deptCode: 'ENGG',
    description: 'Furniture repair and replacement',
    subcategories: [
      { name: 'Bed / Railing Broken', code: 'FURN-BED' },
      { name: 'Chair / Table Damaged', code: 'FURN-CHAIR' },
      { name: 'Cabinet / Shelf Issue', code: 'FURN-CAB' },
    ],
  },
  {
    name: 'CGSS',
    code: 'ENGG-CGSS',
    deptCode: 'ENGG',
    description: 'Central gas supply system issues',
    subcategories: [
      { name: 'Gas Pressure Low', code: 'CGSS-PRES' },
      { name: 'Pipeline Leak', code: 'CGSS-LEAK' },
      { name: 'Regulator Issue', code: 'CGSS-REG' },
    ],
  },
  {
    name: 'Cleaning',
    code: 'HK-CLEAN',
    deptCode: 'HK',
    description: 'Cleaning and sanitation requests',
    subcategories: [
      { name: 'Ward Cleaning', code: 'HK-WARD' },
      { name: 'OT Deep Cleaning', code: 'HK-OT' },
      { name: 'Washroom Cleaning', code: 'HK-WASH' },
    ],
  },
  {
    name: 'Waste Management',
    code: 'HK-WASTE',
    deptCode: 'HK',
    description: 'Biomedical and general waste disposal',
    subcategories: [
      { name: 'Biomedical Waste', code: 'HK-BIOW' },
      { name: 'General Waste', code: 'HK-GENW' },
    ],
  },
  {
    name: 'Equipment Maintenance',
    code: 'BME-MAINT',
    deptCode: 'BME',
    description: 'Biomedical equipment repair and calibration',
    subcategories: [
      { name: 'Ventilator Issue', code: 'BME-VENT' },
      { name: 'Monitor / Sensor Issue', code: 'BME-MON' },
      { name: 'Infusion Pump Issue', code: 'BME-PUMP' },
      { name: 'Calibration Request', code: 'BME-CAL' },
    ],
  },
  {
    name: 'Linen Service',
    code: 'LAUN-LINEN',
    deptCode: 'LAUNDRY',
    description: 'Linen and laundry service requests',
    subcategories: [
      { name: 'Linen Shortage', code: 'LAUN-SHORT' },
      { name: 'Stained / Damaged Linen', code: 'LAUN-DMG' },
      { name: 'Machine Breakdown', code: 'LAUN-MACH' },
    ],
  },
  {
    name: 'Ambulance Service',
    code: 'TRANS-AMB',
    deptCode: 'TRANSPORT',
    description: 'Ambulance and patient transport requests',
    subcategories: [
      { name: 'Ambulance Request', code: 'TRANS-REQ' },
      { name: 'Vehicle Breakdown', code: 'TRANS-BRK' },
      { name: 'Driver Not Available', code: 'TRANS-DRV' },
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
  { fullName: 'Chief Executive', empId: '10017', email: 'chief@tmshospital.com', role: Role.CHIEF, deptCode: 'ENGG', pwdKey: 'CHIEF' },
  { fullName: 'System Administrator', empId: '10001', email: 'admin@tmshospital.com', role: Role.ADMIN, deptCode: 'ENGG', pwdKey: 'ADMIN' },
  { fullName: 'Engineering Helpdesk Agent', empId: '10002', email: 'helpdesk.engg@tmshospital.com', role: Role.HELPDESK, deptCode: 'ENGG', pwdKey: 'HELPDESK' },
  { fullName: 'Engineering Helpdesk Agent Two', empId: '10011', email: 'helpdesk2.engg@tmshospital.com', role: Role.HELPDESK, deptCode: 'ENGG', pwdKey: 'HELPDESK' },
  { fullName: 'BME Helpdesk Agent', empId: '10003', email: 'helpdesk.bme@tmshospital.com', role: Role.HELPDESK, deptCode: 'BME', pwdKey: 'HELPDESK' },
  { fullName: 'BME Helpdesk Agent Two', empId: '10012', email: 'helpdesk2.bme@tmshospital.com', role: Role.HELPDESK, deptCode: 'BME', pwdKey: 'HELPDESK' },
  { fullName: 'HK Helpdesk Agent', empId: '10004', email: 'helpdesk.hk@tmshospital.com', role: Role.HELPDESK, deptCode: 'HK', pwdKey: 'HELPDESK' },
  { fullName: 'HK Helpdesk Agent Two', empId: '10013', email: 'helpdesk2.hk@tmshospital.com', role: Role.HELPDESK, deptCode: 'HK', pwdKey: 'HELPDESK' },
  { fullName: 'Engineering HOD', empId: '10005', email: 'hod.engg@tmshospital.com', role: Role.HOD, deptCode: 'ENGG', pwdKey: 'HOD' },
  { fullName: 'House Keeping HOD', empId: '10006', email: 'hod.hk@tmshospital.com', role: Role.HOD, deptCode: 'HK', pwdKey: 'HOD' },
  { fullName: 'BME HOD', empId: '10007', email: 'hod.bme@tmshospital.com', role: Role.HOD, deptCode: 'BME', pwdKey: 'HOD' },
  { fullName: 'Requester One', empId: '10014', email: 'requester.one@tmshospital.com', role: Role.REQUESTER, deptCode: 'ENGG', pwdKey: 'REQUESTER' },
  { fullName: 'Requester Two', empId: '10015', email: 'requester.two@tmshospital.com', role: Role.REQUESTER, deptCode: 'HK', pwdKey: 'REQUESTER' },
  { fullName: 'Requester Three', empId: '10016', email: 'requester.three@tmshospital.com', role: Role.REQUESTER, deptCode: 'BME', pwdKey: 'REQUESTER' },
];

const TICKET_SPECS = [
  {
    title: 'HVAC not cooling in OT',
    description: 'AC in OT room is not cooling and temperature is rising.',
    categoryCode: 'ENGG-HVAC',
    subcategoryCode: 'HVAC-COOL',
    departmentCode: 'ENGG',
    priority: Priority.HIGH,
    status: TicketStatus.OPEN,
    requesterEmpId: '10014',
    assigneeEmpId: null,
    locationIndex: 4,
    telecomNumber: '7440',
    locationText: 'OT ward 1 room no 34',
  },
  {
    title: 'Infusion pump alarm issue',
    description: 'Infusion pump keeps alarm beeping after calibration.',
    categoryCode: 'BME-MAINT',
    subcategoryCode: 'BME-PUMP',
    departmentCode: 'BME',
    priority: Priority.CRITICAL,
    status: TicketStatus.ASSIGNED,
    requesterEmpId: '10015',
    assigneeEmpId: '10003',
    locationIndex: 1,
    telecomNumber: '7001',
    locationText: 'icu bed side',
  },
  {
    title: 'Electrical short circuit in ICU',
    description: 'Electrical panel tripping repeatedly in ICU wing.',
    categoryCode: 'ENGG-ELEC',
    subcategoryCode: 'ELEC-SHORT',
    departmentCode: 'ENGG',
    priority: Priority.CRITICAL,
    status: TicketStatus.IN_PROGRESS,
    requesterEmpId: '10005',
    assigneeEmpId: '10002',
    locationIndex: 1,
    telecomNumber: '6883',
    locationText: 'ICU ward 1 room no 22',
  },
  {
    title: 'Light not working in ward',
    description: 'Tube light flickering and not turning on in ward corridor.',
    categoryCode: 'ENGG-ELEC',
    subcategoryCode: 'ELEC-LIGHT',
    departmentCode: 'ENGG',
    priority: Priority.MEDIUM,
    status: TicketStatus.RESOLVED,
    requesterEmpId: '10005',
    assigneeEmpId: '10002',
    locationIndex: 2,
    telecomNumber: '6110',
    locationText: 'nursing station floor 2',
  },
  {
    title: 'OT deep cleaning request',
    description: 'Housekeeping team requested for OT post-procedure deep cleaning.',
    categoryCode: 'HK-CLEAN',
    subcategoryCode: 'HK-OT',
    departmentCode: 'HK',
    priority: Priority.LOW,
    status: TicketStatus.RESOLVED,
    requesterEmpId: '10015',
    assigneeEmpId: '10004',
    locationIndex: 4,
    telecomNumber: '7007',
    locationText: 'OT ward room no 10',
  },
  {
    title: 'Plumbing leak in pharmacy store',
    description: 'Water leaking from ceiling pipe in pharmacy storage room.',
    categoryCode: 'ENGG-PLMB',
    subcategoryCode: 'PLMB-LEAK',
    departmentCode: 'ENGG',
    priority: Priority.HIGH,
    status: TicketStatus.OPEN,
    requesterEmpId: '10016',
    assigneeEmpId: null,
    locationIndex: 3,
    telecomNumber: '6700',
    locationText: 'pharmacy store room no 12',
  },
  {
    title: 'Fire extinguisher expired in OPD',
    description: 'Fire extinguisher near OPD entrance has crossed expiry.',
    categoryCode: 'ENGG-FIRE',
    subcategoryCode: 'FIRE-EXT',
    departmentCode: 'ENGG',
    priority: Priority.CRITICAL,
    status: TicketStatus.ASSIGNED,
    requesterEmpId: '10006',
    assigneeEmpId: '10002',
    locationIndex: 0,
    telecomNumber: '6123',
    locationText: 'OPD ward room no 34',
  },
  {
    title: 'Furniture broken in ward bed',
    description: 'Patient bed railing is broken and needs immediate replacement.',
    categoryCode: 'ENGG-FURN',
    subcategoryCode: 'FURN-BED',
    departmentCode: 'ENGG',
    priority: Priority.LOW,
    status: TicketStatus.IN_PROGRESS,
    requesterEmpId: '10015',
    assigneeEmpId: '10002',
    locationIndex: 2,
    telecomNumber: '6999',
    locationText: 'ward B room no 05',
  },
  {
    title: 'Ventilator calibration needed',
    description: 'Ventilator showing inconsistent readings, calibration overdue.',
    categoryCode: 'BME-MAINT',
    subcategoryCode: 'BME-CAL',
    departmentCode: 'BME',
    priority: Priority.HIGH,
    status: TicketStatus.OPEN,
    requesterEmpId: '10016',
    assigneeEmpId: '10003',
    locationIndex: 1,
    telecomNumber: '7888',
    locationText: 'ICU ward 1 room no 22',
  },
  {
    title: 'Laundry machine breakdown',
    description: 'Industrial washing machine not starting, needs technician.',
    categoryCode: 'LAUN-LINEN',
    subcategoryCode: 'LAUN-MACH',
    departmentCode: 'LAUNDRY',
    priority: Priority.MEDIUM,
    status: TicketStatus.OPEN,
    requesterEmpId: '10014',
    assigneeEmpId: null,
    locationIndex: 3,
    telecomNumber: '7222',
    locationText: 'laundry block room no 01',
  },
  {
    title: 'HOD managed: HVAC issue (routed to ENGG)',
    description: 'HVAC system malfunctioning. HOD requested immediate fix.',
    categoryCode: 'ENGG-HVAC',
    subcategoryCode: 'HVAC-VENT',
    departmentCode: 'ENGG',
    priority: Priority.HIGH,
    status: TicketStatus.ASSIGNED,
    requesterEmpId: '10006',
    assigneeEmpId: '10005',
    locationIndex: 2,
    telecomNumber: '6990',
    locationText: 'HK ward 2 room no 10',
  },
  {
    title: 'HOD managed: BME equipment issue',
    description: 'Equipment failure reported by BME HOD.',
    categoryCode: 'BME-MAINT',
    subcategoryCode: 'BME-MON',
    departmentCode: 'BME',
    priority: Priority.MEDIUM,
    status: TicketStatus.OPEN,
    requesterEmpId: '10007',
    assigneeEmpId: '10005',
    locationIndex: 1,
    telecomNumber: '6991',
    locationText: 'BME lab room no 3',
  },
  {
    title: 'HOD managed: Housekeeping complaint',
    description: 'Repeated cleaning quality issues in ward. HK HOD assigned.',
    categoryCode: 'HK-CLEAN',
    subcategoryCode: 'HK-WARD',
    departmentCode: 'HK',
    priority: Priority.LOW,
    status: TicketStatus.IN_PROGRESS,
    requesterEmpId: '10005',
    assigneeEmpId: '10006',
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
    SubDepartment.deleteMany({}),
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

  const subDepartmentDocs = SUB_DEPARTMENTS.map((sd) => ({
    name: sd.name,
    code: sd.code,
    departmentId: deptByCode[sd.deptCode]._id,
    description: sd.description,
  }));
  const subDepartments = await SubDepartment.insertMany(subDepartmentDocs);

  const createdCategories = [];
  const createdSubcategories = [];
  for (const definition of CATEGORIES) {
    const { subcategories, deptCode, ...categoryData } = definition;
    if (deptCode && deptByCode[deptCode]) {
      categoryData.departmentId = deptByCode[deptCode]._id;
    }
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
    CHIEF: process.env.SEED_CHIEF_PASSWORD ?? 'Chief@12345',
    ADMIN: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345',
    HELPDESK: process.env.SEED_HELPDESK_PASSWORD ?? 'Helpdesk@12345',
    HOD: process.env.SEED_HOD_PASSWORD ?? 'Hod@12345',
    REQUESTER: process.env.SEED_REQUESTER_PASSWORD ?? 'User@12345',
  };
  const passwordHashes = {
    CHIEF: await hashWith(passwords.CHIEF),
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
  console.log(`Sub-departments: ${subDepartments.length}`);
  console.log(`Categories: ${createdCategories.length}`);
  console.log(`Subcategories: ${createdSubcategories.length}`);
  console.log(`Locations: ${locations.length}`);
  console.log(`Users: ${users.length}`);
  console.log(`Tickets: ${TICKET_SPECS.length}`);
  console.log(`Chief login => empId: 10017, password: ${passwords.CHIEF}`);
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
