# SalesBuddy Admin Panel

A comprehensive Python GUI admin panel for managing the SalesBuddy database and application.

## Features

### 🏠 Dashboard
- Real-time statistics overview
- User, company, and conversation counts
- Recent activity monitoring
- Revenue tracking (MTD)

### 👥 User Management
- View all users with detailed information
- Search and filter users by role, company, etc.
- View detailed user profiles with conversation history
- Edit user information and permissions
- Delete users (with confirmation)
- Track user subscription status and usage

### 🏢 Company Management
- View all companies and their details
- Search companies by name or industry
- View company user lists and teams
- Manage company subscriptions
- Edit company information

### 💬 Conversation Management
- View all conversations with filtering
- Date range filtering for conversations
- View detailed conversation content
- Export conversation data to JSON
- Track conversation ratings and analytics

### 📊 Analytics (Coming Soon)
- Advanced reporting and analytics
- User engagement metrics
- Revenue analytics
- Performance insights

### ⚙️ Settings
- Database connection management
- Application configuration
- Connection testing and reconnection

## Installation

1. **Install Python Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Setup:**
   - Ensure your `.env` file contains the `MONGODB_URI`
   - The admin panel will automatically try to connect using the URI from your environment

3. **Run the Admin Panel:**
   ```bash
   python admin_panel.py
   ```

## Database Connection

The admin panel automatically tries to connect to MongoDB using:
1. `MONGODB_URI` environment variable
2. `.env` file in the project root
3. Manual connection through the Settings tab

## Usage

### Starting the Application
1. Run `python admin_panel.py`
2. The application will attempt to connect to your MongoDB database
3. If successful, you'll see "Connected to MongoDB" in the status bar
4. If connection fails, use the Settings tab to configure the connection

### Managing Users
1. Go to the **Users** tab
2. Use the search box to find specific users
3. Use filter buttons to view users by role (All, Admins, Company Users, Individual)
4. Double-click a user or select and click "View Details" to see full information
5. Use action buttons to edit or delete users

### Managing Companies
1. Go to the **Companies** tab
2. Search companies by name or industry
3. View company details including user lists and subscription information
4. Manage company users and teams

### Managing Conversations
1. Go to the **Conversations** tab
2. Set date range filters to view conversations from specific periods
3. Click "Apply Filter" to update the view
4. Double-click conversations to view details
5. Use "Export Data" to export conversations to JSON

### Dashboard Overview
1. The **Dashboard** tab shows key statistics
2. Click "Refresh Dashboard" to update all statistics
3. View recent activity including new users, companies, and conversations

## Security Features

- **Confirmation Dialogs:** All destructive actions (delete user, etc.) require confirmation
- **Read-Only by Default:** The panel is primarily for viewing and monitoring
- **Safe Operations:** Database operations are wrapped in try-catch blocks
- **Connection Validation:** Database connections are tested before operations

## File Structure

```
├── admin_panel.py          # Main application file
├── admin_methods.py        # Additional methods and functionality
├── requirements.txt        # Python dependencies
└── ADMIN_PANEL_README.md   # This documentation
```

## Dependencies

- **pymongo**: MongoDB database connectivity
- **tkinter**: GUI framework (built into Python)
- **python-dotenv**: Environment variable management
- **matplotlib**: For future analytics features
- **pandas**: For data processing and export

## Troubleshooting

### Connection Issues
- Verify your MongoDB URI is correct in the `.env` file
- Ensure your MongoDB server is running and accessible
- Check firewall settings if connecting to a remote database
- Use the "Test Connection" button in Settings to verify connectivity

### Performance Issues
- The panel loads data in background threads to prevent UI freezing
- Large datasets may take time to load - be patient
- Use filters to reduce the amount of data displayed

### Data Not Updating
- Click the "Refresh" button on each tab to reload data
- Check the status bar for connection status
- Ensure you have proper database permissions

## Future Enhancements

- **Advanced Analytics:** Charts and graphs for user engagement
- **Bulk Operations:** Mass user updates and company management
- **Export Features:** CSV/Excel export capabilities
- **Real-time Updates:** Live data refresh without manual refresh
- **User Permissions:** Role-based access control for the admin panel
- **Audit Logging:** Track all admin panel actions
- **Advanced Search:** Full-text search across all data
- **Report Generation:** Automated report creation and scheduling

## Support

For issues or questions about the admin panel:
1. Check the troubleshooting section above
2. Verify your database connection and permissions
3. Ensure all dependencies are properly installed
4. Contact the development team with specific error messages

## License

This admin panel is part of the SalesBuddy project and follows the same licensing terms.
