#!/usr/bin/env python3
"""
SalesBuddy Security Module
Comprehensive input validation, sanitization, and security protection
"""

import re
import html
from typing import Any, Optional, Dict, List, Union
from datetime import datetime
import unicodedata

class SecurityError(Exception):
    """Custom exception for security violations"""
    pass

class InputValidator:
    """Comprehensive input validation and sanitization"""
    
    # Maximum lengths for different field types
    MAX_LENGTHS = {
        'name': 100,
        'email': 255,
        'password': 128,
        'text': 1000,
        'description': 2000,
        'search': 100,
        'company_name': 150,
        'industry': 100,
        'role': 50,
        'plan': 20,
        'status': 20,
        'language': 10,
        'size': 20,
        'default_role': 30,
        'experience': 20,
        'monthly_limit': 10,
        'daily_limit': 10,
        'max_users': 10,
        'uri': 500,
        'refresh_interval': 10
    }
    
    # Dangerous patterns for injection attacks
    DANGEROUS_PATTERNS = [
        # SQL/NoSQL injection patterns
        r'(\s|^)(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)(\s|;)',
        r'(\s|^)(where|from|into|values|set|table|database|schema|index|view|procedure|function|trigger)(\s|;)',
        r'(\s|^)(or|and|not|like|regex|exists|is|in|between|having|group|order|limit|offset)(\s|$)',
        r'(\s|^)(count|sum|avg|min|max|distinct|top|rownum|rowid|null|empty|match|contains)(\s|$)',
        
        # MongoDB specific injection patterns
        r'\$(\w+)\s*:',
        r'{\s*\$(\w+)',
        r'\$\$(\w+)',
        r'\\x[0-9a-fA-F]{2}',
        r'null\s*bite',
        
        # XML injection patterns
        r'<[^>]*>',
        r'&[a-zA-Z0-9#]+;',
        r'<!DOCTYPE',
        r'<!ENTITY',
        r'<[^>]*script[^>]*>',
        r'<[^>]*style[^>]*>',
        r'javascript:',
        r'vbscript:',
        r'data:',
        
        # XSS patterns
        r'on\w+\s*=',
        r'<script',
        r'</script>',
        r'<iframe',
        r'</iframe>',
        r'<object',
        r'<embed',
        r'<form',
        r'<input',
        r'<textarea',
        r'<select',
        r'<option',
        r'<link',
        r'<meta',
        r'<style',
        r'<base',
        r'<applet',
        r'<frameset',
        r'<frame',
        r'<body',
        r'<head',
        r'<html',
        r'<title',
        
        # Command injection patterns
        r'[;&|`$(){}[\]]',
        r'(rm|del|format|fdisk|mkfs|dd|cat|ls|dir|type|copy|move|ren|mkdir|rmdir|chmod|chown|su|sudo|passwd|useradd|userdel|groupadd|groupdel|usermod|groupmod|find|grep|awk|sed|perl|python|ruby|bash|sh|zsh|fish|cmd|powershell|wscript|cscript|regsvr32|rundll32|mshta|wmic|wsl|curl|wget|ftp|telnet|ssh|scp|rsync|netcat|nc|nmap|ping|traceroute|route|arp|iptables|ufw|firewall|systemctl|service|chkconfig|initctl|update-rc|sysv-rc|systemd|upstart|inetd|xinetd|cron|at|batch|anacron|logrotate|rsyslog|syslog|journalctl|dmesg|last|lastlog|who|w|users|id|groups|getent|passwd|shadow|group|gshadow|hosts|hostname|dns|dig|nslookup|host|getent|resolvectl|systemd-resolve|netstat|ss|lsof|fuser|ps|top|htop|free|df|du|iostat|vmstat|sar|iotop|lsof|fuser|kill|killall|pkill|pgrep|nice|renice|nohup|screen|tmux|bg|fg|jobs|disown|wait|trap|exit|logout|history|alias|unalias|export|unset|env|printenv|set|source|.)',
        
        # Path traversal patterns
        r'\.\./',
        r'\.\.\\',
        r'%2e%2e%2f',
        r'%2e%2e%5c',
        r'\.\.%2f',
        r'\.\.%5c',
        r'%c0%ae%c0%ae%c0%af',
        r'%c1%9c%c1%9c%c1%af',
        
        # LDAP injection patterns
        r'[=\(\)&|!~\*<>]',
        
        # NoSQL injection patterns
        r'\$where',
        r'\$regex',
        r'\$ne',
        r'\$gt',
        r'\$gte',
        r'\$lt',
        r'\$lte',
        r'\$in',
        r'\$nin',
        r'\$exists',
        r'\$size',
        r'\$all',
        r'\$elemMatch',
        r'\$not',
        r'\$or',
        r'\$and',
        r'\$nor',
        r'\$text',
        r'\$search',
        r'\$language',
        r'\$caseSensitive',
        r'\$diacriticSensitive',
        r'\$project',
        r'\$match',
        r'\$group',
        r'\$sort',
        r'\$limit',
        r'\$skip',
        r'\$out',
        r'\$mapReduce',
        r'\$lookup',
        r'\$unwind',
        r'\$graphLookup',
        r'\$facet',
        r'\$bucket',
        r'\$bucketAuto',
        r'\$addFields',
        r'\$replaceRoot',
        r'\$replaceWith',
        r'\$merge',
        r'\$unionWith',
        r'\$set',
        r'\$unset',
        r'\$push',
        r'\$pull',
        r'\$pop',
        r'\$inc',
        r'\$mul',
        r'\$max',
        r'\$min',
        r'\$currentDate',
        r'\$bit',
        r'\$rename',
        r'\$addToSet',
        r'\$each',
        r'\$position',
        r'\$slice',
        r'\$sort\s*:',
        r'\$pullAll',
        r'\$pushAll',
        r'\$isolated',
        r'\$natural'
    ]
    
    @staticmethod
    def validate_and_sanitize_input(
        value: Any, 
        field_type: str = 'text', 
        is_required: bool = True,
        allow_html: bool = False
    ) -> str:
        """
        Validate and sanitize input data
        
        Args:
            value: Input value to validate
            field_type: Type of field (name, email, text, etc.)
            is_required: Whether field is required
            allow_html: Whether to allow HTML (default False for security)
            
        Returns:
            Sanitized string value
            
        Raises:
            SecurityError: If input contains dangerous patterns
        """
        # Convert to string and strip whitespace
        if value is None:
            if is_required:
                raise SecurityError(f"Field '{field_type}' is required")
            return ""
        
        str_value = str(value).strip()
        
        # Check if required field is empty
        if is_required and not str_value:
            raise SecurityError(f"Field '{field_type}' cannot be empty")
        
        # Check length limits
        max_length = InputValidator.MAX_LENGTHS.get(field_type, 255)
        if len(str_value) > max_length:
            raise SecurityError(f"Field '{field_type}' exceeds maximum length of {max_length} characters")
        
        # Check for dangerous patterns
        InputValidator._check_dangerous_patterns(str_value, field_type)
        
        # Sanitize based on field type
        if field_type == 'email':
            str_value = InputValidator._sanitize_email(str_value)
        elif field_type == 'name':
            str_value = InputValidator._sanitize_name(str_value)
        elif field_type == 'uri':
            str_value = InputValidator._sanitize_uri(str_value)
        else:
            str_value = InputValidator._sanitize_text(str_value, allow_html)
        
        # Final validation after sanitization
        if is_required and not str_value:
            raise SecurityError(f"Field '{field_type}' became empty after sanitization")
        
        return str_value
    
    @staticmethod
    def _check_dangerous_patterns(value: str, field_type: str) -> None:
        """Check for dangerous injection patterns"""
        value_lower = value.lower()
        
        for pattern in InputValidator.DANGEROUS_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE):
                raise SecurityError(f"Field '{field_type}' contains potentially dangerous content: {pattern}")
        
        # Additional checks for specific field types
        if field_type == 'email':
            InputValidator._validate_email_format(value)
        elif field_type == 'uri':
            InputValidator._validate_uri_format(value)
    
    @staticmethod
    def _sanitize_text(text: str, allow_html: bool = False) -> str:
        """Sanitize text input"""
        # Remove or escape dangerous characters
        if not allow_html:
            # HTML encode all special characters
            text = html.escape(text, quote=True)
        
        # Remove null bytes and control characters (except newlines and tabs)
        text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\t\r')
        
        # Normalize unicode
        text = unicodedata.normalize('NFKC', text)
        
        # Remove any remaining dangerous sequences
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
        
        return text.strip()
    
    @staticmethod
    def _sanitize_name(name: str) -> str:
        """Sanitize name fields"""
        # Remove HTML tags and dangerous characters
        name = html.escape(name, quote=True)
        
        # Allow only letters, spaces, hyphens, apostrophes, and periods
        name = re.sub(r'[^a-zA-Z\s\-\.\']', '', name)
        
        # Normalize whitespace
        name = re.sub(r'\s+', ' ', name)
        
        return name.strip()
    
    @staticmethod
    def _sanitize_email(email: str) -> str:
        """Sanitize and validate email"""
        # Remove any HTML tags
        email = html.escape(email, quote=True)
        
        # Basic email format validation
        InputValidator._validate_email_format(email)
        
        # Convert to lowercase
        email = email.lower()
        
        return email
    
    @staticmethod
    def _sanitize_uri(uri: str) -> str:
        """Sanitize URI/URL"""
        # Remove any HTML tags
        uri = html.escape(uri, quote=True)
        
        # Basic URI validation
        InputValidator._validate_uri_format(uri)
        
        return uri
    
    @staticmethod
    def _validate_email_format(email: str) -> None:
        """Validate email format"""
        # Basic email regex
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise SecurityError("Invalid email format")
        
        # Check for dangerous characters
        if any(char in email for char in ['<', '>', '"', "'", '(', ')', '[', ']', ';', ':', ',', ' ']):
            raise SecurityError("Email contains invalid characters")
    
    @staticmethod
    def _validate_uri_format(uri: str) -> None:
        """Validate URI format"""
        # Check if it's a valid URI
        uri_pattern = r'^[a-zA-Z][a-zA-Z0-9+.-]*://[^\s]+$'
        if not re.match(uri_pattern, uri):
            raise SecurityError("Invalid URI format")
        
        # Check for dangerous schemes
        dangerous_schemes = ['javascript', 'vbscript', 'data', 'file', 'ftp', 'gopher']
        scheme = uri.split('://')[0].lower()
        if scheme in dangerous_schemes:
            raise SecurityError(f"Dangerous URI scheme: {scheme}")

