"""
Additional methods for SalesBuddy Admin Panel
"""

import tkinter as tk
from tkinter import messagebox, simpledialog, scrolledtext
from datetime import datetime, timedelta
import json
import re
from bson import ObjectId
from security_module import (
    InputValidator, SecureDatabaseQueries, SecurityError, 
    SecurityAuditLogger, secure_input_wrapper
)

class AdminMethods:
    def __init__(self, admin_instance):
        self.admin = admin_instance
        
    def refresh_dashboard(self):
        """Refresh dashboard statistics"""
        if not self.admin.connected:
            return
        
        try:
            # Get statistics
            total_users = self.admin.users_collection.count_documents({})
            active_companies = self.admin.companies_collection.count_documents({'isActive': True})
            total_conversations = self.admin.conversations_collection.count_documents({})
            
            # Today's conversations
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            today_conversations = self.admin.conversations_collection.count_documents({
                'createdAt': {'$gte': today_start}
            })
            
            # Active subscriptions
            active_subscriptions = self.admin.users_collection.count_documents({
                'subscription.status': 'active'
            })
            
            # Monthly revenue (placeholder - would need Stripe integration)
            revenue_mtd = 0  # This would need to be calculated from actual payment data
            
            # Get monthly usage statistics
            current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            next_month_start = (current_month_start.replace(day=1) + timedelta(days=32)).replace(day=1)
            
            # Count conversations this month
            monthly_conversations = self.admin.conversations_collection.count_documents({
                'createdAt': {
                    '$gte': current_month_start,
                    '$lt': next_month_start
                }
            })
            
            # Get total monthly limits
            users_with_subscriptions = list(self.admin.users_collection.find({
                'subscription': {'$exists': True},
                'subscription.plan': {'$ne': None}
            }))
            
            total_monthly_limit = 0
            for user in users_with_subscriptions:
                plan = user.get('subscription', {}).get('plan', 'basic')
                plan_limits = {'free': 3, 'basic': 10, 'pro': 50, 'enterprise': 200}
                total_monthly_limit += plan_limits.get(plan, 10)
            
            # Get this week's conversations
            week_start = datetime.now() - timedelta(days=7)
            week_conversations = self.admin.conversations_collection.count_documents({
                'createdAt': {'$gte': week_start}
            })
            
            # Get average call duration
            conversations_with_duration = list(self.admin.conversations_collection.find({
                'duration': {'$exists': True, '$gt': 0}
            }, {'duration': 1}))
            
            avg_duration_minutes = 0
            if conversations_with_duration:
                total_duration = sum(conv.get('duration', 0) for conv in conversations_with_duration)
                avg_duration_seconds = total_duration / len(conversations_with_duration)
                avg_duration_minutes = round(avg_duration_seconds / 60, 1)
            
            # Update stat cards
            self.admin.stat_total_users.config(text=str(total_users))
            self.admin.stat_active_companies.config(text=str(active_companies))
            self.admin.stat_total_conversations.config(text=str(total_conversations))
            self.admin.stat_todays_conversations.config(text=str(today_conversations))
            self.admin.stat_active_subscriptions.config(text=str(active_subscriptions))
            self.admin.stat_revenue_mtd.config(text=f"${revenue_mtd}")
            
            # Update new monthly usage cards
            self.admin.stat_monthly_calls_used.config(text=f"{monthly_conversations}/{total_monthly_limit}")
            self.admin.stat_calls_this_week.config(text=str(week_conversations))
            self.admin.stat_avg_call_duration.config(text=f"{avg_duration_minutes}m")
            
            # Update recent activity
            self.update_recent_activity()
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to refresh dashboard: {str(e)}")
    
    def update_recent_activity(self):
        """Update recent activity log"""
        try:
            self.admin.activity_text.delete(1.0, tk.END)
            
            # Get recent users
            recent_users = list(self.admin.users_collection.find().sort('createdAt', -1).limit(5))
            self.admin.activity_text.insert(tk.END, "Recent Users:\n")
            for user in recent_users:
                self.admin.activity_text.insert(tk.END, 
                    f"  - {user.get('firstName', '')} {user.get('lastName', '')} ({user.get('email', '')}) - {user.get('createdAt', '').strftime('%Y-%m-%d %H:%M')}\n")
            
            # Get recent companies
            recent_companies = list(self.admin.companies_collection.find().sort('createdAt', -1).limit(3))
            self.admin.activity_text.insert(tk.END, "\nRecent Companies:\n")
            for company in recent_companies:
                self.admin.activity_text.insert(tk.END, 
                    f"  - {company.get('name', '')} ({company.get('industry', 'N/A')}) - {company.get('createdAt', '').strftime('%Y-%m-%d %H:%M')}\n")
            
            # Get recent conversations
            recent_conversations = list(self.admin.conversations_collection.find().sort('createdAt', -1).limit(5))
            self.admin.activity_text.insert(tk.END, "\nRecent Conversations:\n")
            for conv in recent_conversations:
                user = self.admin.users_collection.find_one({'_id': conv['userId']})
                user_name = f"{user.get('firstName', '')} {user.get('lastName', '')}" if user else "Unknown"
                self.admin.activity_text.insert(tk.END, 
                    f"  - {user_name}: {conv.get('title', 'Untitled')} - {conv.get('createdAt', '').strftime('%Y-%m-%d %H:%M')}\n")
            
        except Exception as e:
            self.admin.activity_text.insert(tk.END, f"Error loading recent activity: {str(e)}\n")
    
    def load_users(self):
        """Load users into the treeview"""
        if not self.admin.connected:
            return
        
        try:
            # Clear existing items
            for item in self.admin.users_tree.get_children():
                self.admin.users_tree.delete(item)
            
            # Get users with company information
            users = list(self.admin.users_collection.find())
            
            for user in users:
                # Get company name if user belongs to a company
                company_name = "Individual"
                if user.get('companyId'):
                    company = self.admin.companies_collection.find_one({'_id': user['companyId']})
                    if company:
                        company_name = company.get('name', 'Unknown Company')
                elif user.get('company'):
                    company_name = user.get('company', 'Individual')
                
                # Format last login
                last_login = user.get('lastLogin', 'Never')
                if last_login and last_login != 'Never':
                    last_login = last_login.strftime('%Y-%m-%d %H:%M')
                
                # Format created date
                created = user.get('createdAt', '').strftime('%Y-%m-%d')
                
                # Insert into treeview with full ObjectId stored in tags
                self.admin.users_tree.insert('', 'end', 
                    values=(
                        str(user['_id'])[:8] + '...',
                        f"{user.get('firstName', '')} {user.get('lastName', '')}",
                        user.get('email', ''),
                        user.get('role', 'individual'),
                        company_name,
                        user.get('subscription', {}).get('plan', 'free'),
                        user.get('subscription', {}).get('status', 'inactive'),
                        last_login,
                        created
                    ),
                    tags=(str(user['_id']),)  # Store full ObjectId as tag
                )
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load users: {str(e)}")
    
    @secure_input_wrapper
    def search_users(self, event=None):
        """Search users based on search term"""
        try:
            # Validate and sanitize search input
            raw_search_term = self.admin.user_search_var.get()
            search_term = InputValidator.validate_and_sanitize_input(
                raw_search_term, 'search', is_required=False
            ).lower()
            
            for item in self.admin.users_tree.get_children():
                values = self.admin.users_tree.item(item)['values']
                # Search in name and email
                if (search_term in values[1].lower() or 
                    search_term in values[2].lower() or 
                    search_term in values[3].lower() or
                    search_term in values[4].lower()):
                    self.admin.users_tree.reattach(item, '', 'end')
                else:
                    self.admin.users_tree.detach(item)
        except SecurityError as e:
            SecurityAuditLogger.log_security_violation(
                None, "search_users", "search_term", "input_validation", str(e)
            )
            messagebox.showerror("Security Error", "Invalid search input detected")
        except Exception as e:
            SecurityAuditLogger.log_security_violation(
                None, "search_users", "error", "unexpected_error", str(e)
            )
            messagebox.showerror("Error", f"An error occurred during search: {str(e)}")
    
    def filter_users(self, filter_type):
        """Filter users by type"""
        for item in self.admin.users_tree.get_children():
            values = self.admin.users_tree.item(item)['values']
            
            if filter_type == 'all':
                self.admin.users_tree.reattach(item, '', 'end')
            elif filter_type == 'admin':
                if 'admin' in values[3].lower():
                    self.admin.users_tree.reattach(item, '', 'end')
                else:
                    self.admin.users_tree.detach(item)
            elif filter_type == 'company':
                if values[4] != 'Individual':
                    self.admin.users_tree.reattach(item, '', 'end')
                else:
                    self.admin.users_tree.detach(item)
            elif filter_type == 'individual':
                if values[4] == 'Individual':
                    self.admin.users_tree.reattach(item, '', 'end')
                else:
                    self.admin.users_tree.detach(item)
    
    def view_user_details(self, event=None):
        """View detailed user information"""
        selected_item = self.admin.users_tree.selection()
        if not selected_item:
            messagebox.showwarning("Warning", "Please select a user")
            return
        
        try:
            # Get user ID from the tags (full ObjectId)
            item = selected_item[0]
            tags = self.admin.users_tree.item(item)['tags']
            
            if not tags:
                messagebox.showerror("Error", "User ID not found")
                return
            
            user_object_id = tags[0]  # First tag contains the full ObjectId
            
            # Find the user document using the full ObjectId
            from bson import ObjectId
            user = self.admin.users_collection.find_one({'_id': ObjectId(user_object_id)})
            
            if not user:
                messagebox.showerror("Error", "User not found")
                return
            
            # Create details window
            self.create_user_details_window(user)
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load user details: {str(e)}")
    
    def create_user_details_window(self, user):
        """Create a detailed user information window"""
        details_window = tk.Toplevel(self.admin.root)
        details_window.title(f"User Details - {user.get('firstName', '')} {user.get('lastName', '')}")
        details_window.geometry("800x600")
        
        # Create notebook for different sections
        notebook = tk.ttk.Notebook(details_window)
        notebook.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Basic Info tab
        basic_frame = tk.Frame(notebook)
        notebook.add(basic_frame, text="Basic Info")
        
        # User information
        info_text = tk.Text(basic_frame, wrap='word')
        info_scrollbar = tk.Scrollbar(basic_frame, orient='vertical', command=info_text.yview)
        info_text.configure(yscrollcommand=info_scrollbar.set)
        
        info_text.pack(side='left', fill='both', expand=True)
        info_scrollbar.pack(side='right', fill='y')
        
        # Get company information if user belongs to a company
        company_info = "None"
        if user.get('companyId'):
            company = self.admin.companies_collection.find_one({'_id': user['companyId']})
            if company:
                company_info = f"{company.get('name', 'Unknown')} (ID: {company.get('companyId', 'Unknown')})"
        
        # Format user information
        info = f"""
=== USER DETAILS ===

BASIC INFORMATION:
User ID: {user['_id']}
Name: {user.get('firstName', '')} {user.get('lastName', '')}
Email: {user.get('email', '')}
Role: {user.get('role', 'individual')}
Language: {user.get('language', 'en')}

COMPANY INFORMATION:
Company: {company_info}
Legacy Company: {user.get('company', 'Individual')}
Company Joined: {user.get('companyJoinedAt', 'Never')}
Team ID: {user.get('teamId', 'None')}

PERMISSIONS:
Is Admin: {user.get('isAdmin', False)}
Is Super Admin: {user.get('isSuperAdmin', False)}
Is Company Admin: {user.get('isCompanyAdmin', False)}
Is Team Leader: {user.get('isTeamLeader', False)}
Company Permissions: {user.get('companyPermissions', False)}

SUBSCRIPTION:
Plan: {user.get('subscription', {}).get('plan', 'free').upper()}
Status: {user.get('subscription', {}).get('status', 'inactive').upper()}
Customer ID: {user.get('subscription', {}).get('stripeCustomerId', 'None')}
Subscription ID: {user.get('subscription', {}).get('stripeSubscriptionId', 'None')}
Current Period Start: {user.get('subscription', {}).get('currentPeriodStart', 'None')}
Current Period End: {user.get('subscription', {}).get('currentPeriodEnd', 'None')}
Cancel at Period End: {user.get('subscription', {}).get('cancelAtPeriodEnd', False)}

USAGE STATISTICS:
AI Conversations (Current): {user.get('usage', {}).get('aiConversations', 0)}
Monthly Limit: {user.get('usage', {}).get('monthlyLimit', 50)}
Daily Limit: {user.get('usage', {}).get('dailyLimit', 50)}
Last Monthly Reset: {user.get('usage', {}).get('lastResetDate', 'Never')}
Last Daily Reset: {user.get('usage', {}).get('lastDailyResetDate', 'Never')}

SETTINGS:
Industry: {user.get('settings', {}).get('industry', 'Not set')}
Sales Role: {user.get('settings', {}).get('salesRole', 'Not set')}
Experience Level: {user.get('settings', {}).get('experienceLevel', 'beginner')}

ACCOUNT STATUS:
Email Verified: {user.get('isEmailVerified', False)}
Last Login: {user.get('lastLogin', 'Never')}
Created: {user.get('createdAt', 'Unknown')}
Updated: {user.get('updatedAt', 'Unknown')}
        """
        
        info_text.insert('1.0', info)
        info_text.config(state='disabled')
        
        # Conversations tab
        conversations_frame = tk.Frame(notebook)
        notebook.add(conversations_frame, text="Conversations")
        
        # Get user's conversations
        user_conversations = list(self.admin.conversations_collection.find({'userId': user['_id']}).sort('createdAt', -1).limit(20))
        
        if user_conversations:
            conv_text = tk.Text(conversations_frame, wrap='word')
            conv_scrollbar = tk.Scrollbar(conversations_frame, orient='vertical', command=conv_text.yview)
            conv_text.configure(yscrollcommand=conv_scrollbar.set)
            
            conv_text.pack(side='left', fill='both', expand=True)
            conv_scrollbar.pack(side='right', fill='y')
            
            conv_info = "Recent Conversations:\n\n"
            for conv in user_conversations:
                conv_info += f"Title: {conv.get('title', 'Untitled')}\n"
                conv_info += f"Scenario: {conv.get('scenario', 'general')}\n"
                conv_info += f"Messages: {len(conv.get('messages', []))}\n"
                conv_info += f"Rating: {conv.get('rating', 'Not rated')}\n"
                conv_info += f"Duration: {conv.get('duration', 0)} seconds\n"
                conv_info += f"Created: {conv.get('createdAt', '').strftime('%Y-%m-%d %H:%M')}\n"
                conv_info += "-" * 50 + "\n\n"
            
            conv_text.insert('1.0', conv_info)
            conv_text.config(state='disabled')
        else:
            tk.Label(conversations_frame, text="No conversations found").pack(expand=True)
    
    def edit_user(self):
        """Edit user information"""
        selected_item = self.admin.users_tree.selection()
        if not selected_item:
            messagebox.showwarning("Warning", "Please select a user")
            return
        
        try:
            # Get user ID from the tags (full ObjectId)
            item = selected_item[0]
            tags = self.admin.users_tree.item(item)['tags']
            
            if not tags:
                messagebox.showerror("Error", "User ID not found")
                return
            
            user_object_id = tags[0]  # First tag contains the full ObjectId
            
            # Find the user document using the full ObjectId
            from bson import ObjectId
            user = self.admin.users_collection.find_one({'_id': ObjectId(user_object_id)})
            
            if not user:
                messagebox.showerror("Error", "User not found")
                return
            
            # Create edit window
            self.create_edit_user_window(user)
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to edit user: {str(e)}")
    
    def create_edit_user_window(self, user):
        """Create user edit window"""
        edit_window = tk.Toplevel(self.admin.root)
        edit_window.title(f"Edit User - {user.get('firstName', '')} {user.get('lastName', '')}")
        edit_window.geometry("600x700")
        edit_window.grab_set()  # Make window modal
        
        # Create main frame with scrollbar
        main_frame = tk.Frame(edit_window)
        main_frame.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Create canvas and scrollbar for scrolling
        canvas = tk.Canvas(main_frame)
        scrollbar = tk.Scrollbar(main_frame, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Basic Information Section
        basic_frame = tk.LabelFrame(scrollable_frame, text="Basic Information", font=('Arial', 12, 'bold'))
        basic_frame.pack(fill='x', pady=10)
        
        tk.Label(basic_frame, text="First Name:").grid(row=0, column=0, sticky='w', padx=5, pady=5)
        first_name_var = tk.StringVar(value=user.get('firstName', ''))
        tk.Entry(basic_frame, textvariable=first_name_var, width=30).grid(row=0, column=1, padx=5, pady=5)
        
        tk.Label(basic_frame, text="Last Name:").grid(row=1, column=0, sticky='w', padx=5, pady=5)
        last_name_var = tk.StringVar(value=user.get('lastName', ''))
        tk.Entry(basic_frame, textvariable=last_name_var, width=30).grid(row=1, column=1, padx=5, pady=5)
        
        tk.Label(basic_frame, text="Email:").grid(row=2, column=0, sticky='w', padx=5, pady=5)
        email_var = tk.StringVar(value=user.get('email', ''))
        tk.Entry(basic_frame, textvariable=email_var, width=30).grid(row=2, column=1, padx=5, pady=5)
        
        tk.Label(basic_frame, text="Language:").grid(row=3, column=0, sticky='w', padx=5, pady=5)
        language_var = tk.StringVar(value=user.get('language', 'en'))
        language_combo = tk.ttk.Combobox(basic_frame, textvariable=language_var, 
                                       values=['en', 'et', 'es', 'ru'], width=27)
        language_combo.grid(row=3, column=1, padx=5, pady=5)
        
        # Role and Permissions Section
        role_frame = tk.LabelFrame(scrollable_frame, text="Role & Permissions", font=('Arial', 12, 'bold'))
        role_frame.pack(fill='x', pady=10)
        
        tk.Label(role_frame, text="Role:").grid(row=0, column=0, sticky='w', padx=5, pady=5)
        role_var = tk.StringVar(value=user.get('role', 'individual'))
        role_combo = tk.ttk.Combobox(role_frame, textvariable=role_var,
                                   values=['individual', 'company_admin', 'company_team_leader', 
                                          'company_user', 'super_admin', 'admin'], width=27)
        role_combo.grid(row=0, column=1, padx=5, pady=5)
        
        # Boolean permissions
        is_admin_var = tk.BooleanVar(value=user.get('isAdmin', False))
        tk.Checkbutton(role_frame, text="Is Admin", variable=is_admin_var).grid(row=1, column=0, sticky='w', padx=5, pady=5)
        
        is_super_admin_var = tk.BooleanVar(value=user.get('isSuperAdmin', False))
        tk.Checkbutton(role_frame, text="Is Super Admin", variable=is_super_admin_var).grid(row=1, column=1, sticky='w', padx=5, pady=5)
        
        is_company_admin_var = tk.BooleanVar(value=user.get('isCompanyAdmin', False))
        tk.Checkbutton(role_frame, text="Is Company Admin", variable=is_company_admin_var).grid(row=2, column=0, sticky='w', padx=5, pady=5)
        
        is_team_leader_var = tk.BooleanVar(value=user.get('isTeamLeader', False))
        tk.Checkbutton(role_frame, text="Is Team Leader", variable=is_team_leader_var).grid(row=2, column=1, sticky='w', padx=5, pady=5)
        
        # Subscription Section
        sub_frame = tk.LabelFrame(scrollable_frame, text="Subscription", font=('Arial', 12, 'bold'))
        sub_frame.pack(fill='x', pady=10)
        
        tk.Label(sub_frame, text="Plan:").grid(row=0, column=0, sticky='w', padx=5, pady=5)
        plan_var = tk.StringVar(value=user.get('subscription', {}).get('plan', 'free'))
        plan_combo = tk.ttk.Combobox(sub_frame, textvariable=plan_var,
                                   values=['free', 'basic', 'pro', 'unlimited', 'enterprise'], width=27)
        plan_combo.grid(row=0, column=1, padx=5, pady=5)
        
        tk.Label(sub_frame, text="Status:").grid(row=1, column=0, sticky='w', padx=5, pady=5)
        status_var = tk.StringVar(value=user.get('subscription', {}).get('status', 'inactive'))
        status_combo = tk.ttk.Combobox(sub_frame, textvariable=status_var,
                                     values=['active', 'inactive', 'cancelled', 'past_due'], width=27)
        status_combo.grid(row=1, column=1, padx=5, pady=5)
        
        # Usage Section
        usage_frame = tk.LabelFrame(scrollable_frame, text="Usage Limits", font=('Arial', 12, 'bold'))
        usage_frame.pack(fill='x', pady=10)
        
        tk.Label(usage_frame, text="Monthly Limit:").grid(row=0, column=0, sticky='w', padx=5, pady=5)
        monthly_limit_var = tk.StringVar(value=str(user.get('usage', {}).get('monthlyLimit', 50)))
        tk.Entry(usage_frame, textvariable=monthly_limit_var, width=30).grid(row=0, column=1, padx=5, pady=5)
        
        tk.Label(usage_frame, text="Daily Limit:").grid(row=1, column=0, sticky='w', padx=5, pady=5)
        daily_limit_var = tk.StringVar(value=str(user.get('usage', {}).get('dailyLimit', 50)))
        tk.Entry(usage_frame, textvariable=daily_limit_var, width=30).grid(row=1, column=1, padx=5, pady=5)
        
        # Settings Section
        settings_frame = tk.LabelFrame(scrollable_frame, text="Settings", font=('Arial', 12, 'bold'))
        settings_frame.pack(fill='x', pady=10)
        
        tk.Label(settings_frame, text="Industry:").grid(row=0, column=0, sticky='w', padx=5, pady=5)
        industry_var = tk.StringVar(value=user.get('settings', {}).get('industry', ''))
        tk.Entry(settings_frame, textvariable=industry_var, width=30).grid(row=0, column=1, padx=5, pady=5)
        
        tk.Label(settings_frame, text="Sales Role:").grid(row=1, column=0, sticky='w', padx=5, pady=5)
        sales_role_var = tk.StringVar(value=user.get('settings', {}).get('salesRole', ''))
        tk.Entry(settings_frame, textvariable=sales_role_var, width=30).grid(row=1, column=1, padx=5, pady=5)
        
        tk.Label(settings_frame, text="Experience:").grid(row=2, column=0, sticky='w', padx=5, pady=5)
        experience_var = tk.StringVar(value=user.get('settings', {}).get('experienceLevel', 'beginner'))
        experience_combo = tk.ttk.Combobox(settings_frame, textvariable=experience_var,
                                         values=['beginner', 'intermediate', 'advanced'], width=27)
        experience_combo.grid(row=2, column=1, padx=5, pady=5)
        
        # Email verification
        email_verified_var = tk.BooleanVar(value=user.get('isEmailVerified', False))
        tk.Checkbutton(settings_frame, text="Email Verified", variable=email_verified_var).grid(row=3, column=0, sticky='w', padx=5, pady=5)
        
        # Buttons
        button_frame = tk.Frame(scrollable_frame)
        button_frame.pack(fill='x', pady=20)
        
        def save_user():
            try:
                # Validate and sanitize all input data
                raw_data = {
                    'firstName': first_name_var.get(),
                    'lastName': last_name_var.get(),
                    'email': email_var.get(),
                    'language': language_var.get(),
                    'role': role_var.get(),
                    'subscription.plan': plan_var.get(),
                    'subscription.status': status_var.get(),
                    'usage.monthlyLimit': monthly_limit_var.get(),
                    'usage.dailyLimit': daily_limit_var.get(),
                    'settings.industry': industry_var.get(),
                    'settings.salesRole': sales_role_var.get(),
                    'settings.experienceLevel': experience_var.get()
                }
                
                # Use secure database query builder
                update_data = SecureDatabaseQueries.build_secure_update_data(raw_data)
                
                # Add boolean fields (these don't need validation)
                update_data.update({
                    'isAdmin': is_admin_var.get(),
                    'isSuperAdmin': is_super_admin_var.get(),
                    'isCompanyAdmin': is_company_admin_var.get(),
                    'isTeamLeader': is_team_leader_var.get(),
                    'isEmailVerified': email_verified_var.get(),
                    'updatedAt': datetime.now()
                })
                
                # Update user in database
                result = self.admin.users_collection.update_one(
                    {'_id': user['_id']},
                    {'$set': update_data}
                )
                
                if result.modified_count > 0:
                    messagebox.showinfo("Success", "User updated successfully!")
                    edit_window.destroy()
                    self.load_users()  # Refresh user list
                else:
                    messagebox.showwarning("Warning", "No changes were made")
                    
            except SecurityError as e:
                SecurityAuditLogger.log_security_violation(
                    str(user.get('_id', 'unknown')), "save_user", "user_data", "input_validation", str(e)
                )
                messagebox.showerror("Security Error", "Invalid input data detected")
            except Exception as e:
                SecurityAuditLogger.log_security_violation(
                    str(user.get('_id', 'unknown')), "save_user", "error", "unexpected_error", str(e)
                )
                messagebox.showerror("Error", "An error occurred while updating user")
        
        tk.Button(button_frame, text="Save Changes", command=save_user, 
                 bg='#4CAF50', fg='white', font=('Arial', 12, 'bold')).pack(side='left', padx=5)
        tk.Button(button_frame, text="Cancel", command=edit_window.destroy, 
                 bg='#607D8B', fg='white', font=('Arial', 12)).pack(side='left', padx=5)
        
        # Pack canvas and scrollbar
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Bind mousewheel to canvas
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        canvas.bind_all("<MouseWheel>", _on_mousewheel)
        
        # Unbind when window closes
        def on_close():
            canvas.unbind_all("<MouseWheel>")
            edit_window.destroy()
        edit_window.protocol("WM_DELETE_WINDOW", on_close)
    
    def delete_user(self):
        """Delete a user and related data"""
        selected_item = self.admin.users_tree.selection()
        if not selected_item:
            messagebox.showwarning("Warning", "Please select a user")
            return
        
        try:
            # Get user information
            item = selected_item[0]
            values = self.admin.users_tree.item(item)['values']
            user_name = values[1]
            
            # Get user ID from the tags (full ObjectId)
            tags = self.admin.users_tree.item(item)['tags']
            
            if not tags:
                messagebox.showerror("Error", "User ID not found")
                return
            
            user_object_id = tags[0]  # First tag contains the full ObjectId
            
            # Find the user document using the full ObjectId
            from bson import ObjectId
            user = self.admin.users_collection.find_one({'_id': ObjectId(user_object_id)})
            
            if not user:
                messagebox.showerror("Error", "User not found")
                return
            
            # Check for related data
            user_id = user['_id']
            conversation_count = self.admin.conversations_collection.count_documents({'userId': user_id})
            summary_count = self.admin.conversation_summaries_collection.count_documents({'userId': user_id})
            
            # Show detailed confirmation
            confirm_message = f"Are you sure you want to delete user '{user_name}'?\n\n"
            confirm_message += f"This will also delete:\n"
            confirm_message += f"• {conversation_count} conversations\n"
            confirm_message += f"• {summary_count} conversation summaries\n"
            confirm_message += f"\nThis action cannot be undone!"
            
            if messagebox.askyesno("Confirm Deletion", confirm_message):
                # Delete related data first
                if conversation_count > 0:
                    self.admin.conversations_collection.delete_many({'userId': user_id})
                
                if summary_count > 0:
                    self.admin.conversation_summaries_collection.delete_many({'userId': user_id})
                
                # Remove user from companies if they're a company admin
                if user.get('isCompanyAdmin') or user.get('role') == 'company_admin':
                    self.admin.companies_collection.update_many(
                        {'admin': user_id},
                        {'$unset': {'admin': 1}}
                    )
                
                # Remove user from company users list
                self.admin.companies_collection.update_many(
                    {'users': user_id},
                    {'$pull': {'users': user_id}}
                )
                
                # Delete password resets
                self.admin.password_resets_collection.delete_many({'userId': user_id})
                
                # Finally delete the user
                result = self.admin.users_collection.delete_one({'_id': user_id})
                
                if result.deleted_count > 0:
                    messagebox.showinfo("Success", 
                                      f"User '{user_name}' and all related data deleted successfully!\n\n"
                                      f"Deleted:\n"
                                      f"• User account\n"
                                      f"• {conversation_count} conversations\n"
                                      f"• {summary_count} conversation summaries")
                    self.load_users()  # Refresh user list
                else:
                    messagebox.showerror("Error", "Failed to delete user")
                    
        except Exception as e:
            messagebox.showerror("Error", f"Failed to delete user: {str(e)}")
    
    def load_companies(self):
        """Load companies into the treeview"""
        if not self.admin.connected:
            return
        
        try:
            # Clear existing items
            for item in self.admin.companies_tree.get_children():
                self.admin.companies_tree.delete(item)
            
            # Get companies
            companies = list(self.admin.companies_collection.find())
            
            for company in companies:
                # Get admin user name
                admin_name = "Unknown"
                if company.get('admin'):
                    admin = self.admin.users_collection.find_one({'_id': company['admin']})
                    if admin:
                        admin_name = f"{admin.get('firstName', '')} {admin.get('lastName', '')}"
                
                # Count users
                user_count = len(company.get('users', []))
                
                # Format created date
                created = company.get('createdAt', '').strftime('%Y-%m-%d')
                
                # Insert into treeview with full ObjectId stored in tags
                self.admin.companies_tree.insert('', 'end', 
                    values=(
                        str(company['_id'])[:8] + '...',
                        company.get('name', ''),
                        company.get('industry', 'N/A'),
                        company.get('size', '1-10'),
                        admin_name,
                        user_count,
                        company.get('subscription', {}).get('plan', 'free'),
                        company.get('subscription', {}).get('status', 'inactive'),
                        created
                    ),
                    tags=(str(company['_id']),)  # Store full ObjectId as tag
                )
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load companies: {str(e)}")
    
    @secure_input_wrapper
    def search_companies(self, event=None):
        """Search companies based on search term"""
        try:
            # Validate and sanitize search input
            raw_search_term = self.admin.company_search_var.get()
            search_term = InputValidator.validate_and_sanitize_input(
                raw_search_term, 'search', is_required=False
            ).lower()
            
            for item in self.admin.companies_tree.get_children():
                values = self.admin.companies_tree.item(item)['values']
                # Search in name and industry
                if (search_term in values[1].lower() or 
                    search_term in values[2].lower()):
                    self.admin.companies_tree.reattach(item, '', 'end')
                else:
                    self.admin.companies_tree.detach(item)
        except SecurityError as e:
            SecurityAuditLogger.log_security_violation(
                None, "search_companies", "search_term", "input_validation", str(e)
            )
            messagebox.showerror("Security Error", "Invalid search input detected")
        except Exception as e:
            SecurityAuditLogger.log_security_violation(
                None, "search_companies", "error", "unexpected_error", str(e)
            )
            messagebox.showerror("Error", f"Failed to search companies: {str(e)}")
    
    def view_company_details(self, event=None):
        """View detailed company information"""
        selected_item = self.admin.companies_tree.selection()
        if not selected_item:
            messagebox.showwarning("Warning", "Please select a company")
            return
        
        try:
            # Get company ID from the tags (full ObjectId)
            item = selected_item[0]
            tags = self.admin.companies_tree.item(item)['tags']
            
            if not tags:
                messagebox.showerror("Error", "Company ID not found")
                return
            
            company_object_id = tags[0]  # First tag contains the full ObjectId
            
            # Find the company document using the full ObjectId
            from bson import ObjectId
            company = self.admin.companies_collection.find_one({'_id': ObjectId(company_object_id)})
            
            if not company:
                messagebox.showerror("Error", "Company not found")
                return
            
            # Create details window
            self.create_company_details_window(company)
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load company details: {str(e)}")
    
    def create_company_details_window(self, company):
        """Create a detailed company information window"""
        details_window = tk.Toplevel(self.admin.root)
        details_window.title(f"Company Details - {company.get('name', '')}")
        details_window.geometry("900x700")
        
        # Create notebook for different sections
        notebook = tk.ttk.Notebook(details_window)
        notebook.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Basic Info tab
        basic_frame = tk.Frame(notebook)
        notebook.add(basic_frame, text="Basic Info")
        
        # Company information
        info_text = tk.Text(basic_frame, wrap='word')
        info_scrollbar = tk.Scrollbar(basic_frame, orient='vertical', command=info_text.yview)
        info_text.configure(yscrollcommand=info_scrollbar.set)
        
        info_text.pack(side='left', fill='both', expand=True)
        info_scrollbar.pack(side='right', fill='y')
        
        # Get admin user information
        admin_info = "None"
        if company.get('admin'):
            admin = self.admin.users_collection.find_one({'_id': company['admin']})
            if admin:
                admin_info = f"{admin.get('firstName', '')} {admin.get('lastName', '')} ({admin.get('email', '')})"
        
        # Format company information
        info = f"""
=== COMPANY DETAILS ===

BASIC INFORMATION:
Company ID: {company['_id']}
Company Code: {company.get('companyId', 'N/A')}
Name: {company.get('name', '')}
Description: {company.get('description', 'N/A')}
Industry: {company.get('industry', 'N/A')}
Size: {company.get('size', '1-10')}

ADMIN INFORMATION:
Admin: {admin_info}
Admin ObjectId: {company.get('admin', 'None')}

SUBSCRIPTION:
Plan: {company.get('subscription', {}).get('plan', 'free').upper()}
Status: {company.get('subscription', {}).get('status', 'inactive').upper()}
Max Users: {company.get('subscription', {}).get('maxUsers', 5)}
Customer ID: {company.get('subscription', {}).get('stripeCustomerId', 'None')}
Subscription ID: {company.get('subscription', {}).get('stripeSubscriptionId', 'None')}
Current Period Start: {company.get('subscription', {}).get('currentPeriodStart', 'None')}
Current Period End: {company.get('subscription', {}).get('currentPeriodEnd', 'None')}
Cancel at Period End: {company.get('subscription', {}).get('cancelAtPeriodEnd', False)}

SETTINGS:
Allow User Registration: {company.get('settings', {}).get('allowUserRegistration', True)}
Require Approval: {company.get('settings', {}).get('requireApproval', False)}
Default Role: {company.get('settings', {}).get('defaultRole', 'company_user')}

STATUS:
Is Active: {company.get('isActive', True)}
Created: {company.get('createdAt', 'Unknown')}
Updated: {company.get('updatedAt', 'Unknown')}
        """
        
        info_text.insert('1.0', info)
        info_text.config(state='disabled')
        
        # Users tab
        users_frame = tk.Frame(notebook)
        notebook.add(users_frame, text="Users")
        
        # Get company users
        company_users = []
        if company.get('users'):
            company_users = list(self.admin.users_collection.find({'_id': {'$in': company['users']}}))
        
        if company_users:
            users_text = tk.Text(users_frame, wrap='word')
            users_scrollbar = tk.Scrollbar(users_frame, orient='vertical', command=users_text.yview)
            users_text.configure(yscrollcommand=users_scrollbar.set)
            
            users_text.pack(side='left', fill='both', expand=True)
            users_scrollbar.pack(side='right', fill='y')
            
            users_info = f"Company Users ({len(company_users)}):\n\n"
            for user in company_users:
                users_info += f"Name: {user.get('firstName', '')} {user.get('lastName', '')}\n"
                users_info += f"Email: {user.get('email', '')}\n"
                users_info += f"Role: {user.get('role', 'individual')}\n"
                users_info += f"Joined: {user.get('companyJoinedAt', 'Unknown')}\n"
                users_info += f"Team ID: {user.get('teamId', 'None')}\n"
                users_info += "-" * 50 + "\n\n"
            
            users_text.insert('1.0', users_info)
            users_text.config(state='disabled')
        else:
            tk.Label(users_frame, text="No users found").pack(expand=True)
        
        # Teams tab
        teams_frame = tk.Frame(notebook)
        notebook.add(teams_frame, text="Teams")
        
        teams = company.get('teams', [])
        if teams:
            teams_text = tk.Text(teams_frame, wrap='word')
            teams_scrollbar = tk.Scrollbar(teams_frame, orient='vertical', command=teams_text.yview)
            teams_text.configure(yscrollcommand=teams_scrollbar.set)
            
            teams_text.pack(side='left', fill='both', expand=True)
            teams_scrollbar.pack(side='right', fill='y')
            
            teams_info = f"Company Teams ({len(teams)}):\n\n"
            for team in teams:
                teams_info += f"Team Name: {team.get('name', '')}\n"
                teams_info += f"Description: {team.get('description', 'N/A')}\n"
                teams_info += f"Members: {len(team.get('members', []))}\n"
                teams_info += f"Created: {team.get('createdAt', 'Unknown')}\n"
                
                # Get team leader info
                if team.get('teamLeader'):
                    team_leader = self.admin.users_collection.find_one({'_id': team['teamLeader']})
                    if team_leader:
                        teams_info += f"Team Leader: {team_leader.get('firstName', '')} {team_leader.get('lastName', '')}\n"
                
                teams_info += "-" * 50 + "\n\n"
            
            teams_text.insert('1.0', teams_info)
            teams_text.config(state='disabled')
        else:
            tk.Label(teams_frame, text="No teams found").pack(expand=True)
    
    def edit_company(self):
        """Edit company information"""
        selected_item = self.admin.companies_tree.selection()
        if not selected_item:
            messagebox.showwarning("Warning", "Please select a company")
            return
        
        try:
            # Get company ID from the tags (full ObjectId)
            item = selected_item[0]
            tags = self.admin.companies_tree.item(item)['tags']
            
            if not tags:
                messagebox.showerror("Error", "Company ID not found")
                return
            
            company_object_id = tags[0]  # First tag contains the full ObjectId
            
            # Find the company document using the full ObjectId
            from bson import ObjectId
            company = self.admin.companies_collection.find_one({'_id': ObjectId(company_object_id)})
            
            if not company:
                messagebox.showerror("Error", "Company not found")
                return
            
            # Create edit window
            self.create_edit_company_window(company)
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to edit company: {str(e)}")
    
    def create_edit_company_window(self, company):
        """Create company edit window"""
        edit_window = tk.Toplevel(self.admin.root)
        edit_window.title(f"Edit Company - {company.get('name', '')}")
        edit_window.geometry("600x700")
        edit_window.grab_set()  # Make window modal
        
        # Create main frame with scrollbar
        main_frame = tk.Frame(edit_window)
        main_frame.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Create canvas and scrollbar for scrolling
        canvas = tk.Canvas(main_frame)
        scrollbar = tk.Scrollbar(main_frame, orient="vertical", command=canvas.yview)
        scrollable_frame = tk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Basic Information Section
        basic_frame = tk.LabelFrame(scrollable_frame, text="Basic Information", font=('Arial', 12, 'bold'))
        basic_frame.pack(fill='x', pady=10)
        
        tk.Label(basic_frame, text="Company Name:").grid(row=0, column=0, sticky='w', padx=5, pady=5)
        name_var = tk.StringVar(value=company.get('name', ''))
        tk.Entry(basic_frame, textvariable=name_var, width=30).grid(row=0, column=1, padx=5, pady=5)
        
        tk.Label(basic_frame, text="Description:").grid(row=1, column=0, sticky='w', padx=5, pady=5)
        description_var = tk.StringVar(value=company.get('description', ''))
        tk.Entry(basic_frame, textvariable=description_var, width=30).grid(row=1, column=1, padx=5, pady=5)
        
        tk.Label(basic_frame, text="Industry:").grid(row=2, column=0, sticky='w', padx=5, pady=5)
        industry_var = tk.StringVar(value=company.get('industry', ''))
        tk.Entry(basic_frame, textvariable=industry_var, width=30).grid(row=2, column=1, padx=5, pady=5)
        
        tk.Label(basic_frame, text="Size:").grid(row=3, column=0, sticky='w', padx=5, pady=5)
        size_var = tk.StringVar(value=company.get('size', '1-10'))
        size_combo = tk.ttk.Combobox(basic_frame, textvariable=size_var,
                                   values=['1-10', '11-50', '51-200', '201-500', '500+'], width=27)
        size_combo.grid(row=3, column=1, padx=5, pady=5)
        
        # Subscription Section
        sub_frame = tk.LabelFrame(scrollable_frame, text="Subscription", font=('Arial', 12, 'bold'))
        sub_frame.pack(fill='x', pady=10)
        
        tk.Label(sub_frame, text="Plan:").grid(row=0, column=0, sticky='w', padx=5, pady=5)
        plan_var = tk.StringVar(value=company.get('subscription', {}).get('plan', 'free'))
        plan_combo = tk.ttk.Combobox(sub_frame, textvariable=plan_var,
                                   values=['free', 'basic', 'pro', 'unlimited', 'enterprise'], width=27)
        plan_combo.grid(row=0, column=1, padx=5, pady=5)
        
        tk.Label(sub_frame, text="Status:").grid(row=1, column=0, sticky='w', padx=5, pady=5)
        status_var = tk.StringVar(value=company.get('subscription', {}).get('status', 'inactive'))
        status_combo = tk.ttk.Combobox(sub_frame, textvariable=status_var,
                                     values=['active', 'inactive', 'cancelled', 'past_due'], width=27)
        status_combo.grid(row=1, column=1, padx=5, pady=5)
        
        tk.Label(sub_frame, text="Max Users:").grid(row=2, column=0, sticky='w', padx=5, pady=5)
        max_users_var = tk.StringVar(value=str(company.get('subscription', {}).get('maxUsers', 5)))
        tk.Entry(sub_frame, textvariable=max_users_var, width=30).grid(row=2, column=1, padx=5, pady=5)
        
        # Settings Section
        settings_frame = tk.LabelFrame(scrollable_frame, text="Settings", font=('Arial', 12, 'bold'))
        settings_frame.pack(fill='x', pady=10)
        
        allow_registration_var = tk.BooleanVar(value=company.get('settings', {}).get('allowUserRegistration', True))
        tk.Checkbutton(settings_frame, text="Allow User Registration", variable=allow_registration_var).grid(row=0, column=0, sticky='w', padx=5, pady=5)
        
        require_approval_var = tk.BooleanVar(value=company.get('settings', {}).get('requireApproval', False))
        tk.Checkbutton(settings_frame, text="Require Approval", variable=require_approval_var).grid(row=1, column=0, sticky='w', padx=5, pady=5)
        
        tk.Label(settings_frame, text="Default Role:").grid(row=2, column=0, sticky='w', padx=5, pady=5)
        default_role_var = tk.StringVar(value=company.get('settings', {}).get('defaultRole', 'company_user'))
        role_combo = tk.ttk.Combobox(settings_frame, textvariable=default_role_var,
                                   values=['company_user', 'company_team_leader'], width=27)
        role_combo.grid(row=2, column=1, padx=5, pady=5)
        
        # Status Section
        status_frame = tk.LabelFrame(scrollable_frame, text="Status", font=('Arial', 12, 'bold'))
        status_frame.pack(fill='x', pady=10)
        
        is_active_var = tk.BooleanVar(value=company.get('isActive', True))
        tk.Checkbutton(status_frame, text="Company Active", variable=is_active_var).grid(row=0, column=0, sticky='w', padx=5, pady=5)
        
        # Buttons
        button_frame = tk.Frame(scrollable_frame)
        button_frame.pack(fill='x', pady=20)
        
        def save_company():
            try:
                # Validate and sanitize all input data
                raw_data = {
                    'name': name_var.get(),
                    'description': description_var.get(),
                    'industry': industry_var.get(),
                    'size': size_var.get(),
                    'subscription.plan': plan_var.get(),
                    'subscription.status': status_var.get(),
                    'subscription.maxUsers': max_users_var.get(),
                    'settings.defaultRole': default_role_var.get()
                }
                
                # Use secure database query builder
                update_data = SecureDatabaseQueries.build_secure_update_data(raw_data)
                
                # Add boolean fields (these don't need validation)
                update_data.update({
                    'isActive': is_active_var.get(),
                    'settings.allowUserRegistration': allow_registration_var.get(),
                    'settings.requireApproval': require_approval_var.get(),
                    'updatedAt': datetime.now()
                })
                
                # Update company in database
                result = self.admin.companies_collection.update_one(
                    {'_id': company['_id']},
                    {'$set': update_data}
                )
                
                if result.modified_count > 0:
                    messagebox.showinfo("Success", "Company updated successfully!")
                    edit_window.destroy()
                    self.load_companies()  # Refresh company list
                else:
                    messagebox.showwarning("Warning", "No changes were made")
                    
            except SecurityError as e:
                SecurityAuditLogger.log_security_violation(
                    str(company.get('_id', 'unknown')), "save_company", "company_data", "input_validation", str(e)
                )
                messagebox.showerror("Security Error", "Invalid input data detected")
            except Exception as e:
                SecurityAuditLogger.log_security_violation(
                    str(company.get('_id', 'unknown')), "save_company", "error", "unexpected_error", str(e)
                )
                messagebox.showerror("Error", "An error occurred while updating company")
        
        tk.Button(button_frame, text="Save Changes", command=save_company, 
                 bg='#4CAF50', fg='white', font=('Arial', 12, 'bold')).pack(side='left', padx=5)
        tk.Button(button_frame, text="Cancel", command=edit_window.destroy, 
                 bg='#607D8B', fg='white', font=('Arial', 12)).pack(side='left', padx=5)
        
        # Pack canvas and scrollbar
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        # Bind mousewheel to canvas
        def _on_mousewheel(event):
            canvas.yview_scroll(int(-1*(event.delta/120)), "units")
        canvas.bind_all("<MouseWheel>", _on_mousewheel)
        
        # Unbind when window closes
        def on_close():
            canvas.unbind_all("<MouseWheel>")
            edit_window.destroy()
        edit_window.protocol("WM_DELETE_WINDOW", on_close)
    
    def delete_company(self):
        """Delete a company and related data"""
        selected_item = self.admin.companies_tree.selection()
        if not selected_item:
            messagebox.showwarning("Warning", "Please select a company")
            return
        
        try:
            # Get company information
            item = selected_item[0]
            values = self.admin.companies_tree.item(item)['values']
            company_name = values[1]
            
            # Get company ID from the tags (full ObjectId)
            tags = self.admin.companies_tree.item(item)['tags']
            
            if not tags:
                messagebox.showerror("Error", "Company ID not found")
                return
            
            company_object_id = tags[0]  # First tag contains the full ObjectId
            
            # Find the company document using the full ObjectId
            from bson import ObjectId
            company = self.admin.companies_collection.find_one({'_id': ObjectId(company_object_id)})
            
            if not company:
                messagebox.showerror("Error", "Company not found")
                return
            
            # Check for related data
            company_id = company['_id']
            
            # Count related data
            company_users = company.get('users', [])
            user_count = len(company_users)
            
            # Count conversations from company users
            conversation_count = 0
            summary_count = 0
            if company_users:
                conversation_count = self.admin.conversations_collection.count_documents({'userId': {'$in': company_users}})
                summary_count = self.admin.conversation_summaries_collection.count_documents({'userId': {'$in': company_users}})
            
            # Count enterprise requests
            enterprise_request_count = self.admin.enterprise_requests_collection.count_documents({'companyId': company_id})
            
            # Show detailed confirmation
            confirm_message = f"Are you sure you want to delete company '{company_name}'?\n\n"
            confirm_message += f"This will also delete:\n"
            confirm_message += f"• {user_count} company users\n"
            confirm_message += f"• {conversation_count} conversations from company users\n"
            confirm_message += f"• {summary_count} conversation summaries from company users\n"
            confirm_message += f"• {enterprise_request_count} enterprise requests\n"
            confirm_message += f"• All teams and company data\n"
            confirm_message += f"\n⚠️  WARNING: This will also DELETE ALL COMPANY USERS!\n"
            confirm_message += f"This action cannot be undone!"
            
            if messagebox.askyesno("Confirm Company Deletion", confirm_message):
                # Second confirmation for destructive action
                final_confirm = f"FINAL WARNING!\n\n"
                final_confirm += f"You are about to permanently delete:\n"
                final_confirm += f"• Company: {company_name}\n"
                final_confirm += f"• {user_count} user accounts\n"
                final_confirm += f"• {conversation_count} conversations\n"
                final_confirm += f"• {summary_count} conversation summaries\n\n"
                final_confirm += f"Type 'DELETE' to confirm:"
                
                result = simpledialog.askstring("Final Confirmation", final_confirm)
                
                if result == "DELETE":
                    # Delete related data first
                    
                    # Delete conversations from company users
                    if conversation_count > 0:
                        self.admin.conversations_collection.delete_many({'userId': {'$in': company_users}})
                    
                    # Delete conversation summaries from company users
                    if summary_count > 0:
                        self.admin.conversation_summaries_collection.delete_many({'userId': {'$in': company_users}})
                    
                    # Delete enterprise requests
                    if enterprise_request_count > 0:
                        self.admin.enterprise_requests_collection.delete_many({'companyId': company_id})
                    
                    # Update all company users to remove company association
                    if company_users:
                        self.admin.users_collection.update_many(
                            {'_id': {'$in': company_users}},
                            {
                                '$unset': {'companyId': 1, 'teamId': 1},
                                '$set': {
                                    'role': 'individual',
                                    'isCompanyAdmin': False,
                                    'isTeamLeader': False,
                                    'companyJoinedAt': None
                                }
                            }
                        )
                    
                    # Finally delete the company
                    result = self.admin.companies_collection.delete_one({'_id': company_id})
                    
                    if result.deleted_count > 0:
                        messagebox.showinfo("Success", 
                                          f"Company '{company_name}' and all related data deleted successfully!\n\n"
                                          f"Deleted:\n"
                                          f"• Company account\n"
                                          f"• {user_count} user accounts converted to individual\n"
                                          f"• {conversation_count} conversations\n"
                                          f"• {summary_count} conversation summaries\n"
                                          f"• {enterprise_request_count} enterprise requests")
                        self.load_companies()  # Refresh company list
                        self.load_users()  # Refresh user list to show updated roles
                    else:
                        messagebox.showerror("Error", "Failed to delete company")
                else:
                    messagebox.showinfo("Cancelled", "Company deletion cancelled")
            else:
                messagebox.showinfo("Cancelled", "Company deletion cancelled")
                    
        except Exception as e:
            messagebox.showerror("Error", f"Failed to delete company: {str(e)}")
    
    def manage_company_users(self):
        """Manage company users"""
        selected_item = self.admin.companies_tree.selection()
        if not selected_item:
            messagebox.showwarning("Warning", "Please select a company")
            return
        
        messagebox.showinfo("Info", "Company user management functionality will be implemented in the next version")
    
    def load_conversations(self):
        """Load conversations into the treeview (limited to 30 for performance)"""
        if not self.admin.connected:
            return
        
        try:
            # Clear existing items
            for item in self.admin.conversations_tree.get_children():
                self.admin.conversations_tree.delete(item)
            
            # Get conversations with user information (limit to 30 for performance)
            conversations = list(self.admin.conversations_collection.find().sort('createdAt', -1).limit(30))
            
            for conv in conversations:
                # Get user name
                user_name = "Unknown"
                user = self.admin.users_collection.find_one({'_id': conv['userId']})
                if user:
                    user_name = f"{user.get('firstName', '')} {user.get('lastName', '')}"
                
                # Format created date
                created = conv.get('createdAt', '').strftime('%Y-%m-%d %H:%M')
                
                # Format duration
                duration = conv.get('duration', 0)
                duration_str = f"{duration//60}m {duration%60}s" if duration > 0 else "0s"
                
                # Insert into treeview with full ObjectId stored in tags
                self.admin.conversations_tree.insert('', 'end', 
                    values=(
                        str(conv['_id'])[:8] + '...',
                        user_name,
                        conv.get('title', 'Untitled'),
                        conv.get('scenario', 'general'),
                        len(conv.get('messages', [])),
                        conv.get('rating', 'Not rated'),
                        duration_str,
                        created
                    ),
                    tags=(str(conv['_id']),)  # Store full ObjectId as tag
                )
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load conversations: {str(e)}")
    
    def filter_conversations(self):
        """Filter conversations by date range"""
        try:
            date_from = datetime.strptime(self.admin.date_from_var.get(), '%Y-%m-%d')
            date_to = datetime.strptime(self.admin.date_to_var.get(), '%Y-%m-%d') + timedelta(days=1)
            
            # Clear existing items
            for item in self.admin.conversations_tree.get_children():
                self.admin.conversations_tree.delete(item)
            
            # Get filtered conversations (limit to 100 for date filtering)
            conversations = list(self.admin.conversations_collection.find({
                'createdAt': {'$gte': date_from, '$lt': date_to}
            }).sort('createdAt', -1).limit(100))
            
            for conv in conversations:
                # Get user name
                user_name = "Unknown"
                user = self.admin.users_collection.find_one({'_id': conv['userId']})
                if user:
                    user_name = f"{user.get('firstName', '')} {user.get('lastName', '')}"
                
                # Format created date
                created = conv.get('createdAt', '').strftime('%Y-%m-%d %H:%M')
                
                # Format duration
                duration = conv.get('duration', 0)
                duration_str = f"{duration//60}m {duration%60}s" if duration > 0 else "0s"
                
                # Insert into treeview with full ObjectId stored in tags
                self.admin.conversations_tree.insert('', 'end', 
                    values=(
                        str(conv['_id'])[:8] + '...',
                        user_name,
                        conv.get('title', 'Untitled'),
                        conv.get('scenario', 'general'),
                        len(conv.get('messages', [])),
                        conv.get('rating', 'Not rated'),
                        duration_str,
                        created
                    ),
                    tags=(str(conv['_id']),)  # Store full ObjectId as tag
                )
                
        except ValueError:
            messagebox.showerror("Error", "Invalid date format. Please use YYYY-MM-DD")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to filter conversations: {str(e)}")
    
    @secure_input_wrapper
    def filter_conversations_by_username(self):
        """Filter conversations by user ID"""
        if not self.admin.connected:
            return
        
        try:
            # Clear existing items
            for item in self.admin.conversations_tree.get_children():
                self.admin.conversations_tree.delete(item)
            
            # Get search term
            search_term = self.admin.conversation_username_var.get().strip()
            
            if not search_term:
                self.load_conversations()  # Load all if empty
                return
            
            conversations = []
            users = []  # Initialize users list
            
            # Try to search by user ID first (ObjectId)
            try:
                # Convert search term to ObjectId if it's a valid ObjectId string
                user_object_id = ObjectId(search_term)
                conversations = list(self.admin.conversations_collection.find({
                    'userId': user_object_id
                }).sort('createdAt', -1).limit(30))
            except:
                # If ObjectId conversion fails, try as string
                conversations = list(self.admin.conversations_collection.find({
                    'userId': search_term
                }).sort('createdAt', -1).limit(30))
            
            # Also search by user name/email (combine with user ID search)
            name_users = list(self.admin.users_collection.find({
                '$or': [
                    {'firstName': {'$regex': search_term, '$options': 'i'}},
                    {'lastName': {'$regex': search_term, '$options': 'i'}},
                    {'email': {'$regex': search_term, '$options': 'i'}}
                ]
            }))
            
            # Add conversations from name/email search
            if name_users:
                user_ids = [user['_id'] for user in name_users]
                name_conversations = list(self.admin.conversations_collection.find({
                    'userId': {'$in': user_ids}
                }).sort('createdAt', -1).limit(30))
                
                # Combine conversations and remove duplicates
                existing_ids = {conv['_id'] for conv in conversations}
                for conv in name_conversations:
                    if conv['_id'] not in existing_ids:
                        conversations.append(conv)
            
            # Combine users for display
            users = name_users
            
            for conv in conversations:
                # Get user information
                user = next((u for u in users if u['_id'] == conv['userId']), None)
                user_name = f"{user.get('firstName', '')} {user.get('lastName', '')}" if user else "Unknown User"
                
                # Format created date
                created = conv.get('createdAt', '').strftime('%Y-%m-%d %H:%M')
                
                # Format duration
                duration = conv.get('duration', 0)
                duration_str = f"{duration//60}m {duration%60}s" if duration > 0 else "0s"
                
                # Insert into treeview with full ObjectId stored in tags
                self.admin.conversations_tree.insert('', 'end', 
                    values=(
                        str(conv['_id'])[:8] + '...',
                        user_name,
                        conv.get('title', 'Untitled'),
                        conv.get('scenario', 'general'),
                        len(conv.get('messages', [])),
                        conv.get('rating', 'Not rated'),
                        duration_str,
                        created
                    ),
                    tags=(str(conv['_id']),)  # Store full ObjectId as tag
                )
                
        except SecurityError as e:
            SecurityAuditLogger.log_security_violation(
                None, "filter_conversations_by_username", "username", "input_validation", str(e)
            )
            messagebox.showerror("Security Error", "Invalid username input detected")
        except Exception as e:
            SecurityAuditLogger.log_security_violation(
                None, "filter_conversations_by_username", "error", "unexpected_error", str(e)
            )
            messagebox.showerror("Error", "An error occurred while filtering conversations")
    
    def clear_conversation_filters(self):
        """Clear all conversation filters and reload all conversations"""
        self.admin.conversation_username_var.set("")
        self.admin.date_from_var.set((datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d'))
        self.admin.date_to_var.set(datetime.now().strftime('%Y-%m-%d'))
        self.load_conversations()
    
    def view_conversation(self, event=None):
        """View detailed conversation"""
        selected_item = self.admin.conversations_tree.selection()
        if not selected_item:
            messagebox.showwarning("Warning", "Please select a conversation")
            return
        
        try:
            # Get conversation ID from the tags (full ObjectId)
            item = selected_item[0]
            tags = self.admin.conversations_tree.item(item)['tags']
            
            if not tags:
                messagebox.showerror("Error", "Conversation ID not found")
                return
            
            conversation_object_id = tags[0]  # First tag contains the full ObjectId
            
            # Find the conversation document using the full ObjectId
            from bson import ObjectId
            conversation = self.admin.conversations_collection.find_one({'_id': ObjectId(conversation_object_id)})
            
            if not conversation:
                messagebox.showerror("Error", "Conversation not found")
                return
            
            # Get user information
            user = self.admin.users_collection.find_one({'_id': conversation['userId']})
            user_name = f"{user.get('firstName', '')} {user.get('lastName', '')}" if user else "Unknown User"
            
            # Create conversation detail window
            detail_window = tk.Toplevel(self.admin.root)
            detail_window.title(f"Conversation Details - {conversation.get('title', 'Untitled')}")
            detail_window.geometry("1000x700")
            
            # Create notebook for different sections
            notebook = tk.ttk.Notebook(detail_window)
            notebook.pack(fill='both', expand=True, padx=10, pady=10)
            
            # Messages tab
            messages_frame = tk.Frame(notebook)
            notebook.add(messages_frame, text="Messages")
            
            # Create text widget with scrollbar for messages
            messages_text = tk.Text(messages_frame, wrap='word', font=('Consolas', 10))
            messages_scrollbar = tk.Scrollbar(messages_frame, orient='vertical', command=messages_text.yview)
            messages_text.configure(yscrollcommand=messages_scrollbar.set)
            
            # Pack messages widget
            messages_text.pack(side='left', fill='both', expand=True)
            messages_scrollbar.pack(side='right', fill='y')
            
            # Add messages to the text widget
            messages = conversation.get('messages', [])
            if messages:
                for i, message in enumerate(messages):
                    role = message.get('role', 'unknown')
                    content = message.get('content', '')
                    timestamp = message.get('timestamp', '').strftime('%Y-%m-%d %H:%M:%S') if message.get('timestamp') else 'No timestamp'
                    tokens = message.get('tokens', 0)
                    
                    # Format message with better styling
                    messages_text.insert(tk.END, f"--- Message {i+1} ---\n")
                    messages_text.insert(tk.END, f"Role: {role.upper()}\n")
                    messages_text.insert(tk.END, f"Time: {timestamp}\n")
                    messages_text.insert(tk.END, f"Tokens: {tokens}\n")
                    messages_text.insert(tk.END, f"Content:\n{content}\n\n")
                    messages_text.insert(tk.END, "=" * 80 + "\n\n")
            else:
                messages_text.insert(tk.END, "No messages found in this conversation.")
            
            # Make text widget read-only
            messages_text.config(state='disabled')
            
            # Conversation Details tab
            details_frame = tk.Frame(notebook)
            notebook.add(details_frame, text="Details")
            
            # Create details text widget
            details_text = tk.Text(details_frame, wrap='word')
            details_scrollbar = tk.Scrollbar(details_frame, orient='vertical', command=details_text.yview)
            details_text.configure(yscrollcommand=details_scrollbar.set)
            
            details_text.pack(side='left', fill='both', expand=True)
            details_scrollbar.pack(side='right', fill='y')
            
            # Format conversation details
            details = f"""
=== CONVERSATION DETAILS ===

BASIC INFORMATION:
Conversation ID: {conversation['_id']}
Title: {conversation.get('title', 'Untitled')}
Scenario: {conversation.get('scenario', 'general')}
Language: {conversation.get('language', 'en')}
Industry: {conversation.get('industry', 'N/A')}
Product: {conversation.get('product', 'N/A')}
Customer Type: {conversation.get('customerType', 'N/A')}

USER INFORMATION:
User: {user_name}
User ID: {conversation.get('userId', 'N/A')}
User Email: {user.get('email', 'N/A') if user else 'N/A'}

CONVERSATION STATISTICS:
Total Messages: {len(messages)}
Total Tokens: {conversation.get('totalTokens', 0)}
Duration: {conversation.get('duration', 0)} seconds
Rating: {conversation.get('rating', 'Not rated')}
Feedback: {conversation.get('feedback', 'No feedback')}

AI RATINGS:
Introduction: {conversation.get('aiRatings', {}).get('introduction', 'N/A')}
Mapping: {conversation.get('aiRatings', {}).get('mapping', 'N/A')}
Product Presentation: {conversation.get('aiRatings', {}).get('productPresentation', 'N/A')}
Objection Handling: {conversation.get('aiRatings', {}).get('objectionHandling', 'N/A')}
Close: {conversation.get('aiRatings', {}).get('close', 'N/A')}
Total Score: {conversation.get('aiRatings', {}).get('totalScore', 'N/A')}
Max Possible Score: {conversation.get('aiRatings', {}).get('maxPossibleScore', 'N/A')}

AI RATING FEEDBACK:
{conversation.get('aiRatingFeedback', 'No AI feedback available')}

CLIENT CUSTOMIZATION:
Name: {conversation.get('clientCustomization', {}).get('name', 'N/A')}
Personality: {conversation.get('clientCustomization', {}).get('personality', 'N/A')}
Industry: {conversation.get('clientCustomization', {}).get('industry', 'N/A')}
Role: {conversation.get('clientCustomization', {}).get('role', 'N/A')}
Difficulty: {conversation.get('clientCustomization', {}).get('difficulty', 'N/A')}
Custom Prompt: {conversation.get('clientCustomization', {}).get('customPrompt', 'N/A')}

STATUS:
Is Active: {conversation.get('isActive', True)}
Created: {conversation.get('createdAt', 'Unknown')}
Updated: {conversation.get('updatedAt', 'Unknown')}
            """
            
            details_text.insert('1.0', details)
            details_text.config(state='disabled')
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to view conversation: {str(e)}")
    
    @secure_input_wrapper
    def export_conversations(self):
        """Export conversations to JSON"""
        try:
            filename = simpledialog.askstring("Export", "Enter filename (without extension):")
            if not filename:
                return
            
            # Validate and sanitize filename
            filename = InputValidator.validate_and_sanitize_input(
                filename, 'text', is_required=True
            )
            
            # Remove any dangerous characters from filename
            filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
            if not filename:
                filename = "export"
            
            # Ask user what to export
            export_choice = messagebox.askyesnocancel(
                "Export Options", 
                "What would you like to export?\n\n"
                "YES = Currently visible conversations (30 max)\n"
                "NO = All conversations in database\n"
                "CANCEL = Cancel export"
            )
            
            if export_choice is None:  # Cancel
                return
            
            filename += ".json"
            
            if export_choice:  # Export visible conversations
                # Get conversations currently visible in the treeview
                conversations = []
                for item in self.admin.conversations_tree.get_children():
                    tags = self.admin.conversations_tree.item(item)['tags']
                    if tags:
                        from bson import ObjectId
                        conv = self.admin.conversations_collection.find_one({'_id': ObjectId(tags[0])})
                        if conv:
                            conversations.append(conv)
            else:  # Export all conversations
                conversations = list(self.admin.conversations_collection.find().sort('createdAt', -1))
            
            if not conversations:
                messagebox.showwarning("Warning", "No conversations to export")
                return
            
            # Convert ObjectId to string for JSON serialization
            for conv in conversations:
                conv['_id'] = str(conv['_id'])
                conv['userId'] = str(conv['userId'])
                if 'createdAt' in conv and conv['createdAt']:
                    conv['createdAt'] = conv['createdAt'].isoformat()
                if 'updatedAt' in conv and conv['updatedAt']:
                    conv['updatedAt'] = conv['updatedAt'].isoformat()
                
                # Convert message timestamps
                if 'messages' in conv:
                    for message in conv['messages']:
                        if 'timestamp' in message and message['timestamp']:
                            message['timestamp'] = message['timestamp'].isoformat()
            
            # Save to file
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(conversations, f, indent=2, ensure_ascii=False)
            
            export_type = "visible" if export_choice else "all"
            messagebox.showinfo("Success", 
                              f"Exported {len(conversations)} conversations ({export_type}) to {filename}\n\n"
                              f"File saved in the admin panel directory.")
            
        except SecurityError as e:
            SecurityAuditLogger.log_security_violation(
                None, "export_conversations", "filename", "input_validation", str(e)
            )
            messagebox.showerror("Security Error", "Invalid filename detected")
        except Exception as e:
            SecurityAuditLogger.log_security_violation(
                None, "export_conversations", "error", "unexpected_error", str(e)
            )
            messagebox.showerror("Error", "An error occurred while exporting conversations")
    
    def load_translations(self, event=None):
        """Load translations for selected language and category"""
        if not self.admin.connected:
            return
        
        try:
            # Clear existing items
            for item in self.admin.translations_tree.get_children():
                self.admin.translations_tree.delete(item)
            
            language = self.admin.translation_language_var.get()
            category = self.admin.translation_category_var.get()
            
            # Get translation keys for the category
            translation_keys = list(self.admin.translations_collection.find({'category': category, 'isActive': True}))
            
            for key_doc in translation_keys:
                # Get translation for this key and language
                translation = self.admin.translations_collection.find_one({
                    'translationKey': key_doc['_id'],
                    'language': language,
                    'isActive': True
                })
                
                # Format text preview (first 100 characters)
                text_preview = ""
                last_modified = "Never"
                status = "Missing"
                
                if translation:
                    text_preview = translation.get('text', '')[:100] + "..." if len(translation.get('text', '')) > 100 else translation.get('text', '')
                    last_modified = translation.get('lastModified', '').strftime('%Y-%m-%d %H:%M') if translation.get('lastModified') else "Unknown"
                    status = "Active"
                
                # Insert into treeview
                self.admin.translations_tree.insert('', 'end', 
                    values=(
                        key_doc.get('key', ''),
                        text_preview,
                        last_modified,
                        status
                    ),
                    tags=(str(key_doc['_id']), str(translation['_id']) if translation else '')
                )
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load translations: {str(e)}")
    
    def edit_translation(self, event=None):
        """Edit translation text"""
        selected_item = self.admin.translations_tree.selection()
        if not selected_item:
            messagebox.showwarning("Warning", "Please select a translation to edit")
            return
        
        try:
            # Get selected item data
            item = selected_item[0]
            values = self.admin.translations_tree.item(item)['values']
            tags = self.admin.translations_tree.item(item)['tags']
            
            key_name = values[0]
            current_text = values[1]
            language = self.admin.translation_language_var.get()
            category = self.admin.translation_category_var.get()
            
            # Create edit window
            edit_window = tk.Toplevel(self.admin.root)
            edit_window.title(f"Edit Translation - {key_name} ({language.upper()})")
            edit_window.geometry("800x600")
            edit_window.grab_set()
            
            # Main frame
            main_frame = tk.Frame(edit_window)
            main_frame.pack(fill='both', expand=True, padx=10, pady=10)
            
            # Key info
            info_frame = tk.LabelFrame(main_frame, text="Translation Information", font=('Arial', 12, 'bold'))
            info_frame.pack(fill='x', pady=(0, 10))
            
            tk.Label(info_frame, text=f"Key: {key_name}").pack(anchor='w', padx=10, pady=5)
            tk.Label(info_frame, text=f"Language: {language.upper()}").pack(anchor='w', padx=10, pady=5)
            tk.Label(info_frame, text=f"Category: {category}").pack(anchor='w', padx=10, pady=5)
            
            # Text editor
            text_frame = tk.LabelFrame(main_frame, text="Translation Text", font=('Arial', 12, 'bold'))
            text_frame.pack(fill='both', expand=True, pady=(0, 10))
            
            text_editor = tk.Text(text_frame, wrap='word', font=('Consolas', 10))
            text_scrollbar = tk.Scrollbar(text_frame, orient='vertical', command=text_editor.yview)
            text_editor.configure(yscrollcommand=text_scrollbar.set)
            
            text_editor.pack(side='left', fill='both', expand=True, padx=10, pady=10)
            text_scrollbar.pack(side='right', fill='y', pady=10)
            
            # Load current text
            if current_text and current_text != "Missing":
                text_editor.insert('1.0', current_text)
            
            # Buttons
            button_frame = tk.Frame(main_frame)
            button_frame.pack(fill='x', pady=10)
            
            def save_translation():
                try:
                    new_text = text_editor.get('1.0', tk.END).strip()
                    
                    if not new_text:
                        messagebox.showwarning("Warning", "Translation text cannot be empty")
                        return
                    
                    # Validate input
                    validated_text = InputValidator.validate_and_sanitize_input(
                        new_text, 'description', is_required=True
                    )
                    
                    # Get translation key
                    key_doc = self.admin.translations_collection.find_one({
                        'key': key_name,
                        'category': category,
                        'isActive': True
                    })
                    
                    if not key_doc:
                        messagebox.showerror("Error", "Translation key not found")
                        return
                    
                    # Check if translation exists
                    existing_translation = self.admin.translations_collection.find_one({
                        'translationKey': key_doc['_id'],
                        'language': language,
                        'isActive': True
                    })
                    
                    if existing_translation:
                        # Update existing translation
                        result = self.admin.translations_collection.update_one(
                            {'_id': existing_translation['_id']},
                            {
                                '$set': {
                                    'text': validated_text,
                                    'lastModified': datetime.now()
                                }
                            }
                        )
                    else:
                        # Create new translation
                        new_translation = {
                            'translationKey': key_doc['_id'],
                            'language': language,
                            'text': validated_text,
                            'isActive': True,
                            'lastModified': datetime.now(),
                            'createdAt': datetime.now()
                        }
                        result = self.admin.translations_collection.insert_one(new_translation)
                    
                    messagebox.showinfo("Success", "Translation saved successfully!")
                    edit_window.destroy()
                    self.load_translations()  # Refresh the list
                    
                except SecurityError as e:
                    SecurityAuditLogger.log_security_violation(
                        None, "edit_translation", "translation_text", "input_validation", str(e)
                    )
                    messagebox.showerror("Security Error", "Invalid translation text detected")
                except Exception as e:
                    SecurityAuditLogger.log_security_violation(
                        None, "edit_translation", "error", "unexpected_error", str(e)
                    )
                    messagebox.showerror("Error", f"Failed to save translation: {str(e)}")
            
            tk.Button(button_frame, text="Save Translation", command=save_translation, 
                     bg='#4CAF50', fg='white', font=('Arial', 12, 'bold')).pack(side='left', padx=5)
            tk.Button(button_frame, text="Cancel", command=edit_window.destroy, 
                     bg='#607D8B', fg='white', font=('Arial', 12)).pack(side='left', padx=5)
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to edit translation: {str(e)}")
    
    def seed_translations(self):
        """Seed database with Terms and FAQ translations"""
        try:
            # Import the seeding function
            import sys
            import os
            sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'scripts'))
            
            from seedTermsAndFaqTranslations import seedTermsAndFaqTranslations
            
            # Run the seeding
            result = messagebox.askyesno("Confirm Seeding", 
                "This will populate the database with Terms of Service and FAQ translations for all supported languages.\n\n"
                "This operation may take a few minutes. Continue?")
            
            if result:
                messagebox.showinfo("Info", "Seeding started. Please check the console for progress updates.")
                # Note: In a real implementation, you'd want to run this in a separate thread
                # and show progress updates in the UI
                seedTermsAndFaqTranslations()
                messagebox.showinfo("Success", "Database seeding completed successfully!")
                self.load_translations()  # Refresh the translations list
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to seed translations: {str(e)}")
    
    def export_translations(self):
        """Export translations to JSON file"""
        try:
            language = self.admin.translation_language_var.get()
            category = self.admin.translation_category_var.get()
            
            # Get all translations for the selected language and category
            translation_keys = list(self.admin.translations_collection.find({
                'category': category, 
                'isActive': True
            }))
            
            translations = {}
            for key_doc in translation_keys:
                translation = self.admin.translations_collection.find_one({
                    'translationKey': key_doc['_id'],
                    'language': language,
                    'isActive': True
                })
                
                if translation:
                    translations[key_doc['key']] = translation['text']
            
            # Ask for filename
            filename = simpledialog.askstring("Export Translations", 
                f"Enter filename for {language.upper()} {category} translations:")
            
            if not filename:
                return
            
            # Validate filename
            filename = InputValidator.validate_and_sanitize_input(filename, 'text', is_required=True)
            filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
            if not filename:
                filename = f"{category}_{language}_translations"
            
            filename += ".json"
            
            # Save to file
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump({
                    'language': language,
                    'category': category,
                    'translations': translations,
                    'exported_at': datetime.now().isoformat(),
                    'count': len(translations)
                }, f, indent=2, ensure_ascii=False)
            
            messagebox.showinfo("Success", 
                f"Exported {len(translations)} translations to {filename}\n\n"
                f"Language: {language.upper()}\n"
                f"Category: {category}\n"
                f"File saved in the admin panel directory.")
            
        except SecurityError as e:
            SecurityAuditLogger.log_security_violation(
                None, "export_translations", "filename", "input_validation", str(e)
            )
            messagebox.showerror("Security Error", "Invalid filename detected")
        except Exception as e:
            SecurityAuditLogger.log_security_violation(
                None, "export_translations", "error", "unexpected_error", str(e)
            )
            messagebox.showerror("Error", f"Failed to export translations: {str(e)}")
    
    # Voice Settings Methods
    def apply_voice_settings(self):
        """Apply voice settings to the application"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # Get current settings
            browser_rate = float(self.admin.browser_tts_rate_var.get())
            azure_rate = float(self.admin.azure_tts_rate_var.get())
            response_delay = int(self.admin.response_delay_var.get())
            pitch = float(self.admin.voice_pitch_var.get())
            volume = float(self.admin.voice_volume_var.get())
            language = self.admin.voice_language_var.get()
            
            # Validate settings
            if browser_rate < 0.5 or browser_rate > 3.0:
                messagebox.showerror("Error", "Browser TTS rate must be between 0.5 and 3.0")
                return
            
            if azure_rate < 0.5 or azure_rate > 3.0:
                messagebox.showerror("Error", "Azure TTS rate must be between 0.5 and 3.0")
                return
            
            if response_delay < 500 or response_delay > 5000:
                messagebox.showerror("Error", "Response delay must be between 500 and 5000 milliseconds")
                return
            
            if pitch < 0.5 or pitch > 2.0:
                messagebox.showerror("Error", "Pitch must be between 0.5 and 2.0")
                return
            
            if volume < 0.0 or volume > 1.0:
                messagebox.showerror("Error", "Volume must be between 0.0 and 1.0")
                return
            
            # Save settings to database
            voice_settings = {
                'language': language,
                'browser_tts_rate': browser_rate,
                'azure_tts_rate': azure_rate,
                'response_delay': response_delay,
                'pitch': pitch,
                'volume': volume,
                'updated_at': datetime.now(),
                'updated_by': 'admin_panel'
            }
            
            # Upsert voice settings
            self.admin.db.voice_settings.update_one(
                {'language': language},
                {'$set': voice_settings},
                upsert=True
            )
            
            messagebox.showinfo("Success", f"Voice settings applied for {language}")
            
        except ValueError as e:
            messagebox.showerror("Error", "Invalid numeric values. Please check your input.")
        except Exception as e:
            SecurityAuditLogger.log_security_violation(
                None, "apply_voice_settings", "error", "unexpected_error", str(e)
            )
            messagebox.showerror("Error", f"Failed to apply voice settings: {str(e)}")
    
    def test_voice_settings(self):
        """Test current voice settings"""
        try:
            language = self.admin.voice_language_var.get()
            test_text = f"Hello, this is a test of the voice settings for {language} language."
            
            # This would integrate with the actual TTS system
            messagebox.showinfo("Voice Test", f"Testing voice for {language}:\n{test_text}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to test voice: {str(e)}")
    
    def reset_voice_settings(self):
        """Reset voice settings to defaults"""
        try:
            self.admin.browser_tts_rate_var.set("1.6")
            self.admin.azure_tts_rate_var.set("1.2")
            self.admin.response_delay_var.set("1800")
            self.admin.voice_pitch_var.set("0.98")
            self.admin.voice_volume_var.set("0.85")
            
            messagebox.showinfo("Success", "Voice settings reset to defaults")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to reset settings: {str(e)}")
    
    def export_voice_settings(self):
        """Export voice settings to JSON file"""
        try:
            language = self.admin.voice_language_var.get()
            
            settings = {
                'language': language,
                'browser_tts_rate': self.admin.browser_tts_rate_var.get(),
                'azure_tts_rate': self.admin.azure_tts_rate_var.get(),
                'response_delay': self.admin.response_delay_var.get(),
                'pitch': self.admin.voice_pitch_var.get(),
                'volume': self.admin.voice_volume_var.get(),
                'exported_at': datetime.now().isoformat()
            }
            
            filename = f"voice_settings_{language}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(settings, f, indent=2, ensure_ascii=False)
            
            messagebox.showinfo("Success", f"Voice settings exported to {filename}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to export voice settings: {str(e)}")
    
    # AI Ratings Methods
    def load_ratings(self):
        """Load AI conversation ratings"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # Clear existing items
            for item in self.admin.ratings_tree.get_children():
                self.admin.ratings_tree.delete(item)
            
            # Get conversations with AI ratings
            conversations = list(self.admin.conversations_collection.find({
                'aiRatings': {'$exists': True, '$ne': None}
            }).sort('createdAt', -1).limit(100))
            
            for conv in conversations:
                ratings = conv.get('aiRatings', {})
                user_info = conv.get('userId', {})
                
                # Get user name
                user_name = "Unknown"
                if isinstance(user_info, dict):
                    user_name = f"{user_info.get('firstName', '')} {user_info.get('lastName', '')}".strip()
                elif isinstance(user_info, str):
                    # If userId is just an ObjectId string, try to get user details
                    try:
                        user = self.admin.users_collection.find_one({'_id': ObjectId(user_info)})
                        if user:
                            user_name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
                    except:
                        pass
                
                # Calculate total score
                total_score = sum([
                    ratings.get('introduction', 0),
                    ratings.get('mapping', 0),
                    ratings.get('productPresentation', 0),
                    ratings.get('objectionHandling', 0),
                    ratings.get('close', 0)
                ])
                
                # Insert into tree
                self.admin.ratings_tree.insert('', 'end', values=(
                    str(conv['_id'])[:8] + '...',
                    user_name,
                    f"{total_score}/50",
                    ratings.get('introduction', 0),
                    ratings.get('mapping', 0),
                    ratings.get('productPresentation', 0),
                    ratings.get('objectionHandling', 0),
                    ratings.get('close', 0),
                    conv.get('createdAt', '').strftime('%Y-%m-%d') if conv.get('createdAt') else ''
                ))
            
            messagebox.showinfo("Success", f"Loaded {len(conversations)} conversations with ratings")
            
        except Exception as e:
            SecurityAuditLogger.log_security_violation(
                None, "load_ratings", "error", "unexpected_error", str(e)
            )
            messagebox.showerror("Error", f"Failed to load ratings: {str(e)}")
    
    def filter_ratings(self):
        """Filter ratings by score range"""
        try:
            min_rating = int(self.admin.min_rating_var.get())
            max_rating = int(self.admin.max_rating_var.get())
            
            for item in self.admin.ratings_tree.get_children():
                values = self.admin.ratings_tree.item(item)['values']
                total_score = int(values[2].split('/')[0])  # Extract score from "XX/50"
                
                if min_rating <= total_score <= max_rating:
                    self.admin.ratings_tree.reattach(item, '', 'end')
                else:
                    self.admin.ratings_tree.detach(item)
                    
        except ValueError:
            messagebox.showerror("Error", "Please enter valid numeric values for rating range")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to filter ratings: {str(e)}")
    
    def view_rating_details(self):
        """View detailed rating analysis"""
        try:
            selected_item = self.admin.ratings_tree.selection()
            if not selected_item:
                messagebox.showwarning("Warning", "Please select a conversation to view details")
                return
            
            values = self.admin.ratings_tree.item(selected_item[0])['values']
            conversation_id = values[0]
            
            # Find the full conversation ID
            conv_id = None
            for item in self.admin.ratings_tree.get_children():
                item_values = self.admin.ratings_tree.item(item)['values']
                if item_values[0] == conversation_id:
                    # Find the actual conversation
                    conversations = list(self.admin.conversations_collection.find({
                        'aiRatings': {'$exists': True, '$ne': None}
                    }))
                    
                    for conv in conversations:
                        if str(conv['_id']).startswith(conversation_id.replace('...', '')):
                            conv_id = conv['_id']
                            break
                    break
            
            if not conv_id:
                messagebox.showerror("Error", "Could not find conversation details")
                return
            
            conversation = self.admin.conversations_collection.find_one({'_id': conv_id})
            if not conversation:
                messagebox.showerror("Error", "Conversation not found")
                return
            
            # Create details window
            details_window = tk.Toplevel(self.admin.root)
            details_window.title(f"Rating Details - {conversation_id}")
            details_window.geometry("800x600")
            
            # Display conversation details
            details_text = scrolledtext.ScrolledText(details_window)
            details_text.pack(fill='both', expand=True, padx=10, pady=10)
            
            # Format details
            ratings = conversation.get('aiRatings', {})
            feedback = conversation.get('aiRatingFeedback', '')
            
            details_content = f"""
Conversation ID: {conversation_id}
User: {values[1]}
Date: {values[8]}

RATING BREAKDOWN:
- Opening: {ratings.get('introduction', 0)}/10
- Discovery: {ratings.get('mapping', 0)}/10
- Presentation: {ratings.get('productPresentation', 0)}/10
- Objection Handling: {ratings.get('objectionHandling', 0)}/10
- Closing: {ratings.get('close', 0)}/10
Total Score: {values[2]}

AI FEEDBACK:
{feedback}

CONVERSATION SUMMARY:
Title: {conversation.get('title', 'N/A')}
Scenario: {conversation.get('scenario', 'N/A')}
Duration: {conversation.get('duration', 0)} seconds
Messages: {len(conversation.get('messages', []))}
"""
            
            details_text.insert('1.0', details_content)
            details_text.config(state='disabled')
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to view rating details: {str(e)}")
    
    def export_ratings(self):
        """Export ratings data to CSV"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # Get all conversations with ratings
            conversations = list(self.admin.conversations_collection.find({
                'aiRatings': {'$exists': True, '$ne': None}
            }))
            
            if not conversations:
                messagebox.showinfo("Info", "No ratings data found to export")
                return
            
            # Create CSV content
            csv_content = "Conversation ID,User,Total Score,Opening,Discovery,Presentation,Objections,Closing,Date,Feedback\n"
            
            for conv in conversations:
                ratings = conv.get('aiRatings', {})
                feedback = conv.get('aiRatingFeedback', '').replace('"', '""').replace('\n', ' ')
                
                # Get user name
                user_info = conv.get('userId', {})
                user_name = "Unknown"
                if isinstance(user_info, dict):
                    user_name = f"{user_info.get('firstName', '')} {user_info.get('lastName', '')}".strip()
                
                total_score = sum([
                    ratings.get('introduction', 0),
                    ratings.get('mapping', 0),
                    ratings.get('productPresentation', 0),
                    ratings.get('objectionHandling', 0),
                    ratings.get('close', 0)
                ])
                
                csv_content += f'"{str(conv["_id"])}","{user_name}",{total_score},{ratings.get("introduction", 0)},{ratings.get("mapping", 0)},{ratings.get("productPresentation", 0)},{ratings.get("objectionHandling", 0)},{ratings.get("close", 0)},"{conv.get("createdAt", "").strftime("%Y-%m-%d") if conv.get("createdAt") else ""}","{feedback}"\n'
            
            # Save to file
            filename = f"ai_ratings_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(csv_content)
            
            messagebox.showinfo("Success", f"Ratings exported to {filename}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to export ratings: {str(e)}")
    
    def generate_rating_report(self):
        """Generate a comprehensive rating report"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # Get all ratings data
            conversations = list(self.admin.conversations_collection.find({
                'aiRatings': {'$exists': True, '$ne': None}
            }))
            
            if not conversations:
                messagebox.showinfo("Info", "No ratings data found to generate report")
                return
            
            # Calculate statistics
            total_conversations = len(conversations)
            scores = []
            stage_scores = {
                'introduction': [],
                'mapping': [],
                'productPresentation': [],
                'objectionHandling': [],
                'close': []
            }
            
            for conv in conversations:
                ratings = conv.get('aiRatings', {})
                total_score = sum([
                    ratings.get('introduction', 0),
                    ratings.get('mapping', 0),
                    ratings.get('productPresentation', 0),
                    ratings.get('objectionHandling', 0),
                    ratings.get('close', 0)
                ])
                scores.append(total_score)
                
                for stage in stage_scores:
                    stage_scores[stage].append(ratings.get(stage, 0))
            
            # Calculate averages
            avg_total = sum(scores) / len(scores) if scores else 0
            avg_stages = {}
            for stage, stage_list in stage_scores.items():
                avg_stages[stage] = sum(stage_list) / len(stage_list) if stage_list else 0
            
            # Create report
            report_window = tk.Toplevel(self.admin.root)
            report_window.title("AI Rating Report")
            report_window.geometry("800x600")
            
            report_text = scrolledtext.ScrolledText(report_window)
            report_text.pack(fill='both', expand=True, padx=10, pady=10)
            
            report_content = f"""
AI CONVERSATION RATING REPORT
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

SUMMARY STATISTICS:
- Total Conversations Analyzed: {total_conversations}
- Average Total Score: {avg_total:.2f}/50
- Score Range: {min(scores)} - {max(scores)}

STAGE-BY-STAGE AVERAGES:
- Opening: {avg_stages['introduction']:.2f}/10
- Discovery: {avg_stages['mapping']:.2f}/10
- Presentation: {avg_stages['productPresentation']:.2f}/10
- Objection Handling: {avg_stages['objectionHandling']:.2f}/10
- Closing: {avg_stages['close']:.2f}/10

PERFORMANCE DISTRIBUTION:
- Excellent (40-50): {len([s for s in scores if s >= 40])} conversations
- Good (30-39): {len([s for s in scores if 30 <= s < 40])} conversations
- Average (20-29): {len([s for s in scores if 20 <= s < 30])} conversations
- Needs Improvement (10-19): {len([s for s in scores if 10 <= s < 20])} conversations
- Poor (0-9): {len([s for s in scores if s < 10])} conversations

RECOMMENDATIONS:
- Focus on improving: {min(avg_stages, key=avg_stages.get).replace('introduction', 'Opening').replace('mapping', 'Discovery').replace('productPresentation', 'Presentation').replace('objectionHandling', 'Objection Handling').replace('close', 'Closing')}
- Strongest area: {max(avg_stages, key=avg_stages.get).replace('introduction', 'Opening').replace('mapping', 'Discovery').replace('productPresentation', 'Presentation').replace('objectionHandling', 'Objection Handling').replace('close', 'Closing')}
"""
            
            report_text.insert('1.0', report_content)
            report_text.config(state='disabled')
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to generate rating report: {str(e)}")
    
    # Database Tools Methods
    def create_database_backup(self):
        """Create a database backup"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # Create backup directory if it doesn't exist
            backup_dir = "database_backups"
            if not os.path.exists(backup_dir):
                os.makedirs(backup_dir)
            
            # Generate backup filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_filename = f"{backup_dir}/salesbuddy_backup_{timestamp}.json"
            
            # Get all collections
            collections = ['users', 'companies', 'conversations', 'conversationsummaries', 'translations', 'translationkeys']
            backup_data = {
                'backup_info': {
                    'created_at': datetime.now().isoformat(),
                    'database_name': self.admin.db.name,
                    'collections': collections
                },
                'data': {}
            }
            
            # Backup each collection
            for collection_name in collections:
                collection = getattr(self.admin, f"{collection_name}_collection", None)
                if collection:
                    docs = list(collection.find())
                    backup_data['data'][collection_name] = docs
            
            # Save backup
            with open(backup_filename, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, ensure_ascii=False, default=str)
            
            messagebox.showinfo("Success", f"Database backup created: {backup_filename}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to create backup: {str(e)}")
    
    def restore_database_backup(self):
        """Restore database from backup"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # Ask for confirmation
            if not messagebox.askyesno("Confirm Restore", "This will overwrite existing data. Are you sure?"):
                return
            
            # Open file dialog to select backup file
            from tkinter import filedialog
            backup_file = filedialog.askopenfilename(
                title="Select backup file to restore",
                filetypes=[("JSON files", "*.json"), ("All files", "*.*")]
            )
            
            if not backup_file:
                return
            
            # Load backup data
            with open(backup_file, 'r', encoding='utf-8') as f:
                backup_data = json.load(f)
            
            # Restore each collection
            collections_data = backup_data.get('data', {})
            for collection_name, docs in collections_data.items():
                collection = getattr(self.admin, f"{collection_name}_collection", None)
                if collection:
                    # Clear existing data
                    collection.delete_many({})
                    # Insert backup data
                    if docs:
                        collection.insert_many(docs)
            
            messagebox.showinfo("Success", f"Database restored from {backup_file}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to restore backup: {str(e)}")
    
    def list_database_backups(self):
        """List available database backups"""
        try:
            backup_dir = "database_backups"
            if not os.path.exists(backup_dir):
                messagebox.showinfo("Info", "No backup directory found")
                return
            
            backup_files = [f for f in os.listdir(backup_dir) if f.endswith('.json')]
            
            if not backup_files:
                messagebox.showinfo("Info", "No backup files found")
                return
            
            # Create window to display backups
            backup_window = tk.Toplevel(self.admin.root)
            backup_window.title("Available Backups")
            backup_window.geometry("600x400")
            
            backup_text = scrolledtext.ScrolledText(backup_window)
            backup_text.pack(fill='both', expand=True, padx=10, pady=10)
            
            content = "Available Database Backups:\n\n"
            for backup_file in sorted(backup_files, reverse=True):
                file_path = os.path.join(backup_dir, backup_file)
                file_size = os.path.getsize(file_path)
                file_time = os.path.getmtime(file_path)
                file_date = datetime.fromtimestamp(file_time).strftime('%Y-%m-%d %H:%M:%S')
                
                content += f"File: {backup_file}\n"
                content += f"Date: {file_date}\n"
                content += f"Size: {file_size:,} bytes\n"
                content += f"Path: {file_path}\n"
                content += "-" * 50 + "\n"
            
            backup_text.insert('1.0', content)
            backup_text.config(state='disabled')
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to list backups: {str(e)}")
    
    def cleanup_old_conversations(self):
        """Clean up old conversations"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # Ask for confirmation
            result = messagebox.askyesnocancel(
                "Cleanup Old Conversations",
                "Delete conversations older than 90 days?\n\nYes: Delete conversations older than 90 days\nNo: Delete conversations older than 180 days\nCancel: Abort operation"
            )
            
            if result is None:  # Cancel
                return
            
            days_threshold = 90 if result else 180
            cutoff_date = datetime.now() - timedelta(days=days_threshold)
            
            # Delete old conversations
            result = self.admin.conversations_collection.delete_many({
                'createdAt': {'$lt': cutoff_date}
            })
            
            messagebox.showinfo("Success", f"Deleted {result.deleted_count} conversations older than {days_threshold} days")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to cleanup conversations: {str(e)}")
    
    def cleanup_inactive_users(self):
        """Clean up inactive users"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # Ask for confirmation
            if not messagebox.askyesno("Confirm Cleanup", "Delete users who haven't logged in for 365 days?\nThis action cannot be undone."):
                return
            
            cutoff_date = datetime.now() - timedelta(days=365)
            
            # Find inactive users (users without lastLogin or with very old lastLogin)
            inactive_users = self.admin.users_collection.find({
                '$or': [
                    {'lastLogin': {'$lt': cutoff_date}},
                    {'lastLogin': {'$exists': False}}
                ],
                'role': {'$in': ['individual', 'company_user']}  # Don't delete admins
            })
            
            inactive_count = len(list(inactive_users))
            
            if inactive_count == 0:
                messagebox.showinfo("Info", "No inactive users found")
                return
            
            # Delete inactive users
            result = self.admin.users_collection.delete_many({
                '$or': [
                    {'lastLogin': {'$lt': cutoff_date}},
                    {'lastLogin': {'$exists': False}}
                ],
                'role': {'$in': ['individual', 'company_user']}
            })
            
            messagebox.showinfo("Success", f"Deleted {result.deleted_count} inactive users")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to cleanup users: {str(e)}")
    
    def optimize_database(self):
        """Optimize database performance"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # Create indexes for better performance
            collections_to_index = {
                'users': [('email', 1), ('createdAt', -1), ('lastLogin', -1)],
                'conversations': [('userId', 1), ('createdAt', -1), ('aiRatings', 1)],
                'companies': [('name', 1), ('createdAt', -1)],
                'translations': [('language', 1), ('category', 1), ('key', 1)]
            }
            
            optimized_count = 0
            for collection_name, indexes in collections_to_index.items():
                collection = getattr(self.admin, f"{collection_name}_collection", None)
                if collection:
                    for index_fields in indexes:
                        try:
                            collection.create_index(list(index_fields) if isinstance(index_fields, tuple) else [index_fields])
                            optimized_count += 1
                        except:
                            pass  # Index might already exist
            
            messagebox.showinfo("Success", f"Database optimization completed. Created {optimized_count} indexes.")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to optimize database: {str(e)}")
    
    def migrate_translations(self):
        """Migrate translations to new format"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # This would migrate translations from old format to new format
            messagebox.showinfo("Info", "Translation migration feature coming soon")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to migrate translations: {str(e)}")
    
    def update_database_schema(self):
        """Update database schema"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # This would update database schema to latest version
            messagebox.showinfo("Info", "Schema update feature coming soon")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to update schema: {str(e)}")
    
    def refresh_database_stats(self):
        """Refresh database statistics"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # Clear existing stats
            self.admin.db_stats_text.delete('1.0', tk.END)
            
            # Get collection statistics
            collections = ['users', 'companies', 'conversations', 'conversationsummaries', 'translations', 'translationkeys']
            stats_content = "DATABASE STATISTICS\n"
            stats_content += "=" * 50 + "\n\n"
            
            total_documents = 0
            total_size = 0
            
            for collection_name in collections:
                collection = getattr(self.admin, f"{collection_name}_collection", None)
                if collection:
                    count = collection.count_documents({})
                    total_documents += count
                    
                    # Get collection size (approximate)
                    try:
                        stats = self.admin.db.command("collStats", collection_name)
                        size = stats.get('size', 0)
                        total_size += size
                        size_mb = size / (1024 * 1024)
                        stats_content += f"{collection_name.upper()}:\n"
                        stats_content += f"  Documents: {count:,}\n"
                        stats_content += f"  Size: {size_mb:.2f} MB\n\n"
                    except:
                        stats_content += f"{collection_name.upper()}:\n"
                        stats_content += f"  Documents: {count:,}\n"
                        stats_content += f"  Size: Unable to calculate\n\n"
            
            stats_content += "=" * 50 + "\n"
            stats_content += f"TOTAL DOCUMENTS: {total_documents:,}\n"
            stats_content += f"TOTAL SIZE: {total_size / (1024 * 1024):.2f} MB\n"
            stats_content += f"LAST UPDATED: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            
            self.admin.db_stats_text.insert('1.0', stats_content)
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to refresh database stats: {str(e)}")
    
    # Subscription Tracking Methods
    def load_subscription_tracking(self):
        """Load subscription and usage tracking data"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # Clear existing items
            for item in self.admin.subscription_tree.get_children():
                self.admin.subscription_tree.delete(item)
            
            # Get current month
            current_month = self.admin.subscription_month_var.get()
            try:
                month_start = datetime.strptime(current_month, '%Y-%m')
                month_end = (month_start.replace(day=1) + timedelta(days=32)).replace(day=1)
            except ValueError:
                messagebox.showerror("Error", "Invalid month format. Use YYYY-MM")
                return
            
            # Get all users with subscription plans
            users = list(self.admin.users_collection.find({
                'subscription': {'$exists': True},
                'subscription.plan': {'$ne': None}
            }))
            
            total_users = len(users)
            total_used = 0
            total_limit = 0
            
            for user in users:
                subscription = user.get('subscription', {})
                plan = subscription.get('plan', 'basic')
                
                # Define plan limits
                plan_limits = {
                    'basic': 10,
                    'pro': 50,
                    'enterprise': 200,
                    'free': 3
                }
                
                monthly_limit = plan_limits.get(plan, 10)
                
                # Count conversations this month
                conversations_this_month = self.admin.conversations_collection.count_documents({
                    'userId': str(user['_id']),
                    'createdAt': {
                        '$gte': month_start,
                        '$lt': month_end
                    }
                })
                
                remaining = max(0, monthly_limit - conversations_this_month)
                usage_percent = (conversations_this_month / monthly_limit * 100) if monthly_limit > 0 else 0
                
                # Determine status
                if conversations_this_month >= monthly_limit:
                    status = "Limit Reached"
                elif usage_percent >= 80:
                    status = "Near Limit"
                else:
                    status = "Active"
                
                # Get last activity
                last_conversation = self.admin.conversations_collection.find_one(
                    {'userId': str(user['_id'])},
                    sort=[('createdAt', -1)]
                )
                last_activity = "Never"
                if last_conversation and last_conversation.get('createdAt'):
                    last_activity = last_conversation['createdAt'].strftime('%Y-%m-%d')
                
                # Get user/company name
                display_name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
                if not display_name:
                    display_name = user.get('email', 'Unknown User')
                
                # Insert into tree
                self.admin.subscription_tree.insert('', 'end', values=(
                    display_name,
                    plan.title(),
                    monthly_limit,
                    conversations_this_month,
                    remaining,
                    f"{usage_percent:.1f}%",
                    status,
                    last_activity
                ))
                
                total_used += conversations_this_month
                total_limit += monthly_limit
            
            # Update usage summary
            self.update_usage_summary(total_users, total_used, total_limit, current_month)
            
            messagebox.showinfo("Success", f"Loaded usage data for {total_users} users")
            
        except Exception as e:
            SecurityAuditLogger.log_security_violation(
                None, "load_subscription_tracking", "error", "unexpected_error", str(e)
            )
            messagebox.showerror("Error", f"Failed to load subscription tracking: {str(e)}")
    
    def update_usage_summary(self, total_users, total_used, total_limit, month):
        """Update the usage summary text"""
        try:
            self.admin.usage_summary_text.delete('1.0', tk.END)
            
            usage_percent = (total_used / total_limit * 100) if total_limit > 0 else 0
            
            summary_content = f"""
MONTHLY USAGE SUMMARY - {month}
{'=' * 50}

TOTAL USERS: {total_users:,}
TOTAL CONVERSATIONS USED: {total_used:,}
TOTAL MONTHLY LIMIT: {total_limit:,}
OVERALL USAGE: {usage_percent:.1f}%

PLAN BREAKDOWN:
"""
            
            # Get breakdown by plan
            plans = ['free', 'basic', 'pro', 'enterprise']
            for plan in plans:
                plan_users = list(self.admin.users_collection.find({
                    'subscription.plan': plan
                }))
                
                plan_limit = {'free': 3, 'basic': 10, 'pro': 50, 'enterprise': 200}.get(plan, 10)
                plan_users_count = len(plan_users)
                
                if plan_users_count > 0:
                    plan_used = 0
                    for user in plan_users:
                        user_conv_count = self.admin.conversations_collection.count_documents({
                            'userId': str(user['_id']),
                            'createdAt': {
                                '$gte': datetime.strptime(month, '%Y-%m'),
                                '$lt': (datetime.strptime(month, '%Y-%m').replace(day=1) + timedelta(days=32)).replace(day=1)
                            }
                        })
                        plan_used += user_conv_count
                    
                    plan_usage_percent = (plan_used / (plan_users_count * plan_limit) * 100) if plan_users_count > 0 else 0
                    
                    summary_content += f"- {plan.title()}: {plan_users_count} users, {plan_used}/{plan_users_count * plan_limit} used ({plan_usage_percent:.1f}%)\n"
            
            summary_content += f"\nLast Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            
            self.admin.usage_summary_text.insert('1.0', summary_content)
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to update usage summary: {str(e)}")
    
    def filter_subscriptions(self, event=None):
        """Filter subscriptions by plan"""
        try:
            plan_filter = self.admin.subscription_plan_var.get()
            
            for item in self.admin.subscription_tree.get_children():
                values = self.admin.subscription_tree.item(item)['values']
                plan = values[1].lower()
                
                if plan_filter == 'all' or plan == plan_filter:
                    self.admin.subscription_tree.reattach(item, '', 'end')
                else:
                    self.admin.subscription_tree.detach(item)
                    
        except Exception as e:
            messagebox.showerror("Error", f"Failed to filter subscriptions: {str(e)}")
    
    def view_usage_details(self):
        """View detailed usage information for a user"""
        try:
            selected_item = self.admin.subscription_tree.selection()
            if not selected_item:
                messagebox.showwarning("Warning", "Please select a user to view details")
                return
            
            values = self.admin.subscription_tree.item(selected_item[0])['values']
            user_name = values[0]
            plan = values[1].lower()
            
            # Find the user
            user = self.admin.users_collection.find_one({
                '$or': [
                    {'email': user_name},
                    {'firstName': {'$regex': user_name.split()[0], '$options': 'i'}},
                    {'lastName': {'$regex': user_name.split()[-1], '$options': 'i'}}
                ]
            })
            
            if not user:
                messagebox.showerror("Error", "User not found")
                return
            
            # Get current month
            current_month = self.admin.subscription_month_var.get()
            try:
                month_start = datetime.strptime(current_month, '%Y-%m')
                month_end = (month_start.replace(day=1) + timedelta(days=32)).replace(day=1)
            except ValueError:
                messagebox.showerror("Error", "Invalid month format")
                return
            
            # Get user's conversations this month
            conversations = list(self.admin.conversations_collection.find({
                'userId': str(user['_id']),
                'createdAt': {
                    '$gte': month_start,
                    '$lt': month_end
                }
            }).sort('createdAt', -1))
            
            # Create details window
            details_window = tk.Toplevel(self.admin.root)
            details_window.title(f"Usage Details - {user_name}")
            details_window.geometry("800x600")
            
            details_text = scrolledtext.ScrolledText(details_window)
            details_text.pack(fill='both', expand=True, padx=10, pady=10)
            
            # Format details
            subscription = user.get('subscription', {})
            plan_limits = {'free': 3, 'basic': 10, 'pro': 50, 'enterprise': 200}
            monthly_limit = plan_limits.get(plan, 10)
            
            details_content = f"""
USER USAGE DETAILS - {current_month}
{'=' * 50}

USER INFORMATION:
Name: {user.get('firstName', '')} {user.get('lastName', '')}
Email: {user.get('email', 'N/A')}
Plan: {plan.title()}
Monthly Limit: {monthly_limit} conversations

USAGE THIS MONTH:
Total Conversations: {len(conversations)}
Remaining: {max(0, monthly_limit - len(conversations))}
Usage Percentage: {(len(conversations) / monthly_limit * 100):.1f}%

CONVERSATION DETAILS:
"""
            
            for i, conv in enumerate(conversations[:20], 1):  # Show last 20 conversations
                duration = conv.get('duration', 0)
                duration_min = duration // 60 if duration else 0
                duration_sec = duration % 60 if duration else 0
                
                details_content += f"{i}. {conv.get('title', 'Untitled')}\n"
                details_content += f"   Date: {conv.get('createdAt', '').strftime('%Y-%m-%d %H:%M') if conv.get('createdAt') else 'N/A'}\n"
                details_content += f"   Duration: {duration_min}m {duration_sec}s\n"
                details_content += f"   Messages: {len(conv.get('messages', []))}\n"
                details_content += f"   Rating: {sum(conv.get('aiRatings', {}).values()) if conv.get('aiRatings') else 'N/A'}/50\n\n"
            
            if len(conversations) > 20:
                details_content += f"... and {len(conversations) - 20} more conversations\n"
            
            details_content += f"\nLast Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            
            details_text.insert('1.0', details_content)
            details_text.config(state='disabled')
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to view usage details: {str(e)}")
    
    def reset_monthly_usage(self):
        """Reset monthly usage for selected user or all users"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # Ask for confirmation
            result = messagebox.askyesnocancel(
                "Reset Monthly Usage",
                "Reset monthly usage for:\n\nYes: Selected user only\nNo: All users\nCancel: Abort operation"
            )
            
            if result is None:  # Cancel
                return
            
            if result:  # Selected user only
                selected_item = self.admin.subscription_tree.selection()
                if not selected_item:
                    messagebox.showwarning("Warning", "Please select a user to reset")
                    return
                
                values = self.admin.subscription_tree.item(selected_item[0])['values']
                user_name = values[0]
                
                # Find and reset user
                user = self.admin.users_collection.find_one({
                    '$or': [
                        {'email': user_name},
                        {'firstName': {'$regex': user_name.split()[0], '$options': 'i'}},
                        {'lastName': {'$regex': user_name.split()[-1], '$options': 'i'}}
                    ]
                })
                
                if user:
                    # Update user's monthly usage reset timestamp
                    self.admin.users_collection.update_one(
                        {'_id': user['_id']},
                        {'$set': {'lastUsageReset': datetime.now()}}
                    )
                    messagebox.showinfo("Success", f"Monthly usage reset for {user_name}")
                else:
                    messagebox.showerror("Error", "User not found")
            
            else:  # All users
                if not messagebox.askyesno("Confirm Reset All", "Reset monthly usage for ALL users?\nThis action cannot be undone."):
                    return
                
                # Update all users with reset timestamp
                result = self.admin.users_collection.update_many(
                    {'subscription': {'$exists': True}},
                    {'$set': {'lastUsageReset': datetime.now()}}
                )
                
                messagebox.showinfo("Success", f"Monthly usage reset for {result.modified_count} users")
            
            # Refresh the view
            self.load_subscription_tracking()
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to reset monthly usage: {str(e)}")
    
    def export_usage_report(self):
        """Export usage report to CSV"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            current_month = self.admin.subscription_month_var.get()
            
            # Get all subscription data
            users = list(self.admin.users_collection.find({
                'subscription': {'$exists': True},
                'subscription.plan': {'$ne': None}
            }))
            
            if not users:
                messagebox.showinfo("Info", "No subscription data found to export")
                return
            
            # Create CSV content
            csv_content = "User,Email,Plan,Monthly Limit,Used This Month,Remaining,Usage %,Status,Last Activity\n"
            
            month_start = datetime.strptime(current_month, '%Y-%m')
            month_end = (month_start.replace(day=1) + timedelta(days=32)).replace(day=1)
            
            plan_limits = {'free': 3, 'basic': 10, 'pro': 50, 'enterprise': 200}
            
            for user in users:
                subscription = user.get('subscription', {})
                plan = subscription.get('plan', 'basic')
                monthly_limit = plan_limits.get(plan, 10)
                
                # Count conversations this month
                conversations_this_month = self.admin.conversations_collection.count_documents({
                    'userId': str(user['_id']),
                    'createdAt': {
                        '$gte': month_start,
                        '$lt': month_end
                    }
                })
                
                remaining = max(0, monthly_limit - conversations_this_month)
                usage_percent = (conversations_this_month / monthly_limit * 100) if monthly_limit > 0 else 0
                
                # Determine status
                if conversations_this_month >= monthly_limit:
                    status = "Limit Reached"
                elif usage_percent >= 80:
                    status = "Near Limit"
                else:
                    status = "Active"
                
                # Get last activity
                last_conversation = self.admin.conversations_collection.find_one(
                    {'userId': str(user['_id'])},
                    sort=[('createdAt', -1)]
                )
                last_activity = "Never"
                if last_conversation and last_conversation.get('createdAt'):
                    last_activity = last_conversation['createdAt'].strftime('%Y-%m-%d')
                
                user_name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
                email = user.get('email', '')
                
                csv_content += f'"{user_name}","{email}","{plan.title()}",{monthly_limit},{conversations_this_month},{remaining},{usage_percent:.1f}%,"{status}","{last_activity}"\n'
            
            # Save to file
            filename = f"usage_report_{current_month}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(csv_content)
            
            messagebox.showinfo("Success", f"Usage report exported to {filename}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to export usage report: {str(e)}")
    
    def update_subscription_limits(self):
        """Update subscription limits for users"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # Create a simple dialog for updating limits
            limit_window = tk.Toplevel(self.admin.root)
            limit_window.title("Update Subscription Limits")
            limit_window.geometry("400x300")
            limit_window.grab_set()
            
            tk.Label(limit_window, text="Update Subscription Limits", font=('Arial', 14, 'bold')).pack(pady=10)
            
            # Plan selection
            tk.Label(limit_window, text="Select Plan:").pack(anchor='w', padx=10)
            plan_var = tk.StringVar(value='basic')
            plan_combo = tk.ttk.Combobox(limit_window, textvariable=plan_var,
                                       values=['free', 'basic', 'pro', 'enterprise'])
            plan_combo.pack(anchor='w', padx=10, pady=5)
            
            # New limit
            tk.Label(limit_window, text="New Monthly Limit:").pack(anchor='w', padx=10)
            limit_var = tk.StringVar(value='10')
            limit_entry = tk.Entry(limit_window, textvariable=limit_var, width=10)
            limit_entry.pack(anchor='w', padx=10, pady=5)
            
            def apply_limit_change():
                try:
                    plan = plan_var.get()
                    new_limit = int(limit_var.get())
                    
                    if new_limit < 0:
                        messagebox.showerror("Error", "Limit must be a positive number")
                        return
                    
                    # Update all users with this plan
                    result = self.admin.users_collection.update_many(
                        {'subscription.plan': plan},
                        {'$set': {'subscription.monthlyLimit': new_limit}}
                    )
                    
                    messagebox.showinfo("Success", f"Updated limit for {result.modified_count} users on {plan} plan")
                    limit_window.destroy()
                    self.load_subscription_tracking()
                    
                except ValueError:
                    messagebox.showerror("Error", "Please enter a valid number for the limit")
                except Exception as e:
                    messagebox.showerror("Error", f"Failed to update limits: {str(e)}")
            
            # Buttons
            button_frame = tk.Frame(limit_window)
            button_frame.pack(pady=20)
            
            tk.Button(button_frame, text="Apply Changes", command=apply_limit_change, 
                     bg='#4CAF50', fg='white').pack(side='left', padx=10)
            tk.Button(button_frame, text="Cancel", command=limit_window.destroy, 
                     bg='#607D8B', fg='white').pack(side='left', padx=10)
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to update subscription limits: {str(e)}")
    
    # Conversation Summaries Methods
    def load_all_summaries(self):
        """Load all user summaries from conversationsummaries collection"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # Clear existing items
            for item in self.admin.summaries_tree.get_children():
                self.admin.summaries_tree.delete(item)
            
            # Get latest 20 conversation summaries from conversationsummaries collection
            conversation_summaries = list(self.admin.conversation_summaries_collection.find().sort('createdAt', -1).limit(20))
            
            # Group summaries by user to get the latest summary for each user
            user_summaries = {}
            for summary in conversation_summaries:
                user_id = summary.get('userId')
                if user_id:
                    # Keep the latest summary for each user
                    if user_id not in user_summaries or summary.get('createdAt') > user_summaries[user_id].get('createdAt'):
                        user_summaries[user_id] = summary
            
            for user_id, summary in user_summaries.items():
                # Get user information
                user = self.admin.users_collection.find_one({'_id': ObjectId(user_id)})
                user_name = "Unknown"
                if user:
                    user_name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
                    if not user_name:
                        user_name = user.get('email', 'Unknown')
                
                # Get conversation count from summary
                conversation_count = summary.get('conversationCount', 0)
                summary_number = summary.get('summaryNumber', 'N/A')
                
                # Get overall rating from summary
                overall_rating = summary.get('overallRating', 'N/A')
                rating_str = f"{overall_rating}/10" if overall_rating != 'N/A' else 'N/A'
                
                # Get AI analysis from summary
                ai_analysis = summary.get('aiAnalysis', {})
                summary_text = ""
                if isinstance(ai_analysis, dict):
                    # Try to get a summary from the AI analysis
                    summary_text = ai_analysis.get('summary', '') or ai_analysis.get('overview', '') or str(ai_analysis)
                elif isinstance(ai_analysis, str):
                    summary_text = ai_analysis
                
                # Create summary preview (first 100 characters)
                summary_preview = summary_text[:100] + '...' if len(summary_text) > 100 else summary_text
                if not summary_preview:
                    summary_preview = f"Summary #{summary_number} - {conversation_count} conversations"
                
                # Get strengths and improvements count
                strengths = summary.get('strengths', [])
                improvements = summary.get('improvements', [])
                
                # Get total conversation time for this user
                conversations = list(self.admin.conversations_collection.find({
                    'userId': user_id
                }, {'duration': 1}))
                total_duration = sum(conv.get('duration', 0) for conv in conversations)
                duration_str = f"{total_duration//60}m {total_duration%60}s" if total_duration else "0m 0s"
                
                # Get last activity date
                last_date = summary.get('createdAt', '').strftime('%Y-%m-%d') if summary.get('createdAt') else 'N/A'
                
                # Insert into tree
                self.admin.summaries_tree.insert('', 'end', values=(
                    str(user_id)[:8] + '...',
                    user_name,
                    f"Summary #{summary_number}",
                    summary_preview,
                    duration_str,
                    conversation_count,
                    last_date,
                    rating_str
                ))
            
            messagebox.showinfo("Success", f"Loaded {len(user_summaries)} user summaries")
            
        except Exception as e:
            SecurityAuditLogger.log_security_violation(
                None, "load_all_summaries", "error", "unexpected_error", str(e)
            )
            messagebox.showerror("Error", f"Failed to load user summaries: {str(e)}")
    
    def search_summaries(self, event=None):
        """Search conversation summaries by user ID"""
        try:
            search_term = self.admin.summary_search_var.get().strip()
            
            if not search_term:
                # Show all items if search is empty
                for item in self.admin.summaries_tree.get_children():
                    self.admin.summaries_tree.reattach(item, '', 'end')
                return
            
            # Clear existing items first
            for item in self.admin.summaries_tree.get_children():
                self.admin.summaries_tree.delete(item)
            
            # Search in database by user ID
            try:
                # Try to find summaries by exact user ID match first (as ObjectId)
                summaries = []
                try:
                    # Convert search term to ObjectId if it's a valid ObjectId string
                    user_object_id = ObjectId(search_term)
                    summaries = list(self.admin.conversation_summaries_collection.find({
                        'userId': user_object_id
                    }).sort('createdAt', -1).limit(20))
                except:
                    # If conversion fails, try as string
                    summaries = list(self.admin.conversation_summaries_collection.find({
                        'userId': search_term
                    }).sort('createdAt', -1).limit(20))
                
                # If no exact match, try partial user ID match (convert to ObjectId)
                if not summaries:
                    try:
                        # Try to find summaries where userId starts with the search term
                        user_object_id = ObjectId(search_term)
                        summaries = list(self.admin.conversation_summaries_collection.find({
                            'userId': {'$gte': user_object_id, '$lt': ObjectId(search_term + 'z')}
                        }).sort('createdAt', -1).limit(20))
                    except:
                        # If ObjectId conversion fails, try regex on string representation
                        summaries = list(self.admin.conversation_summaries_collection.find({
                            'userId': {'$regex': search_term, '$options': 'i'}
                        }).sort('createdAt', -1).limit(20))
                
                # If no results, try to find by user name
                if not summaries:
                    # Get users that match the search term
                    users = list(self.admin.users_collection.find({
                        '$or': [
                            {'firstName': {'$regex': search_term, '$options': 'i'}},
                            {'lastName': {'$regex': search_term, '$options': 'i'}},
                            {'email': {'$regex': search_term, '$options': 'i'}}
                        ]
                    }))
                    
                    # Get summaries for matching users
                    if users:
                        user_ids = [str(user['_id']) for user in users]
                        summaries = list(self.admin.conversation_summaries_collection.find({
                            'userId': {'$in': user_ids}
                        }).sort('createdAt', -1).limit(20))
                
                # Display the search results
                for summary in summaries:
                    user_id = summary.get('userId')
                    
                    # Get user information
                    user = self.admin.users_collection.find_one({'_id': ObjectId(user_id)})
                    user_name = "Unknown"
                    if user:
                        user_name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
                        if not user_name:
                            user_name = user.get('email', 'Unknown')
                    
                    # Get summary data
                    conversation_count = summary.get('conversationCount', 0)
                    summary_number = summary.get('summaryNumber', 'N/A')
                    overall_rating = summary.get('overallRating', 'N/A')
                    rating_str = f"{overall_rating}/10" if overall_rating != 'N/A' else 'N/A'
                    
                    # Get AI analysis
                    ai_analysis = summary.get('aiAnalysis', {})
                    summary_text = ""
                    if isinstance(ai_analysis, dict):
                        summary_text = ai_analysis.get('summary', '') or ai_analysis.get('overview', '') or str(ai_analysis)
                    elif isinstance(ai_analysis, str):
                        summary_text = ai_analysis
                    
                    summary_preview = summary_text[:100] + '...' if len(summary_text) > 100 else summary_text
                    if not summary_preview:
                        summary_preview = f"Summary #{summary_number} - {conversation_count} conversations"
                    
                    # Get total conversation time
                    conversations = list(self.admin.conversations_collection.find({
                        'userId': user_id
                    }, {'duration': 1}))
                    total_duration = sum(conv.get('duration', 0) for conv in conversations)
                    duration_str = f"{total_duration//60}m {total_duration%60}s" if total_duration else "0m 0s"
                    
                    # Get last activity date
                    last_date = summary.get('createdAt', '').strftime('%Y-%m-%d') if summary.get('createdAt') else 'N/A'
                    
                    # Insert into tree
                    self.admin.summaries_tree.insert('', 'end', values=(
                        str(user_id)[:8] + '...',
                        user_name,
                        f"Summary #{summary_number}",
                        summary_preview,
                        duration_str,
                        conversation_count,
                        last_date,
                        rating_str
                    ))
                
                if summaries:
                    messagebox.showinfo("Search Results", f"Found {len(summaries)} summaries matching '{search_term}'")
                else:
                    # Debug: show what's actually in the database
                    all_summaries = list(self.admin.conversation_summaries_collection.find().limit(5))
                    debug_info = f"Search term: '{search_term}'\n"
                    debug_info += f"Sample userIds in database:\n"
                    for s in all_summaries:
                        debug_info += f"  - {s.get('userId')} (type: {type(s.get('userId'))})\n"
                    
                    messagebox.showwarning("No Results", f"No summaries found for '{search_term}'\n\n{debug_info}")
                
            except Exception as e:
                messagebox.showerror("Error", f"Search failed: {str(e)}")
                    
        except Exception as e:
            messagebox.showerror("Error", f"Failed to search summaries: {str(e)}")
    
    def clear_summary_filters(self):
        """Clear all summary filters and reload latest 20"""
        try:
            self.admin.summary_search_var.set("")
            # Reload the latest 20 summaries
            self.load_all_summaries()
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to clear filters: {str(e)}")
    
    def view_full_summary(self, event=None):
        """View full user AI summary from conversationsummaries collection"""
        try:
            selected_item = self.admin.summaries_tree.selection()
            if not selected_item:
                messagebox.showwarning("Warning", "Please select a user to view AI summary")
                return
            
            values = self.admin.summaries_tree.item(selected_item[0])['values']
            user_id_partial = values[0]
            user_name = values[1]
            summary_number = values[2].replace('Summary #', '')
            
            # Find the user by partial ID
            user = None
            try:
                # Try to find user by partial ID
                users = list(self.admin.users_collection.find())
                for u in users:
                    if str(u['_id']).startswith(user_id_partial.replace('...', '')):
                        user = u
                        break
            except Exception as e:
                print(f"Error finding user: {e}")
                pass
            
            if not user:
                messagebox.showerror("Error", "User not found")
                return
            
            user_id = str(user['_id'])
            
            # Get the specific summary that was selected (by summary number)
            latest_summary = None
            try:
                # Try to find the specific summary by userId and summaryNumber
                latest_summary = self.admin.conversation_summaries_collection.find_one({
                    'userId': user_id,
                    'summaryNumber': int(summary_number)
                })
                
                # If not found by summaryNumber, get the latest one
                if not latest_summary:
                    latest_summary = self.admin.conversation_summaries_collection.find_one(
                        {'userId': user_id},
                        sort=[('createdAt', -1)]
                    )
                
                # If still not found, try with ObjectId
                if not latest_summary:
                    try:
                        latest_summary = self.admin.conversation_summaries_collection.find_one({
                            'userId': ObjectId(user_id)
                        }, sort=[('createdAt', -1)])
                    except:
                        pass
                        
            except Exception as e:
                print(f"Error finding summary: {e}")
            
            if not latest_summary:
                # Show all available summaries for debugging
                all_summaries = list(self.admin.conversation_summaries_collection.find().sort('createdAt', -1))
                print(f"Debug: Looking for user_id: {user_id}, summary_number: {summary_number}")
                print(f"Debug: Available summaries:")
                for s in all_summaries[:5]:  # Show first 5
                    print(f"  - UserId: {s.get('userId')} (type: {type(s.get('userId'))}), Summary #{s.get('summaryNumber')}")
                
                messagebox.showerror("Error", f"No conversation summary found for this user.\nUser ID: {user_id}\nSummary Number: {summary_number}\nFound {len(all_summaries)} total summaries in database.")
                return
            
            # Get all summaries for this user to show progression
            all_summaries = list(self.admin.conversation_summaries_collection.find({
                'userId': user_id
            }).sort('createdAt', -1))
            
            # Create summary window
            summary_window = tk.Toplevel(self.admin.root)
            summary_window.title(f"User AI Summary - {user_name}")
            summary_window.geometry("1000x700")
            
            summary_text = scrolledtext.ScrolledText(summary_window)
            summary_text.pack(fill='both', expand=True, padx=10, pady=10)
            
            # Format full AI summary
            summary_content = f"""
USER AI SUMMARY DETAILS
{'=' * 60}

User ID: {user_id}
Name: {user_name}
Email: {user.get('email', 'N/A')}
Registration Date: {user.get('createdAt', '').strftime('%Y-%m-%d') if user.get('createdAt') else 'N/A'}

LATEST SUMMARY (#{latest_summary.get('summaryNumber', 'N/A')})
{'-' * 40}
Created: {latest_summary.get('createdAt', '').strftime('%Y-%m-%d %H:%M') if latest_summary.get('createdAt') else 'N/A'}
Conversation Count: {latest_summary.get('conversationCount', 0)}
Overall Rating: {latest_summary.get('overallRating', 'N/A')}/10

STRENGTHS:
"""
            
            # Add strengths
            strengths = latest_summary.get('strengths', [])
            if strengths:
                for i, strength in enumerate(strengths, 1):
                    summary_content += f"{i}. {strength}\n"
            else:
                summary_content += "No strengths identified\n"
            
            summary_content += "\nIMPROVEMENTS:\n"
            # Add improvements
            improvements = latest_summary.get('improvements', [])
            if improvements:
                for i, improvement in enumerate(improvements, 1):
                    summary_content += f"{i}. {improvement}\n"
            else:
                summary_content += "No improvements identified\n"
            
            # Add AI Analysis
            ai_analysis = latest_summary.get('aiAnalysis', {})
            if ai_analysis:
                summary_content += f"\nAI ANALYSIS:\n{'-' * 20}\n"
                if isinstance(ai_analysis, dict):
                    for key, value in ai_analysis.items():
                        summary_content += f"{key}: {value}\n"
                else:
                    summary_content += f"{ai_analysis}\n"
            
            # Add stage ratings
            stage_ratings = latest_summary.get('stageRatings', {})
            if stage_ratings:
                summary_content += f"\nSTAGE RATINGS:\n{'-' * 20}\n"
                for stage, rating in stage_ratings.items():
                    summary_content += f"{stage}: {rating}\n"
            
            # Add date range
            date_range = latest_summary.get('dateRange', {})
            if date_range:
                summary_content += f"\nDATE RANGE:\n{'-' * 20}\n"
                if isinstance(date_range, dict):
                    for key, value in date_range.items():
                        summary_content += f"{key}: {value}\n"
                else:
                    summary_content += f"{date_range}\n"
            
            # Show summary progression
            summary_content += f"\nSUMMARY PROGRESSION:\n{'-' * 30}\n"
            for summary in all_summaries[:10]:  # Show last 10 summaries
                summary_num = summary.get('summaryNumber', 'N/A')
                rating = summary.get('overallRating', 'N/A')
                conv_count = summary.get('conversationCount', 0)
                created = summary.get('createdAt', '').strftime('%Y-%m-%d') if summary.get('createdAt') else 'N/A'
                summary_content += f"Summary #{summary_num}: {rating}/10 ({conv_count} convs) - {created}\n"
            
            summary_text.insert('1.0', summary_content)
            summary_text.config(state='disabled')
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to view AI summary: {str(e)}")
    
    def view_conversation_from_summary(self, event=None):
        """View user's conversations from summary selection"""
        try:
            selected_item = self.admin.summaries_tree.selection()
            if not selected_item:
                messagebox.showwarning("Warning", "Please select a user")
                return
            
            values = self.admin.summaries_tree.item(selected_item[0])['values']
            user_id_partial = values[0]
            user_name = values[1]
            
            # Find the user by partial ID
            user = None
            try:
                # Try to find user by partial ID
                users = list(self.admin.users_collection.find())
                for u in users:
                    if str(u['_id']).startswith(user_id_partial.replace('...', '')):
                        user = u
                        break
            except Exception as e:
                print(f"Error finding user: {e}")
                pass
            
            if not user:
                messagebox.showerror("Error", "User not found")
                return
            
            user_id = str(user['_id'])
            
            # Get all user's conversations
            conversations = list(self.admin.conversations_collection.find({
                'userId': user_id
            }).sort('createdAt', -1))
            
            if not conversations:
                messagebox.showinfo("Info", f"No conversations found for {user_name}")
                return
            
            # Create conversations window
            conv_window = tk.Toplevel(self.admin.root)
            conv_window.title(f"User Conversations - {user_name}")
            conv_window.geometry("1000x700")
            
            conv_text = scrolledtext.ScrolledText(conv_window)
            conv_text.pack(fill='both', expand=True, padx=10, pady=10)
            
            # Format all conversations
            conv_content = f"""
USER CONVERSATIONS
{'=' * 50}

User: {user_name}
User ID: {user_id}
Total Conversations: {len(conversations)}

"""
            
            for i, conversation in enumerate(conversations, 1):
                conv_id = str(conversation['_id'])
                title = conversation.get('title', 'Untitled')
                duration = conversation.get('duration', 0)
                duration_str = f"{duration//60}m {duration%60}s" if duration else "0m 0s"
                created_at = conversation.get('createdAt', '').strftime('%Y-%m-%d %H:%M') if conversation.get('createdAt') else 'N/A'
                messages = conversation.get('messages', [])
                
                conv_content += f"""
CONVERSATION {i}
{'-' * 30}
ID: {conv_id}
Title: {title}
Date: {created_at}
Duration: {duration_str}
Messages: {len(messages)}

MESSAGES:
"""
                
                for j, message in enumerate(messages, 1):
                    role = message.get('role', 'unknown')
                    content = message.get('content', '')
                    timestamp = message.get('timestamp', '')
                    
                    conv_content += f"\n[{j}] {role.upper()} ({timestamp}):\n"
                    conv_content += f"{content}\n"
                    conv_content += "-" * 20 + "\n"
                
                conv_content += "\n" + "=" * 50 + "\n"
            
            conv_text.insert('1.0', conv_content)
            conv_text.config(state='disabled')
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to view conversations: {str(e)}")
    
    def export_summaries(self):
        """Export user AI summaries from conversationsummaries collection to CSV"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # Get all conversation summaries
            conversation_summaries = list(self.admin.conversation_summaries_collection.find().sort('createdAt', -1))
            
            if not conversation_summaries:
                messagebox.showinfo("Info", "No conversation summaries found to export")
                return
            
            # Create CSV content
            csv_content = "User ID,Name,Email,Summary Number,Conversation Count,Overall Rating,Strengths,Improvements,AI Analysis,Date Range,Stage Ratings,Example Conversations,Created Date\n"
            
            for summary in conversation_summaries:
                user_id = summary.get('userId')
                
                # Get user information
                user = self.admin.users_collection.find_one({'_id': ObjectId(user_id)})
                user_name = "Unknown"
                user_email = "N/A"
                if user:
                    user_name = f"{user.get('firstName', '')} {user.get('lastName', '')}".strip()
                    if not user_name:
                        user_name = user.get('email', 'Unknown')
                    user_email = user.get('email', 'N/A')
                
                # Get summary data
                summary_number = summary.get('summaryNumber', 'N/A')
                conversation_count = summary.get('conversationCount', 0)
                overall_rating = summary.get('overallRating', 'N/A')
                
                # Format arrays for CSV
                strengths = summary.get('strengths', [])
                strengths_str = '; '.join(strengths) if strengths else 'None'
                
                improvements = summary.get('improvements', [])
                improvements_str = '; '.join(improvements) if improvements else 'None'
                
                # Get AI analysis
                ai_analysis = summary.get('aiAnalysis', {})
                ai_analysis_str = str(ai_analysis) if ai_analysis else 'None'
                ai_analysis_str = ai_analysis_str.replace('"', '""').replace('\n', ' ')
                
                # Get date range
                date_range = summary.get('dateRange', {})
                date_range_str = str(date_range) if date_range else 'None'
                
                # Get stage ratings
                stage_ratings = summary.get('stageRatings', {})
                stage_ratings_str = str(stage_ratings) if stage_ratings else 'None'
                
                # Get example conversations count
                example_conversations = summary.get('exampleConversations', [])
                example_conv_count = len(example_conversations) if example_conversations else 0
                
                # Get created date
                created_date = summary.get('createdAt', '').strftime('%Y-%m-%d %H:%M') if summary.get('createdAt') else 'N/A'
                
                # Add to CSV (escape quotes and newlines)
                csv_content += f'"{user_id}","{user_name}","{user_email}","{summary_number}",{conversation_count},"{overall_rating}","{strengths_str}","{improvements_str}","{ai_analysis_str}","{date_range_str}","{stage_ratings_str}",{example_conv_count},"{created_date}"\n'
            
            # Save to file
            filename = f"conversation_summaries_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(csv_content)
            
            messagebox.showinfo("Success", f"Conversation summaries exported to {filename}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to export summaries: {str(e)}")
    
    def generate_summary_report(self):
        """Generate a comprehensive summary report"""
        try:
            if not self.admin.connected:
                messagebox.showerror("Error", "Not connected to database")
                return
            
            # Get all conversations with summaries
            conversations = list(self.admin.conversations_collection.find({
                'summary': {'$exists': True, '$ne': None}
            }))
            
            if not conversations:
                messagebox.showinfo("Info", "No summaries found to generate report")
                return
            
            # Calculate statistics
            total_conversations = len(conversations)
            total_duration = sum(conv.get('duration', 0) for conv in conversations)
            total_messages = sum(len(conv.get('messages', [])) for conv in conversations)
            
            # Average duration
            avg_duration = total_duration / total_conversations if total_conversations > 0 else 0
            avg_duration_min = avg_duration // 60
            avg_duration_sec = avg_duration % 60
            
            # Average messages per conversation
            avg_messages = total_messages / total_conversations if total_conversations > 0 else 0
            
            # Rating distribution
            ratings_count = {'excellent': 0, 'good': 0, 'average': 0, 'poor': 0}
            for conv in conversations:
                ratings = conv.get('aiRatings', {})
                if ratings:
                    total_score = sum([
                        ratings.get('introduction', 0),
                        ratings.get('mapping', 0),
                        ratings.get('productPresentation', 0),
                        ratings.get('objectionHandling', 0),
                        ratings.get('close', 0)
                    ])
                    
                    if total_score >= 40:
                        ratings_count['excellent'] += 1
                    elif total_score >= 30:
                        ratings_count['good'] += 1
                    elif total_score >= 20:
                        ratings_count['average'] += 1
                    else:
                        ratings_count['poor'] += 1
            
            # Create report
            report_window = tk.Toplevel(self.admin.root)
            report_window.title("Conversation Summary Report")
            report_window.geometry("800x600")
            
            report_text = scrolledtext.ScrolledText(report_window)
            report_text.pack(fill='both', expand=True, padx=10, pady=10)
            
            report_content = f"""
CONVERSATION SUMMARY REPORT
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

SUMMARY STATISTICS:
- Total Conversations: {total_conversations:,}
- Total Duration: {total_duration//3600:.1f} hours
- Total Messages: {total_messages:,}
- Average Duration: {avg_duration_min:.0f}m {avg_duration_sec:.0f}s
- Average Messages per Conversation: {avg_messages:.1f}

RATING DISTRIBUTION:
- Excellent (40-50): {ratings_count['excellent']} conversations
- Good (30-39): {ratings_count['good']} conversations
- Average (20-29): {ratings_count['average']} conversations
- Poor (0-19): {ratings_count['poor']} conversations

RECENT ACTIVITY:
"""
            
            # Add recent conversations
            recent_conversations = sorted(conversations, key=lambda x: x.get('createdAt', datetime.min), reverse=True)[:10]
            for i, conv in enumerate(recent_conversations, 1):
                title = conv.get('title', 'Untitled')[:50]
                date = conv.get('createdAt', '').strftime('%Y-%m-%d') if conv.get('createdAt') else 'N/A'
                duration = conv.get('duration', 0)
                duration_str = f"{duration//60}m {duration%60}s" if duration else "0m 0s"
                
                report_content += f"{i}. {title} - {date} ({duration_str})\n"
            
            report_content += f"\nLast Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
            
            report_text.insert('1.0', report_content)
            report_text.config(state='disabled')
            
        except Exception as e:
            messagebox.showerror("Error", f"Failed to generate summary report: {str(e)}")
