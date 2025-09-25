# Beta Feedback System

A comprehensive feedback collection system for tracking user issues, bugs, and feature requests during the beta phase.

## Features

### User-Facing Features
- **Floating Feedback Button**: Bottom-right corner with beta indicator (β)
- **Interactive Modal**: Clean, user-friendly form for submitting feedback
- **Feedback Types**: Bug reports, issues, feature requests, and other feedback
- **Priority Levels**: Low, Medium, High priority selection
- **Auto-capture**: Automatically includes system information (URL, browser, timestamp, user info)
- **Dark Mode Support**: Fully compatible with the app's dark theme

### Admin Features
- **Feedback Dashboard**: View all submitted feedback with filtering and sorting
- **Status Management**: Update feedback status (Open, In Progress, Resolved, Closed)
- **Admin Notes**: Add internal notes and comments
- **Statistics**: Overview of feedback trends and metrics
- **Priority Filtering**: Sort by priority levels for efficient triage

## Components

### BetaFeedback.tsx
- Main feedback collection component
- Floating button with beta indicator
- Modal form with validation
- Auto-submission to API

### FeedbackAdmin.tsx
- Admin dashboard for managing feedback
- Statistics and analytics
- Status updates and note management
- Admin-only access control

## API Endpoints

### POST /api/feedback
Submit new feedback
```json
{
  "type": "bug|issue|feature|other",
  "priority": "low|medium|high",
  "title": "Brief description",
  "description": "Detailed information",
  "userAgent": "Browser info",
  "url": "Page URL",
  "userId": "User ID",
  "userEmail": "User email",
  "userName": "User name"
}
```

### GET /api/feedback
Retrieve all feedback (admin only)
- Returns paginated list of feedback
- Includes filtering and sorting options

### PATCH /api/feedback/:id
Update feedback status (admin only)
```json
{
  "status": "open|in_progress|resolved|closed",
  "adminNotes": "Internal notes"
}
```

### GET /api/feedback/stats
Get feedback statistics (admin only)
- Total feedback count
- Recent feedback (last 7 days)
- Breakdown by type, priority, and status

## Data Storage

**Database Integration:**
- **MongoDB Collection**: All feedback is stored in the `feedback` collection
- **Indexed Fields**: Optimized queries on status, priority, type, and timestamps
- **User Association**: Linked to user accounts for better tracking
- **Audit Trail**: Complete history with timestamps and admin notes

**Email Notifications:**
- **High Priority Alerts**: Automatic email to `revotechSB@gmail.com` for high-priority feedback
- **Rich HTML Emails**: Formatted notifications with all relevant details
- **Email Tracking**: Database tracks whether emails were sent successfully
- **Fallback Handling**: System continues to work even if email fails

## Usage

### For Users
1. Click the floating feedback button (bottom-right)
2. Select feedback type and priority
3. Fill in title and description
4. Submit feedback

### For Admins
1. Access admin dashboard
2. View all feedback with filtering
3. Update status and add notes
4. Monitor statistics and trends

## Customization

### Styling
- Fully customizable with Tailwind CSS
- Dark mode support
- Responsive design
- Consistent with app theme

### Configuration
- Feedback types can be modified in the component
- Priority levels are configurable
- Auto-captured system information is customizable

## Security

- Authentication required for all endpoints
- Admin-only access for management features
- Input validation and sanitization
- Rate limiting on submission endpoints

## Future Enhancements

- Email notifications for admins
- User notification when feedback is resolved
- File attachments for bug reports
- Screenshot capture functionality
- Integration with external support systems
- Advanced analytics and reporting
- Feedback categorization
- Automated triage based on keywords

## Testing

### Email System Test
```bash
# Test email notifications
node server/scripts/testFeedbackEmail.js
```

This will:
- Verify email service connection
- Send a test high-priority notification
- Confirm email delivery to `revotechSB@gmail.com`

### Database Verification
```bash
# Check feedback collection
mongo your-database-name
db.feedback.find().sort({createdAt: -1}).limit(5)
```

## Monitoring

The system logs all feedback submissions with:
- User information
- Timestamp
- Priority level
- Feedback type
- System information
- Email delivery status

Monitor server logs for feedback activity and system health:
- `🔍 [BETA FEEDBACK]` - General feedback operations
- `📧 [BETA FEEDBACK]` - Email notification status
- `❌ [BETA FEEDBACK]` - Error conditions
