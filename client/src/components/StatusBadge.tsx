/*
 * StatusBadge.tsx
 * Reusable pill component that renders a styled badge for any SubmissionStatus
 * value, mapping enum keys to human-readable labels and CSS class names defined
 * in index.css (e.g. badge-approved, badge-rejected).
 */
import type { SubmissionStatus } from '../types';

const labels: Record<SubmissionStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  QUERY_RAISED: 'Query Raised',
  RESUBMITTED: 'Resubmitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export default function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      {labels[status] || status}
    </span>
  );
}
