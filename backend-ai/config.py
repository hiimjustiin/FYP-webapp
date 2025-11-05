"""
ILA AI Feedback Service - Configuration

Environment variables and service configuration.
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Service configuration
    service_name: str = "ila-ai-feedback"
    service_version: str = "1.0.0"
    environment: str = "development"
    
    # API configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_workers: int = 4
    
    # OpenAI configuration
    openai_api_key: str
    openai_model: str = "gpt-4o"  # GPT-4o for cost-effectiveness
    openai_temperature: float = 0.3  # Lower temperature for consistent scoring
    openai_max_tokens: int = 2000  # Max tokens for response
    openai_timeout: int = 60  # Timeout in seconds
    
    # Token limits
    max_input_tokens: int = 10000  # Max tokens for student submission
    
    # Database configuration
    database_url: str
    db_pool_min: int = 2
    db_pool_max: int = 10
    
    # Express backend integration
    express_backend_url: str = "http://localhost:3001"
    express_api_timeout: int = 30
    
    # Redis cache configuration
    redis_url: str = "redis://localhost:6379/0"
    cache_ttl: int = 86400  # 24 hours in seconds
    cache_enabled: bool = True
    
    # AI processing configuration
    max_retries: int = 3
    retry_delay: int = 5  # Seconds between retries
    processing_timeout: int = 300  # 5 minutes max per submission
    
    # Cost tracking
    cost_per_1k_input_tokens: float = 0.0025  # GPT-4o pricing (as of 2024)
    cost_per_1k_output_tokens: float = 0.01
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "json"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Returns:
        Settings: Application settings
    """
    return Settings()


# Dimension rubric criteria (embedded for AI agent)
RUBRIC_CRITERIA = {
    1: {
        "label": "Frame the problem with an integrative approach",
        "variant": "red",
        "levels": {
            1: {
                "name": "Naïve/Novice",
                "criteria": "No sense of purpose OR failed to articulate the rationale for conducting the project"
            },
            2: {
                "name": "Intermediate",
                "criteria": "There is a clear purpose OR the rationale is articulated"
            },
            3: {
                "name": "Mastery",
                "criteria": "There is a clear purpose AND the rationale is articulated"
            }
        }
    },
    2: {
        "label": "Stakeholder consideration",
        "variant": "blue",
        "levels": {
            1: {
                "name": "Naïve/Novice",
                "criteria": "0 to 1 stakeholder considered"
            },
            2: {
                "name": "Intermediate",
                "criteria": "2 to 3 stakeholders considered"
            },
            3: {
                "name": "Mastery",
                "criteria": "More than 3 stakeholders considered"
            }
        }
    },
    3: {
        "label": "Range of disciplinary perspectives",
        "variant": "green",
        "levels": {
            1: {
                "name": "Naïve/Novice",
                "criteria": "0 to 1 disciplinary perspective considered"
            },
            2: {
                "name": "Intermediate",
                "criteria": "2 to 3 disciplinary perspectives considered"
            },
            3: {
                "name": "Mastery",
                "criteria": "More than 3 disciplinary perspectives considered"
            }
        }
    },
    4: {
        "label": "Disciplinary reasoning",
        "variant": "purple",
        "levels": {
            1: {
                "name": "Naïve/Novice",
                "criteria": "No reasoning provided to explain any disciplinary insights"
            },
            2: {
                "name": "Intermediate",
                "criteria": "Some reasoning provided to explain some disciplinary insights"
            },
            3: {
                "name": "Mastery",
                "criteria": "Reasoning provided to explain all disciplinary insights"
            }
        }
    },
    5: {
        "label": "Credibility of disciplinary knowledge",
        "variant": "orange",
        "levels": {
            1: {
                "name": "Naïve/Novice",
                "criteria": "Unreliable sources used"
            },
            2: {
                "name": "Intermediate",
                "criteria": "Sometimes used relevant and reliable sources"
            },
            3: {
                "name": "Mastery",
                "criteria": "Always used relevant and reliable sources"
            }
        }
    },
    6: {
        "label": "Number of disciplinary integration",
        "variant": "pink",
        "levels": {
            1: {
                "name": "Naïve/Novice",
                "criteria": "No evidence of disciplinary insights that build on one another to create new knowledge"
            },
            2: {
                "name": "Intermediate",
                "criteria": "1 piece of evidence of disciplinary insights that build on one another to create new knowledge"
            },
            3: {
                "name": "Mastery",
                "criteria": "At least 2 pieces of evidence of disciplinary insights that build on one another to create new knowledge"
            }
        }
    },
    7: {
        "label": "Depth of disciplinary integration",
        "variant": "teal",
        "levels": {
            1: {
                "name": "Naïve/Novice",
                "criteria": "No explanation of how the disciplinary insights are related to one another OR no visual representation of how the disciplinary insights are related to one another"
            },
            2: {
                "name": "Intermediate",
                "criteria": "Lists disciplinary insights without showing how they are related OR visual representation lists disciplinary insights without showing how they are related"
            },
            3: {
                "name": "Mastery",
                "criteria": "Explains how disciplinary insights build off one another OR visual representation shows how disciplinary insights build off one another"
            }
        }
    },
    8: {
        "label": "Social (society) impact",
        "variant": "indigo",
        "levels": {
            1: {
                "name": "Naïve/Novice",
                "criteria": "No discussion on potential impacts"
            },
            2: {
                "name": "Intermediate",
                "criteria": "Discussed potential impacts on local community OR broader society"
            },
            3: {
                "name": "Mastery",
                "criteria": "Discussed potential impacts on local community AND broader society, AND who will be affected"
            }
        }
    },
    9: {
        "label": "Limitations",
        "variant": "yellow",
        "levels": {
            1: {
                "name": "Naïve/Novice",
                "criteria": "No identification of limitations in the project"
            },
            2: {
                "name": "Intermediate",
                "criteria": "Identified limitations but did not provide resolutions to address the limitations"
            },
            3: {
                "name": "Mastery",
                "criteria": "Identified limitations AND provided resolutions to address the limitations"
            }
        }
    }
}
