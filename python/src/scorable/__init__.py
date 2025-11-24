"""Scorable SDK.

The use should start by creating a :class:`scorable.client.Scorable` instance.

Example::

  from scorable import Scorable
  client = Scorable()

"""

from .__about__ import __version__
from .client import Scorable

# Note: PEP-396 was rejected but we provide __version__ anyway
# ( https://peps.python.org/pep-0396/ )
__all__ = ["__version__", "Scorable"]
