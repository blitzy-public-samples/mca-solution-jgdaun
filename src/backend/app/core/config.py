import os
from typing import Dict, List, Literal, Optional
from pydantic import BaseSettings, validator, SecretStr, AnyHttpUrl, EmailStr, conint, constr
from dotenv import load_dotenv

# Version information for external dependencies
# python-dotenv==0.19.0
# pydantic==1.8.2

ENV_FILE = ".env"

class ConfigError(Exception):
    """Custom exception for configuration-related errors."""
    pass

# Define valid environment types
ENVIRONMENT_TYPES = Literal['development', 'staging', 'production']

def load_env_variables() -> None:
    """
    Loads environment variables from a .env file into the application.
    Raises ConfigError if the .env file is missing or cannot be loaded.
    """
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ENV_FILE)
    
    if not os.path.exists(env_path):
        raise ConfigError(f"Environment file not found at {env_path}")
    
    try:
        load_dotenv(env_path)
    except Exception as e:
        raise ConfigError(f"Failed to load environment variables: {str(e)}")

@pydantic.dataclasses.dataclass
class Config(BaseSettings):
    """
    Application configuration with validation using Pydantic.
    Implements configuration management requirements from system architecture.
    """
    # Basic application settings
    environment: ENVIRONMENT_TYPES
    project_name: str
    api_v1_prefix: str = "/api/v1"
    debug: bool = False

    # Security settings (from security architecture requirements)
    secret_key: SecretStr
    access_token_expire_minutes: conint(ge=1) = 30  # Minimum 1 minute
    allowed_origins: List[AnyHttpUrl]
    api_rate_limit: conint(ge=1) = 100  # Requests per minute

    # Database configurations
    database_url: Optional[str]
    mongodb_url: Optional[str]
    redis_url: str

    # AWS Configurations
    aws_access_key_id: SecretStr
    aws_secret_access_key: SecretStr
    aws_region: str
    s3_bucket: str

    # Email settings
    email_host: str
    email_port: conint(ge=1, le=65535)
    email_username: str
    email_password: SecretStr

    # Message broker
    celery_broker_url: str

    # Monitoring and logging
    log_level: constr(regex='^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$') = "INFO"
    sentry_dsn: Optional[str]

    # Feature flags for different environments
    feature_flags: Dict[str, str] = {}

    class Config:
        case_sensitive = True
        env_file = ENV_FILE

    def __init__(self):
        """
        Initializes the configuration settings with validation and type checking.
        """
        # Load environment variables first
        load_env_variables()
        
        # Initialize parent class with environment variables
        super().__init__()
        
        # Validate environment-specific settings
        self._validate_environment_settings()
        
        # Initialize feature flags based on environment
        self._initialize_feature_flags()

    def _validate_environment_settings(self) -> None:
        """Validates environment-specific configuration requirements."""
        if self.environment == "production":
            if self.debug:
                raise ConfigError("Debug mode must be disabled in production")
            if not self.sentry_dsn:
                raise ConfigError("Sentry DSN is required in production")
            if not self.secret_key.get_secret_value():
                raise ConfigError("Secret key is required in production")

    def _initialize_feature_flags(self) -> None:
        """Initializes feature flags based on the current environment."""
        base_flags = {
            "enable_webhooks": "true",
            "enable_ocr": "true",
            "enable_email_notifications": "true"
        }
        
        env_specific_flags = {
            "development": {"enable_debug_logging": "true"},
            "staging": {"enable_debug_logging": "true"},
            "production": {"enable_debug_logging": "false"}
        }
        
        self.feature_flags = {
            **base_flags,
            **env_specific_flags.get(self.environment, {})
        }

    def get_database_dsn(self) -> str:
        """
        Generates a database connection string from component parts if not provided as URL.
        """
        if self.database_url:
            return self.database_url
            
        # Construct from individual components if URL not provided
        db_params = {
            'host': os.getenv('DB_HOST'),
            'port': os.getenv('DB_PORT'),
            'database': os.getenv('DB_NAME'),
            'user': os.getenv('DB_USER'),
            'password': os.getenv('DB_PASSWORD')
        }
        
        if not all(db_params.values()):
            raise ConfigError("Missing required database configuration parameters")
            
        return f"postgresql://{db_params['user']}:{db_params['password']}@{db_params['host']}:{db_params['port']}/{db_params['database']}"

    def get_mongodb_connection(self) -> str:
        """
        Generates MongoDB connection string with authentication.
        """
        if self.mongodb_url:
            return self.mongodb_url
            
        # Construct MongoDB connection string with authentication
        mongo_params = {
            'host': os.getenv('MONGO_HOST'),
            'port': os.getenv('MONGO_PORT'),
            'database': os.getenv('MONGO_DB'),
            'user': os.getenv('MONGO_USER'),
            'password': os.getenv('MONGO_PASSWORD'),
            'replica_set': os.getenv('MONGO_REPLICA_SET')
        }
        
        if not all([mongo_params['host'], mongo_params['database']]):
            raise ConfigError("Missing required MongoDB configuration parameters")
            
        auth_string = f"{mongo_params['user']}:{mongo_params['password']}@" if mongo_params['user'] else ""
        replica_set = f"?replicaSet={mongo_params['replica_set']}" if mongo_params['replica_set'] else ""
        
        return f"mongodb://{auth_string}{mongo_params['host']}:{mongo_params['port']}/{mongo_params['database']}{replica_set}"

    @validator('allowed_origins')
    def validate_allowed_origins(cls, v):
        """Validates CORS allowed origins."""
        if not v and os.getenv('ENVIRONMENT') == 'production':
            raise ConfigError("CORS allowed origins must be specified in production")
        return v

    @validator('api_rate_limit')
    def validate_rate_limit(cls, v):
        """Ensures reasonable rate limit values."""
        if v > 1000 and os.getenv('ENVIRONMENT') == 'production':
            raise ConfigError("API rate limit too high for production environment")
        return v