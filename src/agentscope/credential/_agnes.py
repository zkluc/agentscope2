# -*- coding: utf-8 -*-
"""The Agnes credential."""
from typing import Literal, Type, TYPE_CHECKING

from pydantic import ConfigDict, Field, SecretStr

from ._base import CredentialBase

if TYPE_CHECKING:
    from ..embedding import EmbeddingModelBase
    from ..model import ChatModelBase


_AGNES_BASE_URL = "https://apihub.agnes-ai.com/v1"


class AgnesCredential(CredentialBase):
    """The credential for Agnes AI API (OpenAI-compatible)."""

    model_config = ConfigDict(
        title="Agnes AI API",
    )

    type: Literal["agnes_credential"] = "agnes_credential"
    """The credential type."""

    api_key: SecretStr = Field(
        description="The Agnes API key.",
    )
    """The API key."""

    base_url: str = Field(
        default=_AGNES_BASE_URL,
        description="The base URL for the Agnes API.",
    )
    """The base URL for the Agnes API."""

    @classmethod
    def get_chat_model_class(cls) -> Type["ChatModelBase"]:
        """Return the AgnesChatModel class for Agnes."""
        from ..model import AgnesChatModel

        return AgnesChatModel

    @classmethod
    def get_embedding_model_class(cls) -> Type["EmbeddingModelBase"] | None:
        """Return the embedding model class for Agnes."""
        return None
