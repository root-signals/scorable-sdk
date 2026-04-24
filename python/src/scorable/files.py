import uuid
from typing import IO, Optional, Union

import aiohttp
import requests

from .utils import ClientContextCallable


class Files:
    """
    Files API — upload documents and images for use in evaluator execution.

    Access via ``client.files``.
    """

    def __init__(self, client_context: ClientContextCallable, base_url: str, api_key: str):
        self.client_context = client_context
        self.base_url = base_url
        self.api_key = api_key

    def upload(
        self,
        file: Union[str, IO[bytes]],
        filename: Optional[str] = None,
        *,
        _request_timeout: Optional[int] = None,
    ) -> uuid.UUID:
        """
        Upload a file and return its ID for use in evaluator execution.

        Args:
            file: Path to the file or a file-like object opened in binary mode.
            filename: Override the file name sent to the server (required when
                passing a file-like object without a ``name`` attribute).

        Returns:
            UUID of the uploaded file. Pass this to the ``file_ids`` parameter
            of :meth:`Evaluator.run`.
        """
        _file = None
        try:
            _filename: str
            if isinstance(file, str):
                _file = open(file, "rb")
                _filename = filename or file.split("/")[-1]
                files = {"file": (_filename, _file)}
            else:
                _filename = filename or str(getattr(file, "name", None) or "upload")
                files = {"file": (_filename, file)}  # type: ignore[dict-item]

            response = requests.post(
                f"{self.base_url}/v1/files/",
                headers={"Authorization": f"Api-Key {self.api_key}"},
                files=files,
                timeout=_request_timeout or 120,
            )
            if not response.ok:
                raise Exception(f"File upload failed with status {response.status_code}: {response.text}")
            return uuid.UUID(response.json()["id"])
        finally:
            if _file and not _file.closed:
                _file.close()

    async def aupload(
        self,
        file: Union[str, IO[bytes]],
        filename: Optional[str] = None,
        *,
        _request_timeout: Optional[int] = None,
    ) -> uuid.UUID:
        """Asynchronously upload a file and return its ID."""
        _file = None
        try:
            form = aiohttp.FormData()
            _filename: str
            if isinstance(file, str):
                _file = open(file, "rb")
                _filename = filename or file.split("/")[-1]
                form.add_field("file", _file, filename=_filename)
            else:
                _filename = filename or str(getattr(file, "name", None) or "upload")
                form.add_field("file", file, filename=_filename)

            timeout = aiohttp.ClientTimeout(total=_request_timeout or 120)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(
                    f"{self.base_url}/v1/files/",
                    headers={"Authorization": f"Api-Key {self.api_key}"},
                    data=form,
                ) as resp:
                    if not resp.ok:
                        text = await resp.text()
                        raise Exception(f"File upload failed with status {resp.status}: {text}")
                    data = await resp.json()
                    return uuid.UUID(data["id"])
        finally:
            if _file and not _file.closed:
                _file.close()
