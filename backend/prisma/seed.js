const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('🌱 Seeding Metropolitan University (Sylhet) Advanced Financial & Academic Portal');
  console.log('================================================================');

  // 1. Seed Academic Departments & Administrative Units
  const departmentsData = [
    { code: 'CSE', name: 'Department of Computer Science & Engineering', schoolName: 'School of Science & Technology', isAcademic: true, description: 'B.Sc. in CSE, M.Sc. in CSE' },
    { code: 'SWE', name: 'Department of Software Engineering', schoolName: 'School of Science & Technology', isAcademic: true, description: 'B.Sc. in Software Engineering' },
    { code: 'EEE', name: 'Department of Electrical & Electronic Engineering', schoolName: 'School of Science & Technology', isAcademic: true, description: 'B.Sc. in EEE' },
    { code: 'BBA', name: 'Department of Business Administration', schoolName: 'School of Business & Economics', isAcademic: true, description: 'BBA, MBA programs' },
    { code: 'LAW', name: 'Department of Law & Justice', schoolName: 'School of Law', isAcademic: true, description: 'LL.B. (Hons), LL.M.' },
    { code: 'ENG', name: 'Department of English', schoolName: 'School of Humanities & Social Sciences', isAcademic: true, description: 'B.A. (Hons) in English, M.A.' },
    { code: 'ECO', name: 'Department of Economics', schoolName: 'School of Humanities & Social Sciences', isAcademic: true, description: 'B.S.S. in Economics' },
    
    // Administrative Units
    { code: 'ACCOUNTS', name: 'Accounts & Finance Section', schoolName: 'Central Administration', isAcademic: false, description: 'NRBC Bank Campus Branch (Account: 015954000000001)' },
    { code: 'LIBRARY', name: 'Prof. M. Habibur Rahman Central Library', schoolName: 'Library Services', isAcademic: false, description: 'Book lending, digital catalog, overdue liability check' }
  ];

  const departments = {};
  for (const dept of departmentsData) {
    const record = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, schoolName: dept.schoolName, isAcademic: dept.isAcademic, description: dept.description },
      create: dept
    });
    departments[dept.code] = record;
  }
  console.log(`✓ Seeded ${Object.keys(departments).length} Metropolitan University departments.`);

  // 2. Seed Academic Programmes (Undergraduate & Graduate)
  const programmesData = [
    // Undergraduate
    { code: 'BSC_CSE', departmentId: departments['CSE'].id, title: 'B.Sc. in Computer Science & Engineering', degreeLevel: 'UNDERGRADUATE', totalCredits: 144, monthlyFee: 8000 },
    { code: 'BSC_SWE', departmentId: departments['SWE'].id, title: 'B.Sc. in Software Engineering', degreeLevel: 'UNDERGRADUATE', totalCredits: 144, monthlyFee: 8000 },
    { code: 'BSC_DATA_SCIENCE', departmentId: departments['CSE'].id, title: 'B.Sc. in Data Science', degreeLevel: 'UNDERGRADUATE', totalCredits: 144, monthlyFee: 8000 },
    { code: 'BSC_EEE', departmentId: departments['EEE'].id, title: 'B.Sc. in Electrical & Electronic Engineering', degreeLevel: 'UNDERGRADUATE', totalCredits: 144, monthlyFee: 7000 },
    { code: 'BBA', departmentId: departments['BBA'].id, title: 'Bachelor of Business Administration', degreeLevel: 'UNDERGRADUATE', totalCredits: 130, monthlyFee: 7000 },
    { code: 'BSS_ECO', departmentId: departments['ECO'].id, title: 'B.S.S. in Economics', degreeLevel: 'UNDERGRADUATE', totalCredits: 120, monthlyFee: 5000 },
    { code: 'BA_ENG', departmentId: departments['ENG'].id, title: 'B.A. (Hons) in English', degreeLevel: 'UNDERGRADUATE', totalCredits: 120, monthlyFee: 6000 },
    { code: 'LLB', departmentId: departments['LAW'].id, title: 'Bachelor of Laws (LL.B. Hons)', degreeLevel: 'UNDERGRADUATE', totalCredits: 136, monthlyFee: 8000 },

    // Graduate
    { code: 'MBA_GEN', departmentId: departments['BBA'].id, title: 'Master of Business Administration (General)', degreeLevel: 'GRADUATE', totalCredits: 60, monthlyFee: 4000 },
    { code: 'MBA_REG', departmentId: departments['BBA'].id, title: 'Master of Business Administration (Regular)', degreeLevel: 'GRADUATE', totalCredits: 60, monthlyFee: 4000 },
    { code: 'MA_ENG_PRELIM', departmentId: departments['ENG'].id, title: 'M.A. in English (Preliminary)', degreeLevel: 'GRADUATE', totalCredits: 36, monthlyFee: 4000 },
    { code: 'MA_ENG_FINAL', departmentId: departments['ENG'].id, title: 'M.A. in English (Final)', degreeLevel: 'GRADUATE', totalCredits: 36, monthlyFee: 4000 },
    { code: 'LLB_PRELIM', departmentId: departments['LAW'].id, title: 'LL.B. Preliminary', degreeLevel: 'GRADUATE', totalCredits: 36, monthlyFee: 4000 },
    { code: 'LLB_FINAL', departmentId: departments['LAW'].id, title: 'LL.B. Final', degreeLevel: 'GRADUATE', totalCredits: 36, monthlyFee: 4000 },
    { code: 'LLM_1YR', departmentId: departments['LAW'].id, title: 'Master of Laws (LL.M. 1 Year)', degreeLevel: 'GRADUATE', totalCredits: 36, monthlyFee: 4000 },
    { code: 'LLM_2YR', departmentId: departments['LAW'].id, title: 'Master of Laws (LL.M. 2 Year)', degreeLevel: 'GRADUATE', totalCredits: 60, monthlyFee: 4000 },
    { code: 'MSS_ECO', departmentId: departments['ECO'].id, title: 'M.S.S. in Economics', degreeLevel: 'GRADUATE', totalCredits: 36, monthlyFee: 4000 },
    { code: 'MSC_MIS', departmentId: departments['BBA'].id, title: 'M.Sc. in Management Information Systems', degreeLevel: 'GRADUATE', totalCredits: 36, monthlyFee: 4000 },
    { code: 'CSE_DIPLOMA', departmentId: departments['CSE'].id, title: 'B.Sc. in CSE (for Diploma Holders)', degreeLevel: 'UNDERGRADUATE', totalCredits: 110, monthlyFee: 5000 },
    { code: 'EEE_DIPLOMA', departmentId: departments['EEE'].id, title: 'B.Sc. in EEE (for Diploma Holders)', degreeLevel: 'UNDERGRADUATE', totalCredits: 110, monthlyFee: 5000 }
  ];

  const programmes = {};
  for (const prog of programmesData) {
    const record = await prisma.programme.upsert({
      where: { code: prog.code },
      update: { title: prog.title, totalCredits: prog.totalCredits, degreeLevel: prog.degreeLevel },
      create: {
        code: prog.code,
        departmentId: prog.departmentId,
        title: prog.title,
        degreeLevel: prog.degreeLevel,
        totalCredits: prog.totalCredits
      }
    });
    programmes[prog.code] = record;

    // Seed ProgrammeFeeStructure from official Metropolitan University Fee page
    await prisma.programmeFeeStructure.upsert({
      where: { programmeId_effectiveYear: { programmeId: record.id, effectiveYear: 2026 } },
      update: {
        monthlyCreditFeeBdt: prog.monthlyFee,
        admissionFeeBdt: 25000.0,
        registrationFeeBdt: 15000.0,
        bnccFeeBdt: 500.0,
        activitiesFeeBdt: 2000.0,
        admissionFormFeeBdt: 1000.0
      },
      create: {
        programmeId: record.id,
        admissionFeeBdt: 25000.0,
        registrationFeeBdt: 15000.0,
        bnccFeeBdt: 500.0,
        activitiesFeeBdt: 2000.0,
        monthlyCreditFeeBdt: prog.monthlyFee,
        admissionFormFeeBdt: 1000.0,
        effectiveYear: 2026,
        sourceUrl: 'https://metrouni.edu.bd/sites/admission/programme-fee-structure',
        verificationDate: new Date()
      }
    });
  }
  console.log(`✓ Seeded ${Object.keys(programmes).length} Programmes with Published Fee Structures.`);

  // 3. Seed Academic Terms
  const spring2026 = await prisma.academicTerm.upsert({
    where: { code: 'SPRING_2026' },
    update: { isCurrent: true },
    create: {
      code: 'SPRING_2026',
      title: 'Spring Term 2026',
      startDate: new Date('2026-01-10'),
      endDate: new Date('2026-05-30'),
      isCurrent: true
    }
  });

  const autumn2025 = await prisma.academicTerm.upsert({
    where: { code: 'AUTUMN_2025' },
    update: { isCurrent: false },
    create: {
      code: 'AUTUMN_2025',
      title: 'Autumn Term 2025',
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-12-20'),
      isCurrent: false
    }
  });
  console.log('✓ Seeded Academic Terms (Spring 2026 Active).');

  // 4. Seed Fine Rules
  await prisma.fineRule.upsert({
    where: { code: 'MONTHLY_TUITION_FINE' },
    update: { dueDay: 12, fineStartDay: 13, fineAmount: 10.0, calculationMethod: 'PER_DAY' },
    create: {
      code: 'MONTHLY_TUITION_FINE',
      feeCategory: 'TUITION',
      dueDay: 12,
      fineStartDay: 13,
      fineAmount: 10.0,
      calculationMethod: 'PER_DAY',
      gracePeriodDays: 0,
      isActive: true
    }
  });

  await prisma.fineRule.upsert({
    where: { code: 'SEMESTER_REG_FINE' },
    update: { dueDay: 25, fineStartDay: 26, fineAmount: 1000.0, calculationMethod: 'FIXED' },
    create: {
      code: 'SEMESTER_REG_FINE',
      feeCategory: 'SEMESTER_REG',
      dueDay: 25,
      fineStartDay: 26,
      fineAmount: 1000.0,
      calculationMethod: 'FIXED',
      gracePeriodDays: 0,
      isActive: true
    }
  });
  console.log('✓ Seeded Automated Fine Policies (Monthly 12th + Tk. 10/day; Semester 25th + Tk. 1,000 fixed).');

  // 5. Seed Courses for CSE
  const cseCourses = [
    { code: 'CSE-311', title: 'Compiler Design & Construction', credits: 3.0, semester: 6 },
    { code: 'CSE-312', title: 'Compiler Design Laboratory', credits: 1.5, semester: 6 },
    { code: 'CSE-313', title: 'Artificial Intelligence & Neural Networks', credits: 3.0, semester: 6 },
    { code: 'CSE-314', title: 'Computer Networks & Distributed Systems', credits: 3.0, semester: 6 },
    { code: 'CSE-315', title: 'Software Engineering & Architecture', credits: 3.0, semester: 6 },
    { code: 'CSE-316', title: 'Mobile Application Development Lab', credits: 1.5, semester: 6 }
  ];

  const courses = {};
  for (const c of cseCourses) {
    const record = await prisma.course.upsert({
      where: { code: c.code },
      update: { title: c.title, credits: c.credits, semester: c.semester },
      create: {
        code: c.code,
        title: c.title,
        credits: c.credits,
        departmentId: departments['CSE'].id,
        semester: c.semester
      }
    });
    courses[c.code] = record;
  }
  console.log(`✓ Seeded ${Object.keys(courses).length} Academic Courses for CSE.`);

  // 6. Seed Examination Session
  const springExamSession = await prisma.examinationSession.upsert({
    where: { code: 'SPRING_2026_FINAL' },
    update: {},
    create: {
      code: 'SPRING_2026_FINAL',
      name: 'Semester Final Examination — Spring 2026',
      academicTermId: spring2026.id,
      startDate: new Date('2026-05-15'),
      endDate: new Date('2026-05-30'),
      isPublished: true
    }
  });
  console.log('✓ Seeded Examination Session (Spring 2026 Final).');

  // 7. Seed Clearance Workflow (3 Stages: Accounts, Library, Head of CSE)
  const clearanceTypesData = [
    { code: 'CONVOCATION', title: 'Final Graduation & Convocation Clearance', description: 'Institutional clearance across Accounts & Finance, Central Library, and Department Head', isFeeRequired: true, defaultFeeBdt: 12000 }
  ];

  const clearanceTypes = {};
  for (const ct of clearanceTypesData) {
    const record = await prisma.clearanceType.upsert({
      where: { code: ct.code },
      update: { title: ct.title, description: ct.description },
      create: ct
    });
    clearanceTypes[ct.code] = record;
  }

  const convocationWorkflow = await prisma.workflowTemplate.upsert({
    where: { id: 'wf-tmpl-convocation' },
    update: {},
    create: {
      id: 'wf-tmpl-convocation',
      clearanceTypeId: clearanceTypes['CONVOCATION'].id,
      name: 'Standard Convocation Clearance Pipeline',
      isActive: true
    }
  });

  const convocationVersion = await prisma.workflowVersion.upsert({
    where: { templateId_versionNumber: { templateId: convocationWorkflow.id, versionNumber: 1 } },
    update: {},
    create: {
      templateId: convocationWorkflow.id,
      versionNumber: 1,
      isPublished: true
    }
  });

  const convocationStagesData = [
    { sequenceOrder: 1, departmentCode: 'ACCOUNTS', stageName: 'Accounts & Finance Dues Settlement' },
    { sequenceOrder: 2, departmentCode: 'LIBRARY', stageName: 'Prof. M. Habibur Rahman Central Library Clearance' },
    { sequenceOrder: 3, departmentCode: 'CSE', stageName: 'Department Head Academic & Thesis Sign-Off' }
  ];

  for (const stage of convocationStagesData) {
    await prisma.workflowStage.create({
      data: {
        workflowVersionId: convocationVersion.id,
        sequenceOrder: stage.sequenceOrder,
        departmentCode: stage.departmentCode,
        stageName: stage.stageName,
        isConditional: false
      }
    });
  }
  console.log('✓ Seeded 3-Stage Clearance Workflow (Accounts, Library, Dept Head).');

  // Passwords
  const adminPass = await bcrypt.hash('admin123', 10);
  const officerPass = await bcrypt.hash('officer123', 10);
  const studentPass = await bcrypt.hash('student123', 10);

  // 8. Seed Administrative Users
  await prisma.user.upsert({
    where: { email: 'admin@metrouni.edu.bd' },
    update: {},
    create: {
      email: 'admin@metrouni.edu.bd',
      passwordHash: adminPass,
      fullName: 'Super Administrator',
      matricOrStaffId: 'MU-STAFF-ADM-01',
      role: 'SUPER_ADMIN'
    }
  });

  await prisma.user.upsert({
    where: { email: 'accounts@metrouni.edu.bd' },
    update: {},
    create: {
      email: 'accounts@metrouni.edu.bd',
      passwordHash: officerPass,
      fullName: 'Md. Taufiqur Rahman (Senior Accounts Officer)',
      matricOrStaffId: 'MU-STAFF-ACC-01',
      role: 'ACCOUNTS_OFFICER',
      departmentId: departments['ACCOUNTS'].id,
      phoneNumber: '01757535844'
    }
  });

  await prisma.user.upsert({
    where: { email: 'library@metrouni.edu.bd' },
    update: {},
    create: {
      email: 'library@metrouni.edu.bd',
      passwordHash: officerPass,
      fullName: 'Dr. Fazlul Karim (Head Librarian)',
      matricOrStaffId: 'MU-STAFF-LIB-01',
      role: 'LIBRARY_OFFICER',
      departmentId: departments['LIBRARY'].id
    }
  });

  await prisma.user.upsert({
    where: { email: 'head.cse@metrouni.edu.bd' },
    update: {},
    create: {
      email: 'head.cse@metrouni.edu.bd',
      passwordHash: officerPass,
      fullName: 'Prof. Dr. Mahfuzur Rahman (Head of CSE)',
      matricOrStaffId: 'MU-FACULTY-CSE-01',
      role: 'DEPT_HEAD',
      departmentId: departments['CSE'].id
    }
  });
  console.log('✓ Seeded Administrative Officers (Super Admin, Accounts, Library, Head of CSE).');

  // 9. Seed Demo Students
  // Student 1: Choyon Dhor (Batch 56, CSE, 231-115-094) - Fully Cleared & Eligible
  const studentUser1 = await prisma.user.upsert({
    where: { email: 'choyon@metrouni.edu.bd' },
    update: {},
    create: {
      email: 'choyon@metrouni.edu.bd',
      passwordHash: studentPass,
      fullName: 'Choyon Dhor',
      matricOrStaffId: '231-115-094',
      role: 'STUDENT',
      departmentId: departments['CSE'].id,
      phoneNumber: '01712345678'
    }
  });

  const studentProfile1 = await prisma.studentProfile.upsert({
    where: { userId: studentUser1.id },
    update: {},
    create: {
      userId: studentUser1.id,
      studentIdNumber: '231-115-094',
      programmeId: programmes['BSC_CSE'].id,
      batchNumber: 56,
      intake: 'Spring 2022',
      admissionDate: new Date('2022-01-15'),
      currentSemester: 8,
      academicStatus: 'ACTIVE',
      cgpa: 3.82,
      guardianName: 'Manojit Dhor',
      guardianPhone: '01799887766',
      address: 'Bateshwar, Sylhet',
      tuitionWaiverPercentage: 10.0, // 10% merit waiver
      scholarshipCategory: 'MERIT'
    }
  });

  // Choyon's Semester Registration (Paid)
  await prisma.semesterRegistration.upsert({
    where: { studentId_academicTermId: { studentId: studentProfile1.id, academicTermId: spring2026.id } },
    update: {},
    create: {
      studentId: studentProfile1.id,
      academicTermId: spring2026.id,
      registrationFeeBdt: 15000.0,
      isFeePaid: true,
      paidAt: new Date('2026-01-18'),
      status: 'REGISTERED'
    }
  });

  // Choyon's Course Enrollment Document (Available)
  await prisma.courseEnrollmentDocument.upsert({
    where: { documentNumber: 'MU-CEP-2026-0094' },
    update: {},
    create: {
      documentNumber: 'MU-CEP-2026-0094',
      studentId: studentProfile1.id,
      academicTermId: spring2026.id,
      verificationStatus: 'VERIFIED',
      registrationFeePaid: true
    }
  });

  // Choyon's Examination Admit Card (Issued)
  await prisma.admitCard.upsert({
    where: { admitCardNumber: 'MU-ADM-2026-98124' },
    update: {},
    create: {
      admitCardNumber: 'MU-ADM-2026-98124',
      studentId: studentProfile1.id,
      examinationSessionId: springExamSession.id,
      examRollNumber: '231-115-094',
      financialClearanceVerified: true,
      isPublished: true,
      qrToken: 'mu_admit_tok_98124_choyon'
    }
  });

  // Student 2: Clara Oswald (Batch 57, CSE, 231-115-042) - Pending & Active Waiver
  const studentUser2 = await prisma.user.upsert({
    where: { email: 'clara@metrouni.edu.bd' },
    update: {},
    create: {
      email: 'clara@metrouni.edu.bd',
      passwordHash: studentPass,
      fullName: 'Clara Oswald',
      matricOrStaffId: '231-115-042',
      role: 'STUDENT',
      departmentId: departments['CSE'].id,
      phoneNumber: '01812345678'
    }
  });

  const studentProfile2 = await prisma.studentProfile.upsert({
    where: { userId: studentUser2.id },
    update: {},
    create: {
      userId: studentUser2.id,
      studentIdNumber: '231-115-042',
      programmeId: programmes['BSC_CSE'].id,
      batchNumber: 57,
      intake: 'Autumn 2022',
      admissionDate: new Date('2022-07-20'),
      currentSemester: 6,
      academicStatus: 'ACTIVE',
      cgpa: 3.65,
      guardianName: 'Dave Oswald',
      guardianPhone: '01899887766',
      address: 'Subidbazar, Sylhet',
      tuitionWaiverPercentage: 20.0, // 20% Vice Chancellor Scholarship
      scholarshipCategory: 'VICE_CHANCELLOR'
    }
  });

  // Clara's 20% Active Tuition Waiver
  await prisma.studentWaiver.create({
    data: {
      studentId: studentProfile2.id,
      waiverType: 'PERCENTAGE',
      waiverPercentage: 20.0,
      applicableFeeCategory: 'TUITION',
      scholarshipCategory: 'VICE_CHANCELLOR',
      reason: '20% Vice Chancellor Excellence Scholarship',
      approvalAuthority: 'Vice Chancellor Approval #VC-2026-42',
      status: 'ACTIVE'
    }
  });

  // Clara's Semester Registration (Unpaid -> Late Penalty Applies after 25th)
  await prisma.semesterRegistration.upsert({
    where: { studentId_academicTermId: { studentId: studentProfile2.id, academicTermId: spring2026.id } },
    update: {},
    create: {
      studentId: studentProfile2.id,
      academicTermId: spring2026.id,
      registrationFeeBdt: 15000.0,
      isFeePaid: false,
      fineAmountBdt: 1000.0,
      status: 'PENDING_FEE'
    }
  });

  // Clara's 4-Installment Invoice (Tuition 8000*4 = 32000, 20% waiver = 6400 discount -> 25600 net)
  const claraInvoice = await prisma.studentInvoice.upsert({
    where: { invoiceNumber: 'MU-INV-2026-0042' },
    update: {},
    create: {
      invoiceNumber: 'MU-INV-2026-0042',
      studentId: studentProfile2.id,
      academicTermId: spring2026.id,
      totalAmountBdt: 32000.0,
      waiverAmountBdt: 6400.0, // 20% waiver discount on tuition
      paidAmountBdt: 6400.0,   // 1st installment paid
      outstandingBalanceBdt: 19200.0,
      status: 'PARTIALLY_PAID'
    }
  });

  const claraInstallments = [
    { number: 1, due: new Date('2026-01-12'), amount: 6400.0, status: 'PAID' },
    { number: 2, due: new Date('2026-02-12'), amount: 6400.0, status: 'PENDING' },
    { number: 3, due: new Date('2026-03-12'), amount: 6400.0, status: 'PENDING' },
    { number: 4, due: new Date('2026-04-12'), amount: 6400.0, status: 'PENDING' }
  ];

  for (const inst of claraInstallments) {
    await prisma.installmentSchedule.create({
      data: {
        invoiceId: claraInvoice.id,
        installmentNumber: inst.number,
        dueDate: inst.due,
        amountBdt: inst.amount,
        status: inst.status
      }
    });
  }

  // Seed sample course enrollments for Clara
  for (const c of cseCourses) {
    await prisma.studentCourseEnrollment.create({
      data: {
        studentId: studentProfile2.id,
        courseId: courses[c.code].id,
        academicTermId: spring2026.id,
        status: 'ENROLLED'
      }
    });
  }

  console.log('✓ Seeded Demo Students (Choyon Dhor & Clara Oswald) with Tuition Waivers & Invoices.');
  console.log('================================================================');
  console.log('Metropolitan University Portal Credentials:');
  console.log('Super Admin:          admin@metrouni.edu.bd      / admin123');
  console.log('Accounts Officer:     accounts@metrouni.edu.bd   / officer123');
  console.log('Library Officer:      library@metrouni.edu.bd    / officer123');
  console.log('Head of CSE:          head.cse@metrouni.edu.bd   / officer123');
  console.log('Student (Cleared):    231-115-094 (choyon@metrouni.edu.bd) / student123');
  console.log('Student (20% Waiver): 231-115-042 (clara@metrouni.edu.bd)  / student123');
  console.log('================================================================');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
