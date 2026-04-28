import type { Translations } from '../zh'

export const adminFeedback: Translations['adminFeedback'] = {
  // Stats labels
  statsAll: 'All',
  statsPending: 'Pending',
  statsProcessing: 'Processing',
  statsResolved: 'Resolved',
  statsClosed: 'Closed',

  // Status labels
  statusPending: 'Pending',
  statusProcessing: 'Processing',
  statusResolved: 'Resolved',
  statusClosed: 'Closed',

  // Type labels
  typeBug: 'Bug',
  typeFeature: 'Feature Request',
  typeImprovement: 'Improvement',
  typeOther: 'Other',

  // Priority labels
  priorityHigh: 'High',
  priorityMedium: 'Medium',
  priorityLow: 'Low',

  // Filter options
  filterAllStatus: 'All Statuses',
  filterAllType: 'All Types',

  // Search
  searchPlaceholder: 'Search feedback...',

  // Refresh
  refreshTitle: 'Refresh',

  // Empty state
  noFeedback: 'No feedback yet',

  // Pagination
  pageIndicator: 'Page {page}',

  // Confirm
  confirmDelete: 'Are you sure you want to delete this feedback?',

  // Detail modal
  detailTitle: 'Feedback Details',
  priorityLabel: 'Priority',
  submitter: 'Submitter',
  submitTime: 'Submitted at',
  category: 'Category',
  adminReply: 'Admin Reply',
  replyLabel: 'Reply',
  replyPlaceholder: 'Enter your reply...',
  markProcessing: 'Mark as Processing',
  closeFeedback: 'Close',
  cancel: 'Cancel',
  submitting: 'Submitting...',
  replyAndResolve: 'Reply & Resolve',
}
