# Standard library imports
import os
import hashlib
import secrets
import hmac
from datetime import datetime, timedelta
from typing import Dict, Optional

# Third-party imports
import jwt  # PyJWT==2.1.0
from typing import Dict, Optional

# Internal imports
from .config import Config
from .exceptions import CustomException, AuthenticationException
from .logging import setup_logging, get_logger

# Initialize logging
logger = get_logger(__name__)

# Global constants from specification
SECRET_KEY = Config.secret_key.get_secret_value()
TOKEN_EXPIRE_MINUTES = Config.access_token_expire_minutes
ALGORITHM = "HS256"

def generate_token(user_id: str, additional_claims: Optional[Dict] = None) -> str:
    """
    Generates a secure JWT token for user authentication.
    Implements authentication flow requirements from security architecture.

    Args:
        user_id (str): The unique identifier of the user
        additional_claims (Optional[Dict]): Additional claims to include in the token

    Returns:
        str: JWT token string with encoded user information

    Raises:
        AuthenticationException: If token generation fails
    """
    try:
        # Create token payload with mandatory claims
        payload = {
            "sub": str(user_id),  # Subject (user ID)
            "iat": datetime.utcnow(),  # Issued at
            "exp": datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES),  # Expiration
            "type": "access"  # Token type
        }

        # Add any additional claims if provided
        if additional_claims:
            payload.update(additional_claims)

        # Encode the token using HS256 algorithm and secret key
        token = jwt.encode(
            payload,
            SECRET_KEY,
            algorithm=ALGORITHM
        )

        logger.info(
            "Generated JWT token",
            extra={
                "user_id": user_id,
                "token_exp": payload["exp"].isoformat()
            }
        )

        return token

    except Exception as e:
        logger.error(
            "Token generation failed",
            extra={
                "user_id": user_id,
                "error": str(e)
            }
        )
        raise AuthenticationException(
            message="Failed to generate authentication token",
            details={"error": str(e)}
        )

def verify_token(token: str) -> Dict:
    """
    Verifies and decodes a JWT token.
    Implements token validation requirements from authentication flow.

    Args:
        token (str): The JWT token to verify

    Returns:
        Dict: Decoded token payload containing user information

    Raises:
        AuthenticationException: If token is invalid, expired, or verification fails
    """
    try:
        # Verify and decode the token
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        logger.info(
            "Token verified successfully",
            extra={
                "user_id": payload.get("sub"),
                "token_exp": payload.get("exp")
            }
        )

        return payload

    except jwt.ExpiredSignatureError:
        logger.warning(
            "Expired token detected",
            extra={"token": token[:10] + "..."}  # Log only first 10 chars for security
        )
        raise AuthenticationException(
            message="Token has expired",
            details={"code": "token_expired"}
        )

    except jwt.InvalidTokenError as e:
        logger.warning(
            "Invalid token detected",
            extra={"error": str(e)}
        )
        raise AuthenticationException(
            message="Invalid authentication token",
            details={"code": "token_invalid"}
        )

class PasswordHasher:
    """
    Handles secure password hashing and verification using industry-standard algorithms.
    Implements password security requirements from security architecture.
    """

    def __init__(self, algorithm: str = "sha256", salt_length: int = 32):
        """
        Initializes the password hasher with secure defaults.

        Args:
            algorithm (str): The hashing algorithm to use (default: sha256)
            salt_length (int): Length of the salt in bytes (default: 32)
        """
        self._algorithm = algorithm
        self._salt_length = salt_length
        self._logger = get_logger(__name__)

    def hash_password(self, password: str) -> str:
        """
        Creates a secure hash of the password with salt.
        Implements password hashing requirements from security architecture.

        Args:
            password (str): The password to hash

        Returns:
            str: Salted password hash in hexadecimal format

        Raises:
            CustomException: If password hashing fails
        """
        try:
            # Generate a cryptographically secure salt
            salt = secrets.token_bytes(self._salt_length)

            # Create hash using the specified algorithm
            h = hashlib.new(self._algorithm)
            h.update(salt + password.encode('utf-8'))
            password_hash = h.hexdigest()

            # Combine salt and hash
            combined = salt.hex() + password_hash

            self._logger.info(
                "Password hashed successfully",
                extra={"algorithm": self._algorithm}
            )

            return combined

        except Exception as e:
            self._logger.error(
                "Password hashing failed",
                extra={"error": str(e)}
            )
            raise CustomException(
                message="Failed to hash password",
                code="500",
                details={"error": str(e)}
            )

    def verify_password(self, password: str, hashed_password: str) -> bool:
        """
        Verifies a password against its hash.
        Implements password verification requirements from security architecture.

        Args:
            password (str): The password to verify
            hashed_password (str): The stored hash to verify against

        Returns:
            bool: True if password matches hash, False otherwise

        Raises:
            CustomException: If password verification fails
        """
        try:
            # Extract salt from stored hash
            salt = bytes.fromhex(hashed_password[:self._salt_length * 2])
            stored_hash = hashed_password[self._salt_length * 2:]

            # Hash the input password with the extracted salt
            h = hashlib.new(self._algorithm)
            h.update(salt + password.encode('utf-8'))
            input_hash = h.hexdigest()

            # Use constant-time comparison to prevent timing attacks
            is_valid = hmac.compare_digest(stored_hash, input_hash)

            self._logger.info(
                "Password verification completed",
                extra={"result": "success" if is_valid else "failed"}
            )

            return is_valid

        except Exception as e:
            self._logger.error(
                "Password verification failed",
                extra={"error": str(e)}
            )
            raise CustomException(
                message="Failed to verify password",
                code="500",
                details={"error": str(e)}
            )