import re
import os
from db_manager import DbManager
from objects.document_restriction import DocumentRestriction

uuid_re = r"[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}"


class DocumentManager:
    def __init__(self, tmp_folder, db_manager: DbManager):
        self.tmp_folder = tmp_folder
        self.db_manager = db_manager

    def get_document_folder(self, doc_uuid):
        return os.path.join(self.tmp_folder, doc_uuid)

    def get_user_current_doc_uuid(self, _rooms: list[str]):
        for room in _rooms:
            if re.fullmatch(uuid_re, room):
                return room

    def can_user_write_document(self, doc_uuid, u_uuid) -> bool:
        doc = self.db_manager.get_document(doc_uuid, u_uuid)
        if doc is None:
            return False
        if doc.owner == u_uuid:
            return True
        if doc.restriction >= DocumentRestriction.EDITABLE:
            return True
        if doc.restriction >= DocumentRestriction.LIMITED and u_uuid != 0 and u_uuid is not None:
            return True
        return False
