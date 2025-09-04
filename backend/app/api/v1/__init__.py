# Ensure submodules can be imported as `from app.api.v1 import auth`
from . import auth

__all__ = ["auth"]