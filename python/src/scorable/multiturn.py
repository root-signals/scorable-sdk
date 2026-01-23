"""Multi-turn conversation support for Scorable evaluators and judges."""

from typing import List

from .generated.openapi_client.models.message_turn_request import MessageTurnRequest as Turn

# Type alias for multi-turn conversations (just a list of turns)
Turns = List[Turn]

__all__ = [
    "Turn",
    "Turns",
]
