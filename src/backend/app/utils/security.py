"""
Security Utility Module

This module provides enhanced security measures and additional validation checks
for the authentication flow within the backend application.

Version Requirements:
- bcrypt==3.2.0
"""

from typing import Dict, Set
import bcrypt  # version 3.2.0
from typing import Dict

# Internal imports
from app.core.security import generate_token, verify_token
from app.core.config import Config
from app.utils.validation import validate_user_data

# Global constants from configuration
SECURITY_LEVEL = Config.security_level
MAX_LOGIN_ATTEMPTS = Config.max_login_attempts

# Global token blacklist set
TOKEN_BLACKLIST: Set[str] = set()

def enhance_security_checks(user_data: Dict, token: str) -> bool:
    """
    Performs comprehensive security checks on user data and tokens following
    the authentication flow requirements.

    Args:
        user_data (Dict): User data to validate
        token (str): JWT token to verify

    Returns:
        bool: True if all security checks pass, False otherwise

    Raises:
        AuthenticationException: If security checks fail
    """
    try:
        # Step 1: Validate user data using validation utility
        # Implements requirement: Validate user data for security compliance
        if not validate_user_data(user_data):
            return False

        # Step 2: Check if token is blacklisted
        # Implements requirement: Additional security checks in authentication flow
        if token in TOKEN_BLACKLIST:
            return False

        # Step 3: Verify token validity and signature
        # Implements requirement: Validate tokens in authentication flow
        token_data = verify_token(token)
        if not token_data:
            return False

        # Step 4: Validate token expiration and claims
        # Implements requirement: Additional security checks in authentication flow
        if not _validate_token_claims(token_data):
            return False

        # Step 5: Check login attempts against maximum allowed
        # Implements requirement: Enhanced authentication mechanisms
        user_id = token_data.get('sub')
        if not _check_login_attempts(user_id):
            return False

        # Step 6: Perform additional security checks based on security level
        # Implements requirement: Additional security checks in authentication flow
        if not _perform_security_level_checks(user_data, token_data):
            return False

        return True

    except Exception as e:
        # Log security check failure
        logger.error(
            "Security checks failed",
            extra={
                "error": str(e),
                "user_data": {k: "***" for k in user_data.keys()},  # Mask sensitive data
                "token": token[:10] + "..."  # Only log first 10 chars of token
            }
        )
        return False

def blacklist_token(token: str) -> bool:
    """
    Adds a token to the blacklist to prevent its reuse.
    Implements requirement: Enhanced security measures in authentication flow.

    Args:
        token (str): JWT token to blacklist

    Returns:
        bool: True if token was successfully blacklisted

    Raises:
        AuthenticationException: If token blacklisting fails
    """
    try:
        # Step 1: Verify token format and signature before blacklisting
        token_data = verify_token(token)
        if not token_data:
            return False

        # Step 2: Add token to blacklist set
        TOKEN_BLACKLIST.add(token)

        # Log successful blacklisting
        logger.info(
            "Token blacklisted successfully",
            extra={
                "token_id": token[:10] + "...",  # Only log first 10 chars
                "user_id": token_data.get('sub')
            }
        )

        return True

    except Exception as e:
        # Log blacklisting failure
        logger.error(
            "Token blacklisting failed",
            extra={
                "error": str(e),
                "token": token[:10] + "..."  # Only log first 10 chars
            }
        )
        return False

def _validate_token_claims(token_data: Dict) -> bool:
    """
    Validates token claims for additional security.
    Implements requirement: Additional security checks in authentication flow.

    Args:
        token_data (Dict): Decoded token data

    Returns:
        bool: True if token claims are valid
    """
    required_claims = {'sub', 'exp', 'iat', 'type'}
    
    # Check for required claims
    if not all(claim in token_data for claim in required_claims):
        return False

    # Validate token type
    if token_data.get('type') != 'access':
        return False

    # Additional claim validations based on security level
    if SECURITY_LEVEL == 'high':
        return _validate_high_security_claims(token_data)

    return True

def _check_login_attempts(user_id: str) -> bool:
    """
    Checks if user has exceeded maximum login attempts.
    Implements requirement: Enhanced authentication mechanisms.

    Args:
        user_id (str): User identifier

    Returns:
        bool: True if login attempts are within limit
    """
    # This would typically check against a rate limiting service or cache
    # For demonstration, always returns True
    return True

def _perform_security_level_checks(user_data: Dict, token_data: Dict) -> bool:
    """
    Performs additional security checks based on configured security level.
    Implements requirement: Additional security checks in authentication flow.

    Args:
        user_data (Dict): User data to validate
        token_data (Dict): Decoded token data

    Returns:
        bool: True if security checks pass
    """
    if SECURITY_LEVEL == 'high':
        # Perform high security level checks
        return _perform_high_security_checks(user_data, token_data)
    elif SECURITY_LEVEL == 'medium':
        # Perform medium security level checks
        return _perform_medium_security_checks(user_data, token_data)
    
    # Basic security level checks always pass
    return True

def _perform_high_security_checks(user_data: Dict, token_data: Dict) -> bool:
    """
    Performs high-level security checks for maximum security.
    Implements requirement: Enhanced security measures in authentication flow.

    Args:
        user_data (Dict): User data to validate
        token_data (Dict): Decoded token data

    Returns:
        bool: True if high security checks pass
    """
    # Validate user roles match token claims
    if 'roles' in token_data and token_data['roles'] != user_data.get('roles'):
        return False

    # Validate user permissions
    if not _validate_user_permissions(user_data, token_data):
        return False

    # Additional high security validations
    return True

def _perform_medium_security_checks(user_data: Dict, token_data: Dict) -> bool:
    """
    Performs medium-level security checks.
    Implements requirement: Enhanced security measures in authentication flow.

    Args:
        user_data (Dict): User data to validate
        token_data (Dict): Decoded token data

    Returns:
        bool: True if medium security checks pass
    """
    # Basic role validation
    if 'roles' in token_data and not any(role in user_data.get('roles', []) 
                                        for role in token_data['roles']):
        return False

    return True

def _validate_user_permissions(user_data: Dict, token_data: Dict) -> bool:
    """
    Validates user permissions against token claims.
    Implements requirement: Enhanced authentication mechanisms.

    Args:
        user_data (Dict): User data containing permissions
        token_data (Dict): Decoded token data with permission claims

    Returns:
        bool: True if permissions are valid
    """
    token_permissions = token_data.get('permissions', [])
    user_permissions = user_data.get('permissions', [])

    # Ensure all token permissions exist in user permissions
    return all(perm in user_permissions for perm in token_permissions)

def _validate_high_security_claims(token_data: Dict) -> bool:
    """
    Validates additional claims required for high security level.
    Implements requirement: Enhanced security measures in authentication flow.

    Args:
        token_data (Dict): Decoded token data

    Returns:
        bool: True if high security claims are valid
    """
    high_security_claims = {'roles', 'permissions', 'security_level'}
    
    # Check for required high security claims
    if not all(claim in token_data for claim in high_security_claims):
        return False

    # Validate security level claim
    if token_data.get('security_level') != SECURITY_LEVEL:
        return False

    return True