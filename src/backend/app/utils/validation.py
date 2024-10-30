"""
Validation Utility Module

This module provides comprehensive validation functions for various data structures and inputs
within the backend application, ensuring data integrity and compliance with defined schemas
and business rules.

Version Requirements:
- pydantic==1.8.2
"""

import re
from decimal import Decimal, InvalidOperation
from typing import Dict, Type, Any

from pydantic import BaseModel, ValidationError, create_model, EmailStr

from app.core.exceptions import ValidationException
from app.schemas.user import UserBase

# Global validation patterns as defined in the technical specification
VALIDATION_PATTERNS = {
    'EIN': r'^\d{2}-\d{7}$',
    'SSN': r'^\d{3}-\d{2}-\d{4}$',
    'PHONE': r'^\+?1?[-.]?\d{3}[-.]?\d{3}[-.]?\d{4}$',
    'EMAIL': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
}

# Global validation limits as defined in the technical specification
VALIDATION_LIMITS = {
    'REVENUE_MAX_DIGITS': 12,
    'PHONE_MIN_DIGITS': 10,
    'PHONE_MAX_DIGITS': 11
}

def validate_user_data(user_data: Dict) -> bool:
    """
    Validates user data against the UserBase schema and additional business rules.
    
    Args:
        user_data (Dict): Dictionary containing user data to validate
        
    Returns:
        bool: True if the data is valid
        
    Raises:
        ValidationException: If validation fails with detailed error message
    """
    try:
        # Validate against UserBase schema
        user = UserBase(**user_data)
        
        # Additional email format validation using regex pattern
        if not re.match(VALIDATION_PATTERNS['EMAIL'], user.email):
            raise ValidationException(
                message="Invalid email format",
                details={"field": "email", "value": user.email}
            )
        
        # Validate phone number if provided
        if 'phone' in user_data:
            validate_phone(user_data['phone'])
            
        return True
        
    except ValidationError as e:
        raise ValidationException(
            message="User data validation failed",
            details={"errors": e.errors()}
        )

def validate_document_data(document_data: Dict, validation_rules: Dict) -> bool:
    """
    Validates document data using dynamic Pydantic model creation and business rules.
    
    Args:
        document_data (Dict): Document data to validate
        validation_rules (Dict): Rules for document field validation
        
    Returns:
        bool: True if the data is valid
        
    Raises:
        ValidationException: If validation fails with detailed error message
    """
    try:
        # Create dynamic validation model
        ValidationModel = create_validation_model(validation_rules)
        
        # Validate against dynamic model
        model = ValidationModel(**document_data)
        
        # Additional field-specific validations
        if 'ein' in document_data:
            validate_ein(document_data['ein'])
            
        if 'ssn' in document_data:
            validate_ssn(document_data['ssn'])
            
        if 'revenue' in document_data:
            validate_revenue(document_data['revenue'])
            
        return True
        
    except ValidationError as e:
        raise ValidationException(
            message="Document data validation failed",
            details={"errors": e.errors()}
        )

def validate_ein(ein: str) -> bool:
    """
    Validates Employer Identification Number (EIN) format.
    
    Args:
        ein (str): EIN string to validate
        
    Returns:
        bool: True if valid
        
    Raises:
        ValidationException: If validation fails
    """
    if not re.match(VALIDATION_PATTERNS['EIN'], ein):
        raise ValidationException(
            message="Invalid EIN format",
            details={
                "field": "ein",
                "value": ein,
                "expected_format": "XX-XXXXXXX"
            }
        )
    return True

def validate_ssn(ssn: str) -> bool:
    """
    Validates Social Security Number (SSN) format.
    
    Args:
        ssn (str): SSN string to validate
        
    Returns:
        bool: True if valid
        
    Raises:
        ValidationException: If validation fails
    """
    if not re.match(VALIDATION_PATTERNS['SSN'], ssn):
        raise ValidationException(
            message="Invalid SSN format",
            details={
                "field": "ssn",
                "value": ssn,
                "expected_format": "XXX-XX-XXXX"
            }
        )
    return True

def validate_phone(phone: str) -> bool:
    """
    Validates phone number format with optional country code.
    
    Args:
        phone (str): Phone number string to validate
        
    Returns:
        bool: True if valid
        
    Raises:
        ValidationException: If validation fails
    """
    # Remove all non-digit characters for length check
    digits = ''.join(filter(str.isdigit, phone))
    
    if not (VALIDATION_LIMITS['PHONE_MIN_DIGITS'] <= len(digits) <= VALIDATION_LIMITS['PHONE_MAX_DIGITS']):
        raise ValidationException(
            message="Invalid phone number length",
            details={
                "field": "phone",
                "value": phone,
                "min_digits": VALIDATION_LIMITS['PHONE_MIN_DIGITS'],
                "max_digits": VALIDATION_LIMITS['PHONE_MAX_DIGITS']
            }
        )
        
    if not re.match(VALIDATION_PATTERNS['PHONE'], phone):
        raise ValidationException(
            message="Invalid phone number format",
            details={
                "field": "phone",
                "value": phone,
                "expected_format": "+1-XXX-XXX-XXXX or XXX-XXX-XXXX"
            }
        )
    return True

def validate_revenue(revenue: str) -> bool:
    """
    Validates revenue amount format and limits.
    
    Args:
        revenue (str): Revenue amount string to validate
        
    Returns:
        bool: True if valid
        
    Raises:
        ValidationException: If validation fails
    """
    try:
        # Convert string to decimal for validation
        revenue_decimal = Decimal(revenue)
        
        # Check if the number exceeds maximum digits
        if len(str(revenue_decimal).replace('.', '')) > VALIDATION_LIMITS['REVENUE_MAX_DIGITS']:
            raise ValidationException(
                message="Revenue amount exceeds maximum digits",
                details={
                    "field": "revenue",
                    "value": revenue,
                    "max_digits": VALIDATION_LIMITS['REVENUE_MAX_DIGITS']
                }
            )
            
        # Ensure positive amount
        if revenue_decimal <= 0:
            raise ValidationException(
                message="Revenue amount must be positive",
                details={
                    "field": "revenue",
                    "value": revenue
                }
            )
            
        return True
        
    except InvalidOperation:
        raise ValidationException(
            message="Invalid revenue amount format",
            details={
                "field": "revenue",
                "value": revenue
            }
        )

def create_validation_model(field_specs: Dict) -> Type[BaseModel]:
    """
    Creates a dynamic Pydantic model based on provided field specifications.
    
    Args:
        field_specs (Dict): Dictionary containing field specifications
        
    Returns:
        Type[BaseModel]: A dynamically created Pydantic model class
    """
    field_definitions = {}
    
    for field_name, field_spec in field_specs.items():
        # Apply validation patterns from global patterns if specified
        if field_spec.get('pattern') in VALIDATION_PATTERNS:
            field_spec['pattern'] = VALIDATION_PATTERNS[field_spec['pattern']]
            
        # Create field with validation rules
        field_definitions[field_name] = (
            field_spec.get('type', str),
            field_spec.get('validation', {})
        )
    
    # Create and return dynamic model
    return create_model(
        'DynamicValidationModel',
        **field_definitions,
        __base__=BaseModel
    )