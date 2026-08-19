export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
  lastLoginAt: string | null;
}

export type SubmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'QUERY_RAISED'
  | 'RESUBMITTED'
  | 'APPROVED'
  | 'REJECTED';

export interface Company {
  id: string;
  cin: string;
  companyName: string;
  registeredOfficeAddress: string;
  email: string;
  country: string;
  state: string;
  district: string;
  city: string;
  pinCode: string;
  formLanguage: 'ENGLISH' | 'HINDI';
}

export type PurposeOfFiling = 'APPOINTMENT' | 'CESSATION' | 'CHANGE_IN_DESIGNATION';
export type DirectorDesignation =
  | 'DIRECTOR'
  | 'MANAGING_DIRECTOR'
  | 'ALTERNATE_DIRECTOR'
  | 'ADDITIONAL_DIRECTOR'
  | 'CASUAL_VACANCY_DIRECTOR'
  | 'NOMINEE_DIRECTOR'
  | 'WHOLE_TIME_DIRECTOR';
export type DirectorCategory = 'PROMOTER' | 'PROFESSIONAL' | 'INDEPENDENT' | 'SMALL_SHAREHOLDER';
export type DirectorType = 'CHAIRMAN' | 'EXECUTIVE_DIRECTOR' | 'NON_EXECUTIVE_DIRECTOR';

export interface Director {
  id: string;
  submissionId: string;
  purposeOfFiling: PurposeOfFiling;
  din: string;
  name: string;
  fatherName: string;
  residentialAddress: string;
  nationality: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  designation: DirectorDesignation;
  appointmentDate: string | null;
  category: DirectorCategory;
  directorType: DirectorType | null;
  alternateDirectorDin: string | null;
  alternateDirectorName: string | null;
  numberOfEntities: number;
  cessationDate: string | null;
  cessationReason: string | null;
}

export type KMPDesignation = 'MANAGER' | 'COMPANY_SECRETARY' | 'CEO' | 'CFO';

export interface KMP {
  id: string;
  submissionId: string;
  din?: string;
  pan?: string;
  membershipNumber?: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  fatherFirstName?: string;
  fatherMiddleName?: string;
  fatherLastName?: string;
  address: string;
  dateOfBirth?: string;
  designation: KMPDesignation;
  appointmentOrCessationDate?: string;
  mobile?: string;
  email?: string;
  purposeOfFiling: PurposeOfFiling;
}

export interface Attachment {
  id: string;
  submissionId: string;
  originalFilename: string;
  storedFilename: string;
  mimeType: string;
  size: number;
  path: string;
  attachmentType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface StatusHistoryEntry {
  id: string;
  submissionId: string;
  oldStatus: SubmissionStatus | null;
  newStatus: SubmissionStatus;
  changedBy: string;
  comment: string | null;
  createdAt: string;
  user?: { name: string };
}

export interface Submission {
  id: string;
  userId: string;
  referenceNumber: string | null;
  formType: string;
  status: SubmissionStatus;
  currentStep: number;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  company?: Company | null;
  directors?: Director[];
  kmps?: KMP[];
  attachments?: Attachment[];
  statusHistory?: StatusHistoryEntry[];
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface AuditLog {
  id: string;
  userId?: string;
  submissionId?: string;
  action: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: { name: string; email: string };
  submission?: { referenceNumber: string | null };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}
