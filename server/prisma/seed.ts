import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data...');

  // Seed admin
  const adminHash = await argon2.hash('Admin@1234');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.local' },
    update: {},
    create: {
      name: 'Demo Admin',
      email: 'admin@demo.local',
      mobile: '9000000001',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  // Seed demo users
  const userHash = await argon2.hash('User@1234');

  const user1 = await prisma.user.upsert({
    where: { email: 'demo.user1@example.local' },
    update: {},
    create: {
      name: 'Rajesh Demo',
      email: 'demo.user1@example.local',
      mobile: '9000000002',
      passwordHash: userHash,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'demo.user2@example.local' },
    update: {},
    create: {
      name: 'Priya Demo',
      email: 'demo.user2@example.local',
      mobile: '9000000003',
      passwordHash: userHash,
    },
  });

  // Seed sample submission (APPROVED)
  const existingApproved = await prisma.submission.findFirst({
    where: { userId: user1.id, status: 'APPROVED' },
  });

  if (!existingApproved) {
    const sub1 = await prisma.submission.create({
      data: {
        userId: user1.id,
        referenceNumber: 'DEMO-DIR12-2026-000001',
        formType: 'DIR-12',
        status: 'APPROVED',
        currentStep: 8,
        submittedAt: new Date('2026-08-01T10:00:00Z'),
      },
    });

    await prisma.company.create({
      data: {
        submissionId: sub1.id,
        cin: 'U12345MH2020PTC123456',
        companyName: 'DEMO TECH SOLUTIONS PRIVATE LIMITED',
        registeredOfficeAddress: '101, Demo Tower, Bandra Kurla Complex',
        email: 'contact@demotechsolutions.local',
        state: 'Maharashtra',
        district: 'Mumbai',
        city: 'Mumbai',
        pinCode: '400051',
      },
    });

    await prisma.director.create({
      data: {
        submissionId: sub1.id,
        purposeOfFiling: 'APPOINTMENT',
        din: '00000001',
        name: 'DEMO DIRECTOR ONE',
        fatherName: 'DEMO FATHER NAME',
        residentialAddress: '5, Demo Street, Mumbai, Maharashtra 400001',
        nationality: 'India',
        dateOfBirth: new Date('1980-06-15'),
        gender: 'Male',
        email: 'director1@demotechsolutions.local',
        designation: 'ADDITIONAL_DIRECTOR',
        appointmentDate: new Date('2026-07-01'),
        category: 'PROMOTER',
        directorType: 'EXECUTIVE_DIRECTOR',
      },
    });

    await prisma.statusHistory.createMany({
      data: [
        {
          submissionId: sub1.id,
          oldStatus: null,
          newStatus: 'DRAFT',
          changedBy: admin.id,
          comment: 'Initial draft',
          createdAt: new Date('2026-07-25'),
        },
        {
          submissionId: sub1.id,
          oldStatus: 'DRAFT',
          newStatus: 'SUBMITTED',
          changedBy: user1.id,
          createdAt: new Date('2026-08-01'),
        },
        {
          submissionId: sub1.id,
          oldStatus: 'SUBMITTED',
          newStatus: 'UNDER_REVIEW',
          changedBy: admin.id,
          createdAt: new Date('2026-08-02'),
        },
        {
          submissionId: sub1.id,
          oldStatus: 'UNDER_REVIEW',
          newStatus: 'APPROVED',
          changedBy: admin.id,
          comment: 'All documents verified',
          createdAt: new Date('2026-08-05'),
        },
      ],
    });
  }

  // Seed UNDER_REVIEW submission
  const existingUR = await prisma.submission.findFirst({
    where: { userId: user2.id, status: 'UNDER_REVIEW' },
  });

  if (!existingUR) {
    const sub2 = await prisma.submission.create({
      data: {
        userId: user2.id,
        referenceNumber: 'DEMO-DIR12-2026-000002',
        formType: 'DIR-12',
        status: 'UNDER_REVIEW',
        currentStep: 8,
        submittedAt: new Date('2026-08-10T14:00:00Z'),
      },
    });

    await prisma.company.create({
      data: {
        submissionId: sub2.id,
        cin: 'U67890DL2022PTC654321',
        companyName: 'SAMPLE VENTURES PRIVATE LIMITED',
        registeredOfficeAddress: '22, Sample Lane, Connaught Place',
        email: 'hello@sampleventures.local',
        state: 'Delhi',
        district: 'New Delhi',
        city: 'New Delhi',
        pinCode: '110001',
      },
    });

    await prisma.director.createMany({
      data: [
        {
          submissionId: sub2.id,
          purposeOfFiling: 'APPOINTMENT',
          din: '00000002',
          name: 'DEMO DIRECTOR TWO',
          fatherName: 'DEMO FATHER TWO',
          residentialAddress: '12, Sample Nagar, Delhi 110009',
          nationality: 'India',
          dateOfBirth: new Date('1975-03-22'),
          gender: 'Female',
          email: 'director2@sampleventures.local',
          designation: 'ADDITIONAL_DIRECTOR',
          appointmentDate: new Date('2026-08-01'),
          category: 'PROMOTER',
          directorType: 'EXECUTIVE_DIRECTOR',
        },
        {
          submissionId: sub2.id,
          purposeOfFiling: 'APPOINTMENT',
          din: '00000003',
          name: 'DEMO DIRECTOR THREE',
          fatherName: 'DEMO FATHER THREE',
          residentialAddress: '88, Sample Colony, Delhi 110010',
          nationality: 'India',
          dateOfBirth: new Date('1982-11-07'),
          gender: 'Male',
          email: 'director3@sampleventures.local',
          designation: 'ADDITIONAL_DIRECTOR',
          appointmentDate: new Date('2026-08-01'),
          category: 'PROFESSIONAL',
          directorType: 'NON_EXECUTIVE_DIRECTOR',
        },
      ],
    });
  }

  // Seed DRAFT for user1
  const existingDraft = await prisma.submission.findFirst({
    where: { userId: user1.id, status: 'DRAFT' },
  });

  if (!existingDraft) {
    const sub3 = await prisma.submission.create({
      data: {
        userId: user1.id,
        formType: 'DIR-12',
        status: 'DRAFT',
        currentStep: 2,
      },
    });

    await prisma.company.create({
      data: {
        submissionId: sub3.id,
        cin: 'U11111GJ2024PTC999001',
        companyName: 'NEW STARTUP INDIA PRIVATE LIMITED',
        registeredOfficeAddress: 'Plot 5, GIFT City, Gandhinagar',
        email: 'info@newstartupindia.local',
        state: 'Gujarat',
        district: 'Gandhinagar',
        city: 'Gandhinagar',
        pinCode: '382355',
      },
    });
  }

  // Audit log seed
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'USER_REGISTERED',
        description: 'Admin account initialized',
        createdAt: new Date('2026-07-01'),
      },
      {
        userId: user1.id,
        action: 'USER_REGISTERED',
        description: 'Demo user 1 registered',
        createdAt: new Date('2026-07-15'),
      },
      {
        userId: user2.id,
        action: 'USER_REGISTERED',
        description: 'Demo user 2 registered',
        createdAt: new Date('2026-07-18'),
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed complete.');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Admin   → admin@demo.local        / Admin@1234');
  console.log('  User 1  → demo.user1@example.local / User@1234');
  console.log('  User 2  → demo.user2@example.local / User@1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
