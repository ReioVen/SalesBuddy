"""
Additional methods for SalesBuddy Admin Panel
"""

import tkinter as tk
from tkinter import messagebox, simpledialog
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
            
            # Update stat cards
            self.admin.stat_total_users.config(text=str(total_users))
            self.admin.stat_active_companies.config(text=str(active_companies))
            self.admin.stat_total_conversations.config(text=str(total_conversations))
            self.admin.stat_todays_conversations.config(text=str(today_conversations))
            self.admin.stat_active_subscriptions.config(text=str(active_subscriptions))
            self.admin.stat_revenue_mtd.config(text=f"${revenue_mtd}")
            
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
            messagebox.showerror("Error", "An error occurred during search")
    
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
            messagebox.showerror("Error", "An error occurred during search")
    
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
        """Filter conversations by username"""
        if not self.admin.connected:
            return
        
        try:
            # Clear existing items
            for item in self.admin.conversations_tree.get_children():
                self.admin.conversations_tree.delete(item)
            
            # Validate and sanitize username input
            raw_username = self.admin.conversation_username_var.get()
            username = InputValidator.validate_and_sanitize_input(
                raw_username, 'search', is_required=False
            ).strip()
            
            if not username:
                self.load_conversations()  # Load all if empty
                return
            
            # Use secure database query builder for user search
            user_filter = SecureDatabaseQueries.build_secure_filter(
                'firstName', username, '$regex'
            )
            user_filter.update(SecureDatabaseQueries.build_secure_filter(
                'lastName', username, '$regex'
            ))
            user_filter.update(SecureDatabaseQueries.build_secure_filter(
                'email', username, '$regex'
            ))
            
            # Search for users matching the username
            users = list(self.admin.users_collection.find({
                '$or': [
                    {'firstName': {'$regex': username, '$options': 'i'}},
                    {'lastName': {'$regex': username, '$options': 'i'}},
                    {'email': {'$regex': username, '$options': 'i'}}
                ]
            }))
            
            if not users:
                messagebox.showinfo("No Results", f"No users found matching '{username}'")
                return
            
            # Get conversations for these users (limit to 30 for performance)
            user_ids = [user['_id'] for user in users]
            conversations = list(self.admin.conversations_collection.find({
                'userId': {'$in': user_ids}
            }).sort('createdAt', -1).limit(30))
            
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
