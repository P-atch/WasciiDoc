import re
import os

uuid_re = r"[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}"


class DocumentManager:
    def __init__(self, tmp_folder):
        self.tmp_folder = tmp_folder

    def get_document_folder(self, doc_uuid):
        return os.path.join(self.tmp_folder, doc_uuid)

    def get_user_current_doc_uuid(self, _rooms: list[str]):
        for room in _rooms:
            if re.fullmatch(uuid_re, room):
                return room
