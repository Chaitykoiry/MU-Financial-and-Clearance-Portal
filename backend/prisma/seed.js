const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CPCS Database...');

  // 1. Create Departments
  const departmentsData = [
    { code: 'LIBRARY', name: 'University Main Library', description: 'Book returns, fine settlements, and catalog clearance', requiresPayment: false },
    { code: 'BURSAR', name: 'Bursary & Student Accounts', description: 'Tuition fees, lab fees, and graduation charges', requiresPayment: true },
    { code: 'HOSTEL', name: 'Hostel & Hall Management', description: 'Room inventory, key return, and hall damages', requiresPayment: false },
    { code: 'SPORTS', name: 'Sports & Athletics Council', description: 'Sports equipment return and kit clearance', requiresPayment: false },
    { code: 'EXAMS', name: 'Exams & Academic Records', description: 'Transcript audit, credit confirmation, grade audit', requiresPayment: false },
    { code: 'FACULTY', name: 'Department Head & Faculty', description: 'Final year project submission, lab equipment sign-off', requiresPayment: false }
  ];

  const departments = {};
  for (const dept of departmentsData) {
    const record = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, description: dept.description, requiresPayment: dept.requiresPayment },
      create: dept
    });
    departments[dept.code] = record;
  }
  console.log(`✓ Seeded ${Object.keys(departments).length} institutional departments.`);

  // Passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const officerPassword = await bcrypt.hash('officer123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  // 2. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cpcs.edu' },
    update: {},
    create: {
      email: 'admin@cpcs.edu',
      password: adminPassword,
      fullName: 'System Administrator',
      matricOrStaffId: 'ADM-2026-001',
      role: 'ADMIN'
    }
  });

  // 3. Create Department Officers
  const libraryOfficer = await prisma.user.upsert({
    where: { email: 'library@cpcs.edu' },
    update: {},
    create: {
      email: 'library@cpcs.edu',
      password: officerPassword,
      fullName: 'Dr. Sarah Connor (Library Head)',
      matricOrStaffId: 'OFF-LIB-001',
      role: 'DEPARTMENT_OFFICER',
      departmentId: departments['LIBRARY'].id
    }
  });

  const bursarOfficer = await prisma.user.upsert({
    where: { email: 'bursar@cpcs.edu' },
    update: {},
    create: {
      email: 'bursar@cpcs.edu',
      password: officerPassword,
      fullName: 'Chief Accountant Marcus Vance',
      matricOrStaffId: 'OFF-BUR-001',
      role: 'DEPARTMENT_OFFICER',
      departmentId: departments['BURSAR'].id
    }
  });

  const hostelOfficer = await prisma.user.upsert({
    where: { email: 'hostel@cpcs.edu' },
    update: {},
    create: {
      email: 'hostel@cpcs.edu',
      password: officerPassword,
      fullName: 'Mrs. Evelyn Reed (Hall Warden)',
      matricOrStaffId: 'OFF-HOS-001',
      role: 'DEPARTMENT_OFFICER',
      departmentId: departments['HOSTEL'].id
    }
  });

  // 4. Create Demo Students
  const student1 = await prisma.user.upsert({
    where: { email: 'student@cpcs.edu' },
    update: {},
    create: {
      email: 'student@cpcs.edu',
      password: studentPassword,
      fullName: 'Alex J. Mercer',
      matricOrStaffId: 'STU-2026-9041',
      role: 'STUDENT'
    }
  });

  const student2 = await prisma.user.upsert({
    where: { email: 'clara@cpcs.edu' },
    update: {},
    create: {
      email: 'clara@cpcs.edu',
      password: studentPassword,
      fullName: 'Clara Oswald',
      matricOrStaffId: 'STU-2026-8812',
      role: 'STUDENT'
    }
  });

  console.log('✓ Seeded Users: Admin, Officers, and Students.');

  // 5. Seed a Sample Completed Clearance with QR Certificate for Alex Mercer
  const sampleCertCode = 'CPCS-CERT-773921';
  let sampleClearance = await prisma.clearanceRequest.findFirst({
    where: { studentId: student1.id, certificateCode: sampleCertCode }
  });

  if (!sampleClearance) {
    sampleClearance = await prisma.clearanceRequest.create({
      data: {
        studentId: student1.id,
        academicSession: '2025/2026',
        clearanceType: 'GRADUATION',
        status: 'APPROVED',
        certificateCode: sampleCertCode,
        issuedAt: new Date()
      }
    });

    for (const code of Object.keys(departments)) {
      await prisma.departmentApproval.create({
        data: {
          clearanceRequestId: sampleClearance.id,
          departmentId: departments[code].id,
          status: 'APPROVED',
          duesAmount: 0.0,
          duesPaid: true,
          remarks: 'Satisfied all departmental clearance criteria. No pending items.',
          actionDate: new Date(),
          officerId: code === 'LIBRARY' ? libraryOfficer.id : (code === 'BURSAR' ? bursarOfficer.id : null)
        }
      });
    }

    // Seed a payment for Alex
    await prisma.payment.create({
      data: {
        studentId: student1.id,
        clearanceRequestId: sampleClearance.id,
        departmentId: departments['BURSAR'].id,
        amount: 150.0,
        reference: 'PAY-CPCS-GRAD-88102',
        purpose: 'Graduation Clearance & Certificate Processing Fee',
        status: 'SUCCESS'
      }
    });
  }

  // 6. Seed an In-Progress Clearance for Clara
  let inProgressClearance = await prisma.clearanceRequest.findFirst({
    where: { studentId: student2.id, status: 'IN_PROGRESS' }
  });

  if (!inProgressClearance) {
    inProgressClearance = await prisma.clearanceRequest.create({
      data: {
        studentId: student2.id,
        academicSession: '2025/2026',
        clearanceType: 'GRADUATION',
        status: 'IN_PROGRESS'
      }
    });

    for (const code of Object.keys(departments)) {
      const isBursar = code === 'BURSAR';
      const isLibrary = code === 'LIBRARY';
      await prisma.departmentApproval.create({
        data: {
          clearanceRequestId: inProgressClearance.id,
          departmentId: departments[code].id,
          status: isLibrary ? 'APPROVED' : 'PENDING',
          duesAmount: isBursar ? 120.0 : 0.0,
          duesPaid: isBursar ? false : true,
          remarks: isLibrary ? 'All borrowed library items returned in good condition.' : (isBursar ? 'Graduation fee balance pending.' : null),
          actionDate: isLibrary ? new Date() : null,
          officerId: isLibrary ? libraryOfficer.id : null
        }
      });
    }
  }

  console.log('✓ Seeded Sample Clearance Requests & Audit Data.');
  console.log('====================================================');
  console.log('Demo Credentials:');
  console.log('Admin:    admin@cpcs.edu    / admin123');
  console.log('Library:  library@cpcs.edu  / officer123');
  console.log('Bursar:   bursar@cpcs.edu   / officer123');
  console.log('Hostel:   hostel@cpcs.edu   / officer123');
  console.log('Student:  student@cpcs.edu  / student123 (Has cleared certificate: CPCS-CERT-773921)');
  console.log('Student:  clara@cpcs.edu    / student123 (Has in-progress clearance with pending dues)');
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

