#!/usr/bin/env python3
"""
SalesBuddy Translation Setup Script
This script helps set up the translation system for Terms of Service and FAQ content
"""

import os
import sys
import subprocess
import json
from datetime import datetime

def print_banner():
    """Print setup banner"""
    print("=" * 60)
    print("🌍 SalesBuddy Translation System Setup")
    print("=" * 60)
    print("Setting up comprehensive Terms of Service and FAQ translations")
    print("for multiple languages with admin panel management.")
    print("=" * 60)

def check_requirements():
    """Check if required files exist"""
    required_files = [
        'terms_and_faq_translations.js',
        'server/scripts/seedTermsAndFaqTranslations.js',
        'admin_panel.py',
        'admin_methods.py',
        'security_module.py'
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ Missing required files:")
        for file_path in missing_files:
            print(f"   - {file_path}")
        return False
    
    print("✅ All required files found")
    return True

def check_database_connection():
    """Check if MongoDB connection is available"""
    try:
        # Try to import and connect to MongoDB
        import pymongo
        from pymongo import MongoClient
        
        # Try to get MongoDB URI from environment
        mongodb_uri = os.getenv('MONGODB_URI')
        if not mongodb_uri:
            print("⚠️  MONGODB_URI environment variable not set")
            print("   Please set your MongoDB connection string:")
            print("   export MONGODB_URI='mongodb://localhost:27017/salesbuddy'")
            return False
        
        # Test connection
        client = MongoClient(mongodb_uri)
        client.admin.command('ping')
        client.close()
        
        print("✅ Database connection successful")
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        print("   Please check your MongoDB connection and MONGODB_URI")
        return False

def run_seeding_script():
    """Run the database seeding script"""
    print("\n🌱 Running database seeding script...")
    
    try:
        # Change to server directory
        os.chdir('server/scripts')
        
        # Run the seeding script
        result = subprocess.run(['node', 'seedTermsAndFaqTranslations.js'], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Database seeding completed successfully!")
            print("📊 Seeding output:")
            print(result.stdout)
            return True
        else:
            print("❌ Database seeding failed:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Error running seeding script: {str(e)}")
        return False
    finally:
        # Return to original directory
        os.chdir('../..')

def create_sample_config():
    """Create a sample configuration file"""
    config = {
        "translation_system": {
            "supported_languages": ["en", "et", "es", "ru"],
            "extended_languages": [
                "lv", "lt", "fi", "sv", "no", "da", "de", "fr", "it", "pt", 
                "pl", "cs", "sk", "hu", "ro", "bg", "hr", "sl", "el", "tr", 
                "ar", "he", "ja", "ko", "zh", "hi", "th", "vi", "id", "ms", "tl"
            ],
            "categories": ["terms_of_service", "faq"],
            "content_stats": {
                "terms_of_service": {
                    "en": "~2,500 words",
                    "et": "~2,800 words", 
                    "es": "~2,600 words",
                    "ru": "~2,700 words"
                },
                "faq": {
                    "questions": 15,
                    "words_per_language": "~1,500 words"
                }
            }
        },
        "setup_completed": datetime.now().isoformat(),
        "next_steps": [
            "Launch admin panel: python admin_panel.py",
            "Navigate to Translations tab",
            "Select language and category",
            "Click 'Load Translations' to verify setup",
            "Use 'Seed Database' if needed",
            "Edit translations as required"
        ]
    }
    
    with open('translation_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("✅ Created translation_config.json")

def print_next_steps():
    """Print next steps for the user"""
    print("\n" + "=" * 60)
    print("🎉 Translation System Setup Complete!")
    print("=" * 60)
    print("\n📋 Next Steps:")
    print("1. Launch the admin panel:")
    print("   python admin_panel.py")
    print("\n2. Navigate to the 'Translations' tab")
    print("\n3. Select a language (en, et, es, ru) and category")
    print("\n4. Click 'Load Translations' to verify the setup")
    print("\n5. Use 'Seed Database' if you need to repopulate")
    print("\n6. Edit translations as needed using the built-in editor")
    print("\n📚 Documentation:")
    print("   - TRANSLATION_SYSTEM_GUIDE.md - Complete system guide")
    print("   - SECURITY_IMPLEMENTATION.md - Security features")
    print("\n🔧 Features Available:")
    print("   ✅ Multi-language Terms of Service")
    print("   ✅ Comprehensive FAQ system")
    print("   ✅ Admin panel management")
    print("   ✅ Secure input validation")
    print("   ✅ Database seeding")
    print("   ✅ Export/Import functionality")
    print("   ✅ 35+ language support ready")
    print("\n" + "=" * 60)

def main():
    """Main setup function"""
    print_banner()
    
    # Check requirements
    if not check_requirements():
        print("\n❌ Setup failed: Missing required files")
        sys.exit(1)
    
    # Check database connection
    if not check_database_connection():
        print("\n❌ Setup failed: Database connection issues")
        print("\n💡 To fix this:")
        print("1. Make sure MongoDB is running")
        print("2. Set MONGODB_URI environment variable")
        print("3. Verify your connection string is correct")
        sys.exit(1)
    
    # Run seeding script
    if not run_seeding_script():
        print("\n❌ Setup failed: Database seeding issues")
        sys.exit(1)
    
    # Create config file
    create_sample_config()
    
    # Print next steps
    print_next_steps()

if __name__ == "__main__":
    main()