class SecureDatabaseQueries:
    """Secure database query builder"""
    
    @staticmethod
    def build_secure_filter(field: str, value: Any, operator: str = '$eq') -> Dict[str, Any]:
        """
        Build secure MongoDB filter
        
        Args:
            field: Field name
            value: Value to search for
            operator: MongoDB operator ($eq, $regex, etc.)
            
        Returns:
            Secure MongoDB filter
        """
        # Validate field name
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_.]*$', field):
            raise SecurityError(f"Invalid field name: {field}")
        
        # Sanitize value based on operator
        if operator == '$regex':
            # For regex searches, escape special regex characters
            if isinstance(value, str):
                value = re.escape(value)
            else:
                raise SecurityError("Regex operator requires string value")
        elif operator in ['$in', '$nin']:
            # For array operators, validate each element
            if not isinstance(value, list):
                raise SecurityError(f"{operator} operator requires array value")
            value = [InputValidator.validate_and_sanitize_input(v, 'text') for v in value]
        else:
            # For other operators, sanitize the value
            if isinstance(value, str):
                value = InputValidator.validate_and_sanitize_input(value, 'text')
        
        return {field: {operator: value}}
    
    @staticmethod
    def build_secure_update_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build secure MongoDB update data
        
        Args:
            data: Dictionary of field-value pairs to update
            
        Returns:
            Sanitized update data
        """
        sanitized_data = {}
        
        for field, value in data.items():
            # Validate field name
            if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_.]*$', field):
                raise SecurityError(f"Invalid field name: {field}")
            
            # Sanitize value based on field type
            if field in ['firstName', 'lastName']:
                sanitized_value = InputValidator.validate_and_sanitize_input(value, 'name')
            elif field == 'email':
                sanitized_value = InputValidator.validate_and_sanitize_input(value, 'email')
            elif field in ['description', 'feedback', 'aiRatingFeedback']:
                sanitized_value = InputValidator.validate_and_sanitize_input(value, 'description')
            elif field in ['industry', 'company', 'settings.industry', 'settings.salesRole']:
                sanitized_value = InputValidator.validate_and_sanitize_input(value, 'industry')
            elif field in ['role', 'settings.experienceLevel']:
                sanitized_value = InputValidator.validate_and_sanitize_input(value, 'role')
            elif field in ['subscription.plan', 'subscription.status']:
                sanitized_value = InputValidator.validate_and_sanitize_input(value, 'plan')
            elif field in ['language']:
                sanitized_value = InputValidator.validate_and_sanitize_input(value, 'language')
            elif field in ['size']:
                sanitized_value = InputValidator.validate_and_sanitize_input(value, 'size')
            elif field in ['usage.monthlyLimit', 'usage.dailyLimit', 'subscription.maxUsers']:
                # Convert to int if possible, otherwise validate as text
                try:
                    sanitized_value = int(InputValidator.validate_and_sanitize_input(value, 'monthly_limit'))
                    if sanitized_value < 0 or sanitized_value > 999999:
                        raise SecurityError(f"Value {sanitized_value} out of valid range")
                except ValueError:
                    raise SecurityError(f"Invalid numeric value: {value}")
            else:
                sanitized_value = InputValidator.validate_and_sanitize_input(value, 'text')
            
            sanitized_data[field] = sanitized_value
        
        return sanitized_data

class RateLimiter:
    """Simple rate limiter to prevent abuse"""
    
    def __init__(self, max_requests: int = 100, time_window: int = 60):
        self.max_requests = max_requests
        self.time_window = time_window
        self.requests = []  # List of timestamps
    
    def is_allowed(self) -> bool:
        """Check if request is allowed based on rate limits"""
        now = datetime.now()
        
        # Remove old requests outside time window
        self.requests = [req_time for req_time in self.requests 
                        if (now - req_time).total_seconds() < self.time_window]
        
        # Check if we're within limits
        if len(self.requests) >= self.max_requests:
            return False
        
        # Add current request
        self.requests.append(now)
        return True

class SecurityAuditLogger:
    """Log security events for auditing"""
    
    @staticmethod
    def log_security_violation(
        user_id: Optional[str],
        action: str,
        field: str,
        violation_type: str,
        details: str
    ) -> None:
        """Log security violations"""
        timestamp = datetime.now().isoformat()
        log_entry = {
            'timestamp': timestamp,
            'user_id': user_id,
            'action': action,
            'field': field,
            'violation_type': violation_type,
            'details': details,
            'severity': 'HIGH'
        }
        
        # In a real application, this would write to a secure audit log
        print(f"SECURITY VIOLATION: {log_entry}")
        
        # Could also send alerts to security team
        # send_security_alert(log_entry)

# Global rate limiter instance
rate_limiter = RateLimiter(max_requests=200, time_window=60)

def secure_input_wrapper(func):
    """
    Decorator to automatically validate input parameters
    """
    def wrapper(*args, **kwargs):
        # Check rate limiting
        if not rate_limiter.is_allowed():
            SecurityAuditLogger.log_security_violation(
                None, "rate_limit_exceeded", "global", "rate_limit", 
                f"Function {func.__name__} rate limit exceeded"
            )
            raise SecurityError("Rate limit exceeded. Please try again later.")
        
        try:
            return func(*args, **kwargs)
        except SecurityError:
            # Re-raise security errors
            raise
        except Exception as e:
            # Log unexpected errors but don't expose details
            SecurityAuditLogger.log_security_violation(
                None, func.__name__, "error", "unexpected_error", 
                f"Unexpected error in {func.__name__}: {type(e).__name__}"
            )
            raise SecurityError("An error occurred processing your request")
    
    return wrapper
