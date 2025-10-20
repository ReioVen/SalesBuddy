#!/usr/bin/env python3
"""
SalesBuddy Admin Panel
A comprehensive GUI admin panel for managing SalesBuddy database
"""

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext
import pymongo
from pymongo import MongoClient
import os
from datetime import datetime, timedelta
import json
from bson import ObjectId
import threading
from typing import Dict, List, Any, Optional
from admin_methods import AdminMethods
from security_module import (
    InputValidator, SecureDatabaseQueries, SecurityError, 
    SecurityAuditLogger, secure_input_wrapper
)

class SalesBuddyAdmin:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("SalesBuddy Admin Panel")
        self.root.geometry("1400x900")
        self.root.configure(bg='#f0f0f0')
        
        # Database connection
        self.client = None
        self.db = None
        self.connected = False
        
        # Collections
        self.users_collection = None
        self.companies_collection = None
        self.conversations_collection = None
        self.conversation_summaries_collection = None
        
        # Initialize methods
        self.methods = AdminMethods(self)
        
        self.setup_ui()
        self.connect_to_database()
        
    def setup_ui(self):
        """Setup the main UI"""
        # Create main notebook for tabs
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Status bar
        self.status_frame = tk.Frame(self.root, bg='#e0e0e0', height=30)
        self.status_frame.pack(side='bottom', fill='x')
        self.status_label = tk.Label(self.status_frame, text="Disconnected", bg='#e0e0e0')
        self.status_label.pack(side='left', padx=10)
        
        # Create tabs
        self.create_dashboard_tab()
        self.create_users_tab()
        self.create_companies_tab()
        self.create_conversations_tab()
        self.create_voice_settings_tab()
        self.create_ai_ratings_tab()
        self.create_subscription_tracking_tab()
        self.create_translations_tab()
        self.create_analytics_tab()
        self.create_settings_tab()
        
    def create_dashboard_tab(self):
        """Create dashboard tab with overview statistics"""
        dashboard_frame = ttk.Frame(self.notebook)
        self.notebook.add(dashboard_frame, text="Dashboard")
        
        # Dashboard title
        title_label = tk.Label(dashboard_frame, text="SalesBuddy Admin Dashboard", 
                              font=('Arial', 16, 'bold'))
        title_label.pack(pady=20)
        
        # Stats frame
        stats_frame = tk.Frame(dashboard_frame)
        stats_frame.pack(fill='x', padx=20, pady=10)
        
        # Create stat cards
        self.create_stat_card(stats_frame, "Total Users", "0", 0, 0)
        self.create_stat_card(stats_frame, "Active Companies", "0", 0, 1)
        self.create_stat_card(stats_frame, "Total Conversations", "0", 0, 2)
        self.create_stat_card(stats_frame, "Today's Conversations", "0", 1, 0)
        self.create_stat_card(stats_frame, "Active Subscriptions", "0", 1, 1)
        self.create_stat_card(stats_frame, "Revenue (MTD)", "$0", 1, 2)
        self.create_stat_card(stats_frame, "Monthly Calls Used", "0/0", 2, 0)
        self.create_stat_card(stats_frame, "Calls This Week", "0", 2, 1)
        self.create_stat_card(stats_frame, "Avg. Call Duration", "0m", 2, 2)
        
        # Refresh button
        refresh_btn = tk.Button(dashboard_frame, text="Refresh Dashboard", 
                               command=self.methods.refresh_dashboard, bg='#4CAF50', fg='white')
        refresh_btn.pack(pady=20)
        
        # Recent activity frame
        activity_frame = tk.LabelFrame(dashboard_frame, text="Recent Activity", font=('Arial', 12, 'bold'))
        activity_frame.pack(fill='both', expand=True, padx=20, pady=10)
        
        self.activity_text = scrolledtext.ScrolledText(activity_frame, height=15)
        self.activity_text.pack(fill='both', expand=True, padx=10, pady=10)
        
    def create_stat_card(self, parent, title, value, row, col):
        """Create a statistics card"""
        card_frame = tk.Frame(parent, bg='white', relief='raised', bd=2)
        card_frame.grid(row=row, column=col, padx=10, pady=10, sticky='ew')
        parent.grid_columnconfigure(col, weight=1)
        
        title_label = tk.Label(card_frame, text=title, font=('Arial', 10, 'bold'), bg='white')
        title_label.pack(pady=(10, 5))
        
        value_label = tk.Label(card_frame, text=value, font=('Arial', 18, 'bold'), 
                              fg='#2196F3', bg='white')
        value_label.pack(pady=(0, 10))
        
        # Store reference for updating
        stat_name = title.lower().replace(' ', '_').replace("'", '').replace('(', '').replace(')', '').replace(':', '').replace('-', '_').replace('.', '')
        attr_name = f"stat_{stat_name}"
        setattr(self, attr_name, value_label)
        
    def create_users_tab(self):
        """Create users management tab"""
        users_frame = ttk.Frame(self.notebook)
        self.notebook.add(users_frame, text="Users")
        
        # Search and filter frame
        search_frame = tk.Frame(users_frame)
        search_frame.pack(fill='x', padx=10, pady=10)
        
        tk.Label(search_frame, text="Search Users:", font=('Arial', 12, 'bold')).pack(side='left')
        self.user_search_var = tk.StringVar()
        search_entry = tk.Entry(search_frame, textvariable=self.user_search_var, width=30)
        search_entry.pack(side='left', padx=10)
        search_entry.bind('<KeyRelease>', self.methods.search_users)
        
        # Filter buttons
        filter_frame = tk.Frame(search_frame)
        filter_frame.pack(side='right')
        
        tk.Button(filter_frame, text="All", command=lambda: self.methods.filter_users('all')).pack(side='left', padx=2)
        tk.Button(filter_frame, text="Admins", command=lambda: self.methods.filter_users('admin')).pack(side='left', padx=2)
        tk.Button(filter_frame, text="Company Users", command=lambda: self.methods.filter_users('company')).pack(side='left', padx=2)
        tk.Button(filter_frame, text="Individual", command=lambda: self.methods.filter_users('individual')).pack(side='left', padx=2)
        
        # Users treeview
        columns = ('ID', 'Name', 'Email', 'Role', 'Company', 'Plan', 'Status', 'Last Login', 'Created')
        self.users_tree = ttk.Treeview(users_frame, columns=columns, show='headings', height=15)
        
        for col in columns:
            self.users_tree.heading(col, text=col)
            self.users_tree.column(col, width=120)
        
        # Scrollbar for users tree
        users_scrollbar = ttk.Scrollbar(users_frame, orient='vertical', command=self.users_tree.yview)
        self.users_tree.configure(yscrollcommand=users_scrollbar.set)
        
        # Pack users tree and scrollbar
        self.users_tree.pack(side='left', fill='both', expand=True, padx=(10, 0), pady=10)
        users_scrollbar.pack(side='right', fill='y', pady=10)
        
        # User actions frame
        actions_frame = tk.Frame(users_frame)
        actions_frame.pack(fill='x', padx=10, pady=10)
        
        tk.Button(actions_frame, text="View Details", command=self.methods.view_user_details, 
                 bg='#2196F3', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Edit User", command=self.methods.edit_user, 
                 bg='#FF9800', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Delete User", command=self.methods.delete_user, 
                 bg='#F44336', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Refresh", command=self.methods.load_users, 
                 bg='#4CAF50', fg='white').pack(side='left', padx=5)
        
        # Bind double-click event
        self.users_tree.bind('<Double-1>', self.methods.view_user_details)
        
    def create_companies_tab(self):
        """Create companies management tab"""
        companies_frame = ttk.Frame(self.notebook)
        self.notebook.add(companies_frame, text="Companies")
        
        # Search frame
        search_frame = tk.Frame(companies_frame)
        search_frame.pack(fill='x', padx=10, pady=10)
        
        tk.Label(search_frame, text="Search Companies:", font=('Arial', 12, 'bold')).pack(side='left')
        self.company_search_var = tk.StringVar()
        search_entry = tk.Entry(search_frame, textvariable=self.company_search_var, width=30)
        search_entry.pack(side='left', padx=10)
        search_entry.bind('<KeyRelease>', self.methods.search_companies)
        
        # Companies treeview
        columns = ('ID', 'Name', 'Industry', 'Size', 'Admin', 'Users', 'Plan', 'Status', 'Created')
        self.companies_tree = ttk.Treeview(companies_frame, columns=columns, show='headings', height=15)
        
        for col in columns:
            self.companies_tree.heading(col, text=col)
            self.companies_tree.column(col, width=120)
        
        # Scrollbar for companies tree
        companies_scrollbar = ttk.Scrollbar(companies_frame, orient='vertical', command=self.companies_tree.yview)
        self.companies_tree.configure(yscrollcommand=companies_scrollbar.set)
        
        # Pack companies tree and scrollbar
        self.companies_tree.pack(side='left', fill='both', expand=True, padx=(10, 0), pady=10)
        companies_scrollbar.pack(side='right', fill='y', pady=10)
        
        # Company actions frame
        actions_frame = tk.Frame(companies_frame)
        actions_frame.pack(fill='x', padx=10, pady=10)
        
        tk.Button(actions_frame, text="View Details", command=self.methods.view_company_details, 
                 bg='#2196F3', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Edit Company", command=self.methods.edit_company, 
                 bg='#FF9800', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Manage Users", command=self.methods.manage_company_users, 
                 bg='#9C27B0', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Refresh", command=self.methods.load_companies, 
                 bg='#4CAF50', fg='white').pack(side='left', padx=5)
        
        # Bind double-click event
        self.companies_tree.bind('<Double-1>', self.methods.view_company_details)
        
    def create_conversations_tab(self):
        """Create conversations management tab"""
        conversations_frame = ttk.Frame(self.notebook)
        self.notebook.add(conversations_frame, text="Conversations")
        
        # Filter frame
        filter_frame = tk.Frame(conversations_frame)
        filter_frame.pack(fill='x', padx=10, pady=10)
        
        tk.Label(filter_frame, text="Date Range:", font=('Arial', 12, 'bold')).pack(side='left')
        
        self.date_from_var = tk.StringVar(value=(datetime.now() - timedelta(days=7)).strftime('%Y-%m-%d'))
        tk.Label(filter_frame, text="From:").pack(side='left', padx=(20, 5))
        tk.Entry(filter_frame, textvariable=self.date_from_var, width=12).pack(side='left', padx=5)
        
        self.date_to_var = tk.StringVar(value=datetime.now().strftime('%Y-%m-%d'))
        tk.Label(filter_frame, text="To:").pack(side='left', padx=(20, 5))
        tk.Entry(filter_frame, textvariable=self.date_to_var, width=12).pack(side='left', padx=5)
        
        tk.Button(filter_frame, text="Apply Filter", command=self.methods.filter_conversations, 
                 bg='#4CAF50', fg='white').pack(side='left', padx=20)
        
        # Username search frame
        username_frame = tk.Frame(conversations_frame)
        username_frame.pack(fill='x', padx=10, pady=5)
        
        tk.Label(username_frame, text="Search by User ID/Name:").pack(side='left')
        self.conversation_username_var = tk.StringVar()
        username_entry = tk.Entry(username_frame, textvariable=self.conversation_username_var, width=25)
        username_entry.pack(side='left', padx=5)
        # Remove auto-search on keystroke
        
        tk.Button(username_frame, text="Search by User", command=self.methods.filter_conversations_by_username, 
                 bg='#FF9800', fg='white').pack(side='left', padx=5)
        tk.Button(username_frame, text="Clear Filters", command=self.methods.clear_conversation_filters, 
                 bg='#607D8B', fg='white').pack(side='left', padx=5)
        
        # Conversations treeview
        columns = ('ID', 'User', 'Title', 'Scenario', 'Messages', 'Rating', 'Duration', 'Created')
        self.conversations_tree = ttk.Treeview(conversations_frame, columns=columns, show='headings', height=15)
        
        for col in columns:
            self.conversations_tree.heading(col, text=col)
            self.conversations_tree.column(col, width=120)
        
        # Scrollbar for conversations tree
        conversations_scrollbar = ttk.Scrollbar(conversations_frame, orient='vertical', command=self.conversations_tree.yview)
        self.conversations_tree.configure(yscrollcommand=conversations_scrollbar.set)
        
        # Pack conversations tree and scrollbar
        self.conversations_tree.pack(side='left', fill='both', expand=True, padx=(10, 0), pady=10)
        conversations_scrollbar.pack(side='right', fill='y', pady=10)
        
        # Conversation actions frame
        actions_frame = tk.Frame(conversations_frame)
        actions_frame.pack(fill='x', padx=10, pady=10)
        
        tk.Button(actions_frame, text="View Conversation", command=self.methods.view_conversation, 
                 bg='#2196F3', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Export Data", command=self.methods.export_conversations, 
                 bg='#607D8B', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Refresh", command=self.methods.load_conversations, 
                 bg='#4CAF50', fg='white').pack(side='left', padx=5)
        
        # Bind double-click event
        self.conversations_tree.bind('<Double-1>', self.methods.view_conversation)
        
    def create_voice_settings_tab(self):
        """Create AI voice settings management tab"""
        voice_frame = ttk.Frame(self.notebook)
        self.notebook.add(voice_frame, text="Voice Settings")
        
        # Title
        title_label = tk.Label(voice_frame, text="AI Voice & TTS Configuration", 
                              font=('Arial', 16, 'bold'))
        title_label.pack(pady=20)
        
        # Voice speed settings frame
        speed_frame = tk.LabelFrame(voice_frame, text="Voice Speed Settings", font=('Arial', 12, 'bold'))
        speed_frame.pack(fill='x', padx=20, pady=10)
        
        # Browser TTS settings
        browser_frame = tk.Frame(speed_frame)
        browser_frame.pack(fill='x', padx=10, pady=10)
        
        tk.Label(browser_frame, text="Browser TTS Speed (Rate):", font=('Arial', 10, 'bold')).pack(anchor='w')
        self.browser_tts_rate_var = tk.StringVar(value="1.6")
        tk.Entry(browser_frame, textvariable=self.browser_tts_rate_var, width=10).pack(anchor='w', pady=5)
        tk.Label(browser_frame, text="Current: 1.6 (60% faster than default)", fg='gray').pack(anchor='w')
        
        # Azure TTS settings
        azure_frame = tk.Frame(speed_frame)
        azure_frame.pack(fill='x', padx=10, pady=10)
        
        tk.Label(azure_frame, text="Azure TTS Speed (Rate):", font=('Arial', 10, 'bold')).pack(anchor='w')
        self.azure_tts_rate_var = tk.StringVar(value="1.2")
        tk.Entry(azure_frame, textvariable=self.azure_tts_rate_var, width=10).pack(anchor='w', pady=5)
        tk.Label(azure_frame, text="Current: 1.2 (20% faster than default)", fg='gray').pack(anchor='w')
        
        # Response delay settings
        delay_frame = tk.LabelFrame(voice_frame, text="AI Response Timing", font=('Arial', 12, 'bold'))
        delay_frame.pack(fill='x', padx=20, pady=10)
        
        tk.Label(delay_frame, text="Auto-send delay after user stops speaking (milliseconds):", font=('Arial', 10, 'bold')).pack(anchor='w', padx=10, pady=5)
        self.response_delay_var = tk.StringVar(value="1800")
        tk.Entry(delay_frame, textvariable=self.response_delay_var, width=10).pack(anchor='w', padx=10, pady=5)
        tk.Label(delay_frame, text="Current: 1800ms (1.8 seconds)", fg='gray').pack(anchor='w', padx=10)
        
        # Voice quality settings
        quality_frame = tk.LabelFrame(voice_frame, text="Voice Quality Settings", font=('Arial', 12, 'bold'))
        quality_frame.pack(fill='x', padx=20, pady=10)
        
        tk.Label(quality_frame, text="Default Pitch:", font=('Arial', 10, 'bold')).pack(anchor='w', padx=10, pady=5)
        self.voice_pitch_var = tk.StringVar(value="0.98")
        tk.Entry(quality_frame, textvariable=self.voice_pitch_var, width=10).pack(anchor='w', padx=10, pady=5)
        
        tk.Label(quality_frame, text="Default Volume:", font=('Arial', 10, 'bold')).pack(anchor='w', padx=10, pady=5)
        self.voice_volume_var = tk.StringVar(value="0.85")
        tk.Entry(quality_frame, textvariable=self.voice_volume_var, width=10).pack(anchor='w', padx=10, pady=5)
        
        # Language-specific voice settings
        lang_frame = tk.LabelFrame(voice_frame, text="Language-Specific Voice Settings", font=('Arial', 12, 'bold'))
        lang_frame.pack(fill='x', padx=20, pady=10)
        
        # Language selection
        tk.Label(lang_frame, text="Select Language:", font=('Arial', 10, 'bold')).pack(anchor='w', padx=10, pady=5)
        self.voice_language_var = tk.StringVar(value='et')
        lang_combo = tk.ttk.Combobox(lang_frame, textvariable=self.voice_language_var,
                                   values=['en', 'et', 'es', 'ru', 'lv', 'lt', 'fi', 'sv', 'no', 'da', 'de', 'fr', 'it', 'pt', 'pl', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl', 'el', 'tr', 'ar', 'he', 'ja', 'ko', 'zh', 'hi', 'th', 'vi', 'id', 'ms', 'tl'], width=10)
        lang_combo.pack(anchor='w', padx=10, pady=5)
        
        # Voice actions frame
        actions_frame = tk.Frame(voice_frame)
        actions_frame.pack(fill='x', padx=20, pady=20)
        
        tk.Button(actions_frame, text="Apply Voice Settings", command=self.methods.apply_voice_settings, 
                 bg='#4CAF50', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Test Voice", command=self.methods.test_voice_settings, 
                 bg='#2196F3', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Reset to Defaults", command=self.methods.reset_voice_settings, 
                 bg='#FF9800', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Export Settings", command=self.methods.export_voice_settings, 
                 bg='#607D8B', fg='white').pack(side='left', padx=5)
        
    def create_ai_ratings_tab(self):
        """Create conversation summaries tab"""
        summaries_frame = ttk.Frame(self.notebook)
        self.notebook.add(summaries_frame, text="Conversation Summaries")
        
        # Title
        title_label = tk.Label(summaries_frame, text="All Conversation Summaries", 
                              font=('Arial', 16, 'bold'))
        title_label.pack(pady=20)
        
        # Filter frame
        filter_frame = tk.Frame(summaries_frame)
        filter_frame.pack(fill='x', padx=20, pady=10)
        
        tk.Label(filter_frame, text="Search by Name/ID:", font=('Arial', 12, 'bold')).pack(side='left')
        self.summary_search_var = tk.StringVar()
        search_entry = tk.Entry(filter_frame, textvariable=self.summary_search_var, width=25)
        search_entry.pack(side='left', padx=5)
        
        tk.Button(filter_frame, text="Search", command=self.methods.search_summaries, 
                 bg='#4CAF50', fg='white').pack(side='left', padx=5)
        tk.Button(filter_frame, text="Clear", command=self.methods.clear_summary_filters, 
                 bg='#607D8B', fg='white').pack(side='left', padx=5)
        tk.Button(filter_frame, text="Refresh", command=self.methods.load_all_summaries, 
                 bg='#2196F3', fg='white').pack(side='left', padx=5)
        
        # Enhanced AI Ratings treeview with comprehensive scoring
        columns = ('Conversation ID', 'User', 'Total Score', 'Opening', 'Discovery', 'Presentation', 'Objections', 'Closing', 'Date')
        self.summaries_tree = ttk.Treeview(summaries_frame, columns=columns, show='headings', height=15)
        
        for col in columns:
            self.summaries_tree.heading(col, text=col)
            if col == 'Total Score':
                self.summaries_tree.column(col, width=150)
            elif col in ['Opening', 'Discovery', 'Presentation', 'Objections', 'Closing']:
                self.summaries_tree.column(col, width=100)
            elif col == 'Conversation ID':
                self.summaries_tree.column(col, width=120)
            else:
                self.summaries_tree.column(col, width=120)
        
        # Scrollbar for summaries tree
        summaries_scrollbar = ttk.Scrollbar(summaries_frame, orient='vertical', command=self.summaries_tree.yview)
        self.summaries_tree.configure(yscrollcommand=summaries_scrollbar.set)
        
        # Pack summaries tree and scrollbar
        self.summaries_tree.pack(side='left', fill='both', expand=True, padx=(20, 0), pady=10)
        summaries_scrollbar.pack(side='right', fill='y', pady=10)
        
        # Summary actions frame
        actions_frame = tk.Frame(summaries_frame)
        actions_frame.pack(fill='x', padx=20, pady=10)
        
        tk.Button(actions_frame, text="View AI Summary", command=self.methods.view_full_summary, 
                 bg='#2196F3', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="View All Conversations", command=self.methods.view_conversation_from_summary, 
                 bg='#FF9800', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Export Summaries", command=self.methods.export_summaries, 
                 bg='#607D8B', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Generate Report", command=self.methods.generate_summary_report, 
                 bg='#9C27B0', fg='white').pack(side='left', padx=5)
        
        # Bind double-click event
        self.summaries_tree.bind('<Double-1>', self.methods.view_full_summary)
        
    def create_subscription_tracking_tab(self):
        """Create subscription and usage tracking tab"""
        subscription_frame = ttk.Frame(self.notebook)
        self.notebook.add(subscription_frame, text="Subscription Tracking")
        
        # Title
        title_label = tk.Label(subscription_frame, text="Subscription & Usage Tracking", 
                              font=('Arial', 16, 'bold'))
        title_label.pack(pady=20)
        
        # Filter frame
        filter_frame = tk.Frame(subscription_frame)
        filter_frame.pack(fill='x', padx=20, pady=10)
        
        tk.Label(filter_frame, text="Filter by Plan:", font=('Arial', 12, 'bold')).pack(side='left')
        self.subscription_plan_var = tk.StringVar(value="all")
        plan_combo = tk.ttk.Combobox(filter_frame, textvariable=self.subscription_plan_var,
                                   values=['all', 'basic', 'pro', 'enterprise'], width=10)
        plan_combo.pack(side='left', padx=10)
        plan_combo.bind('<<ComboboxSelected>>', self.methods.filter_subscriptions)
        
        tk.Label(filter_frame, text="Month:", font=('Arial', 12, 'bold')).pack(side='left', padx=(20, 5))
        self.subscription_month_var = tk.StringVar(value=datetime.now().strftime('%Y-%m'))
        month_entry = tk.Entry(filter_frame, textvariable=self.subscription_month_var, width=10)
        month_entry.pack(side='left', padx=5)
        
        tk.Button(filter_frame, text="Apply Filter", command=self.methods.filter_subscriptions, 
                 bg='#4CAF50', fg='white').pack(side='left', padx=10)
        tk.Button(filter_frame, text="Refresh", command=self.methods.load_subscription_tracking, 
                 bg='#2196F3', fg='white').pack(side='left', padx=5)
        
        # Usage summary frame
        summary_frame = tk.LabelFrame(subscription_frame, text="Usage Summary", font=('Arial', 12, 'bold'))
        summary_frame.pack(fill='x', padx=20, pady=10)
        
        self.usage_summary_text = scrolledtext.ScrolledText(summary_frame, height=8)
        self.usage_summary_text.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Subscription treeview
        columns = ('User/Company', 'Plan', 'Monthly Limit', 'Used This Month', 'Remaining', 'Usage %', 'Status', 'Last Activity')
        self.subscription_tree = ttk.Treeview(subscription_frame, columns=columns, show='headings', height=12)
        
        for col in columns:
            self.subscription_tree.heading(col, text=col)
            if col == 'User/Company':
                self.subscription_tree.column(col, width=150)
            elif col == 'Usage %':
                self.subscription_tree.column(col, width=80)
            else:
                self.subscription_tree.column(col, width=120)
        
        # Scrollbar for subscription tree
        subscription_scrollbar = ttk.Scrollbar(subscription_frame, orient='vertical', command=self.subscription_tree.yview)
        self.subscription_tree.configure(yscrollcommand=subscription_scrollbar.set)
        
        # Pack subscription tree and scrollbar
        self.subscription_tree.pack(side='left', fill='both', expand=True, padx=(20, 0), pady=10)
        subscription_scrollbar.pack(side='right', fill='y', pady=10)
        
        # Subscription actions frame
        actions_frame = tk.Frame(subscription_frame)
        actions_frame.pack(fill='x', padx=20, pady=10)
        
        tk.Button(actions_frame, text="View Usage Details", command=self.methods.view_usage_details, 
                 bg='#2196F3', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Reset Monthly Usage", command=self.methods.reset_monthly_usage, 
                 bg='#FF9800', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Export Usage Report", command=self.methods.export_usage_report, 
                 bg='#607D8B', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Update Limits", command=self.methods.update_subscription_limits, 
                 bg='#9C27B0', fg='white').pack(side='left', padx=5)
        
        # Bind double-click event
        self.subscription_tree.bind('<Double-1>', self.methods.view_usage_details)
        
    def create_translations_tab(self):
        """Create translation management tab"""
        translations_frame = ttk.Frame(self.notebook)
        self.notebook.add(translations_frame, text="Translations")
        
        # Title
        title_label = tk.Label(translations_frame, text="Translation Management", 
                              font=('Arial', 16, 'bold'))
        title_label.pack(pady=20)
        
        # Filter frame
        filter_frame = tk.Frame(translations_frame)
        filter_frame.pack(fill='x', padx=20, pady=10)
        
        # Language selection
        tk.Label(filter_frame, text="Language:", font=('Arial', 12, 'bold')).pack(side='left')
        self.translation_language_var = tk.StringVar(value='en')
        lang_combo = tk.ttk.Combobox(filter_frame, textvariable=self.translation_language_var,
                                   values=['en', 'et', 'es', 'ru', 'lv', 'lt', 'fi', 'sv', 'no', 'da', 'de', 'fr', 'it', 'pt', 'pl', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sl', 'el', 'tr', 'ar', 'he', 'ja', 'ko', 'zh', 'hi', 'th', 'vi', 'id', 'ms', 'tl'], width=10)
        lang_combo.pack(side='left', padx=10)
        lang_combo.bind('<<ComboboxSelected>>', self.methods.load_translations)
        
        # Category selection
        tk.Label(filter_frame, text="Category:", font=('Arial', 12, 'bold')).pack(side='left', padx=(20, 5))
        self.translation_category_var = tk.StringVar(value='terms')
        category_combo = tk.ttk.Combobox(filter_frame, textvariable=self.translation_category_var,
                                       values=['terms', 'faq', 'ui', 'notifications', 'errors'], width=15)
        category_combo.pack(side='left', padx=5)
        category_combo.bind('<<ComboboxSelected>>', self.methods.load_translations)
        
        # Action buttons
        tk.Button(filter_frame, text="Load Translations", command=self.methods.load_translations, 
                 bg='#4CAF50', fg='white').pack(side='left', padx=10)
        tk.Button(filter_frame, text="Seed Database", command=self.methods.seed_translations, 
                 bg='#FF9800', fg='white').pack(side='left', padx=5)
        tk.Button(filter_frame, text="Export", command=self.methods.export_translations, 
                 bg='#607D8B', fg='white').pack(side='left', padx=5)
        
        # Translations treeview
        columns = ('Key', 'Text Preview', 'Last Modified', 'Status')
        self.translations_tree = ttk.Treeview(translations_frame, columns=columns, show='headings', height=15)
        
        for col in columns:
            self.translations_tree.heading(col, text=col)
            if col == 'Text Preview':
                self.translations_tree.column(col, width=300)
            elif col == 'Key':
                self.translations_tree.column(col, width=150)
            else:
                self.translations_tree.column(col, width=120)
        
        # Scrollbar for translations tree
        translations_scrollbar = ttk.Scrollbar(translations_frame, orient='vertical', command=self.translations_tree.yview)
        self.translations_tree.configure(yscrollcommand=translations_scrollbar.set)
        
        # Pack translations tree and scrollbar
        self.translations_tree.pack(side='left', fill='both', expand=True, padx=(20, 0), pady=10)
        translations_scrollbar.pack(side='right', fill='y', pady=10)
        
        # Translation actions frame
        actions_frame = tk.Frame(translations_frame)
        actions_frame.pack(fill='x', padx=20, pady=10)
        
        tk.Button(actions_frame, text="Edit Translation", command=self.methods.edit_translation, 
                 bg='#2196F3', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Add New Translation", command=self.methods.add_new_translation, 
                 bg='#4CAF50', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Delete Translation", command=self.methods.delete_translation, 
                 bg='#F44336', fg='white').pack(side='left', padx=5)
        tk.Button(actions_frame, text="Refresh", command=self.methods.load_translations, 
                 bg='#607D8B', fg='white').pack(side='left', padx=5)
        
        # Bind double-click event
        self.translations_tree.bind('<Double-1>', self.methods.edit_translation)
        
    def create_analytics_tab(self):
        """Create analytics tab"""
        analytics_frame = ttk.Frame(self.notebook)
        self.notebook.add(analytics_frame, text="Analytics")
        
        # Analytics content will be added here
        tk.Label(analytics_frame, text="Analytics Dashboard", font=('Arial', 16, 'bold')).pack(pady=50)
        tk.Label(analytics_frame, text="Coming Soon - Advanced analytics and reporting features").pack()
        
    def create_settings_tab(self):
        """Create settings tab"""
        settings_frame = ttk.Frame(self.notebook)
        self.notebook.add(settings_frame, text="Settings")
        
        # Database connection settings
        db_frame = tk.LabelFrame(settings_frame, text="Database Connection", font=('Arial', 12, 'bold'))
        db_frame.pack(fill='x', padx=20, pady=20)
        
        tk.Label(db_frame, text="MongoDB URI:").pack(anchor='w', padx=10, pady=5)
        self.db_uri_var = tk.StringVar()
        db_entry = tk.Entry(db_frame, textvariable=self.db_uri_var, width=80)
        db_entry.pack(padx=10, pady=5, fill='x')
        
        tk.Button(db_frame, text="Test Connection", command=self.test_connection, 
                 bg='#4CAF50', fg='white').pack(padx=10, pady=10)
        tk.Button(db_frame, text="Reconnect", command=self.reconnect_database, 
                 bg='#2196F3', fg='white').pack(padx=10, pady=5)
        
        # Application settings
        app_frame = tk.LabelFrame(settings_frame, text="Application Settings", font=('Arial', 12, 'bold'))
        app_frame.pack(fill='x', padx=20, pady=20)
        
        tk.Label(app_frame, text="Auto-refresh interval (seconds):").pack(anchor='w', padx=10, pady=5)
        self.refresh_interval_var = tk.StringVar(value="30")
        refresh_entry = tk.Entry(app_frame, textvariable=self.refresh_interval_var, width=10)
        refresh_entry.pack(anchor='w', padx=10, pady=5)
        
        # Add validation for refresh interval
        def validate_refresh_interval(*args):
            try:
                value = self.refresh_interval_var.get()
                if value:
                    validated_value = InputValidator.validate_and_sanitize_input(
                        value, 'refresh_interval', is_required=False
                    )
                    # Convert to int and validate range
                    int_value = int(validated_value)
                    if int_value < 5 or int_value > 3600:  # 5 seconds to 1 hour
                        self.refresh_interval_var.set("30")  # Reset to default
                        messagebox.showwarning("Invalid Input", "Refresh interval must be between 5 and 3600 seconds")
            except (SecurityError, ValueError):
                self.refresh_interval_var.set("30")  # Reset to default
                messagebox.showwarning("Invalid Input", "Please enter a valid number for refresh interval")
        
        self.refresh_interval_var.trace('w', validate_refresh_interval)
        
    def connect_to_database(self):
        """Connect to MongoDB database"""
        try:
            # Try to get MongoDB URI from environment variable
            mongodb_uri = os.getenv('MONGODB_URI')
            if not mongodb_uri:
                # Try to read from .env file
                try:
                    with open('.env', 'r') as f:
                        for line in f:
                            if line.startswith('MONGODB_URI='):
                                mongodb_uri = line.split('=', 1)[1].strip()
                                break
                except FileNotFoundError:
                    pass
            
            if mongodb_uri:
                self.db_uri_var.set(mongodb_uri)
                self.client = MongoClient(mongodb_uri)
                # Extract database name from URI or use default
                db_name = 'retryWrites=true&w=majority'  # Your actual database name
                self.db = self.client[db_name]
                
                # Test connection
                self.client.admin.command('ping')
                
                # Initialize collections (MongoDB automatically pluralizes model names)
                self.users_collection = self.db.users
                self.companies_collection = self.db.companies
                self.conversations_collection = self.db.conversations
                self.conversation_summaries_collection = self.db.conversationsummaries
                self.enterprise_requests_collection = self.db.enterpriserequests
                self.password_resets_collection = self.db.passwordresets
                self.translations_collection = self.db.translations
                self.translation_keys_collection = self.db.translationkeys
                
                self.connected = True
                self.status_label.config(text="Connected to MongoDB", fg='green')
                self.load_initial_data()
                
            else:
                self.status_label.config(text="MongoDB URI not found", fg='red')
                
        except Exception as e:
            self.connected = False
            self.status_label.config(text=f"Connection failed: {str(e)}", fg='red')
            messagebox.showerror("Database Error", f"Failed to connect to database:\n{str(e)}")
    
    def load_initial_data(self):
        """Load initial data when connected"""
        if self.connected:
            threading.Thread(target=self.methods.load_users, daemon=True).start()
            threading.Thread(target=self.methods.load_companies, daemon=True).start()
            threading.Thread(target=self.methods.load_conversations, daemon=True).start()
            threading.Thread(target=self.methods.refresh_dashboard, daemon=True).start()
    
    @secure_input_wrapper
    def test_connection(self):
        """Test database connection"""
        try:
            # Validate and sanitize URI input
            raw_uri = self.db_uri_var.get()
            uri = InputValidator.validate_and_sanitize_input(
                raw_uri, 'uri', is_required=True
            )
            
            client = MongoClient(uri)
            client.admin.command('ping')
            client.close()
            messagebox.showinfo("Success", "Connection successful!")
            
        except SecurityError as e:
            SecurityAuditLogger.log_security_violation(
                None, "test_connection", "uri", "input_validation", str(e)
            )
            messagebox.showerror("Security Error", "Invalid URI format detected")
        except Exception as e:
            SecurityAuditLogger.log_security_violation(
                None, "test_connection", "error", "connection_error", str(e)
            )
            messagebox.showerror("Connection Error", "Failed to connect to database")
    
    @secure_input_wrapper
    def reconnect_database(self):
        """Reconnect to database with new URI"""
        try:
            # Validate and sanitize URI input
            raw_uri = self.db_uri_var.get()
            uri = InputValidator.validate_and_sanitize_input(
                raw_uri, 'uri', is_required=True
            )
            
            if self.client:
                self.client.close()
            
            self.client = MongoClient(uri)
            self.db = self.client.salesbuddy
            
            # Test connection
            self.client.admin.command('ping')
            
            # Initialize collections
            self.users_collection = self.db.users
            self.companies_collection = self.db.companies
            self.conversations_collection = self.db.conversations
            self.conversation_summaries_collection = self.db.conversationsummaries
            
            self.connected = True
            self.status_label.config(text="Connected to MongoDB", fg='green')
            self.load_initial_data()
            messagebox.showinfo("Success", "Reconnected successfully!")
            
        except SecurityError as e:
            SecurityAuditLogger.log_security_violation(
                None, "reconnect_database", "uri", "input_validation", str(e)
            )
            self.connected = False
            self.status_label.config(text="Invalid URI format", fg='red')
            messagebox.showerror("Security Error", "Invalid URI format detected")
        except Exception as e:
            SecurityAuditLogger.log_security_violation(
                None, "reconnect_database", "error", "connection_error", str(e)
            )
            self.connected = False
            self.status_label.config(text="Connection failed", fg='red')
            messagebox.showerror("Database Error", "Failed to reconnect to database")

    def run(self):
        """Start the admin panel"""
        self.root.mainloop()

if __name__ == "__main__":
    admin = SalesBuddyAdmin()
    admin.run()
