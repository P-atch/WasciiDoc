import sqlite3
from objects.document_restriction import DocumentRestriction
import logging
from pathlib import Path
from uuid import uuid4
from objects.user import User
from objects.db_document import DbDocument


class DbManager:
    def __init__(self, db_path: str):
        self.logger = logging.getLogger(__name__)
        self.db_path = db_path
        base, cursor = self.open_db()
        with open(f"{Path(__file__).parent}/db_schema.sql", 'r') as f:
            db_schema = f.read()
        for req in db_schema.split('--'):
            cursor.execute(req)
        base.commit()
        base.close()

    def open_db(self):
        db = sqlite3.connect(self.db_path)
        return db, db.cursor()

    def list_documents(self, user_uuid: str) -> [DbDocument]:
        db, cursor = self.open_db()
        self.logger.info(f"Listing documents for user {user_uuid}")
        try:
            restriction_filter = DocumentRestriction.PRIVATE
            if user_uuid is None or user_uuid == 0:
                restriction_filter = DocumentRestriction.PROTECTED
            cursor.execute(
                "SELECT document_uuid, document_name, documents.user_uuid, restriction, known_name FROM documents "
                "JOIN known_users ON known_users.user_uuid=documents.user_uuid "
                "WHERE (documents.user_uuid=?) OR restriction>?",
                (user_uuid, restriction_filter))
            res = cursor.fetchall()
            ret = []
            for e in res:
                ret.append(DbDocument(e[0], e[1], e[2], e[3], e[4]))
            return ret
        finally:
            db.close()

    def get_document(self, doc_uuid: str, user_uuid: str):
        db, cursor = self.open_db()
        try:
            restriction_filter = DocumentRestriction.LOCKED
            if user_uuid is None:
                restriction_filter = DocumentRestriction.PROTECTED
            self.logger.debug(
                f"Searching document '{doc_uuid}' for user {user_uuid} with minimum permission '{restriction_filter}'")
            cursor.execute(
                "SELECT document_uuid, document_name, documents.user_uuid, restriction, known_name FROM documents "
                "JOIN known_users ON known_users.user_uuid=documents.user_uuid "
                " WHERE (documents.user_uuid=? OR restriction>=?) AND document_uuid=?",
                (user_uuid, restriction_filter, doc_uuid))
            res = cursor.fetchall()
            if res:
                return DbDocument(res[0][0], res[0][1], res[0][2], res[0][3], res[0][4])
            else:
                self.logger.warning("Document not found : ", res)
        finally:
            db.close()

    def create_document(self, document_name: str, owner_uuid: str,
                        restriction: int | DocumentRestriction) -> DbDocument:
        db, cursor = self.open_db()
        self.logger.info("Creating document")
        try:
            doc_uuid = str(uuid4())
            cursor.execute(
                "INSERT INTO documents (document_uuid, document_name, user_uuid, restriction) VALUES (?, ?, ?, ?)",
                (doc_uuid, document_name, owner_uuid, restriction))
            db.commit()
            return DbDocument(doc_uuid, document_name, owner_uuid, restriction, self.get_user_name(owner_uuid))
        finally:
            db.close()

    def set_document(self, updated_document: DbDocument):
        db, cursor = self.open_db()
        try:
            cursor.execute("UPDATE documents SET document_name=?, restriction=? WHERE document_uuid=? ",
                           (updated_document.doc_name, updated_document.restriction, updated_document.doc_uuid,))
            db.commit()
        finally:
            db.close()

    def insert_update_user(self, user):
        if user.user_unique_identifier is None:
            return
        db, cursor = self.open_db()
        try:
            if self.get_user_name(user.user_unique_identifier) is None:
                cursor.execute("INSERT INTO known_users (user_uuid, known_name, profile_image_url) VALUES (?, ?, ?)",
                               (user.user_unique_identifier, user.username, user.profile_image_url))
            else:
                cursor.execute("UPDATE known_users SET known_name=?, profile_image_url=? WHERE user_uuid=?",
                               ("patch", user.profile_image_url, user.user_unique_identifier))
            db.commit()
        finally:
            db.close()

    def get_user_name(self, user_uuid: str):
        db, cursor = self.open_db()
        try:
            cursor.execute("SELECT known_name FROM known_users WHERE user_uuid=?", (user_uuid,))
            res = cursor.fetchall()
            if len(res) != 0:
                return res[0][0]
        finally:
            db.close()

    def get_user_by_uuid(self, user_uuid) -> User:
        db, cursor = self.open_db()
        try:
            cursor.execute("SELECT known_name, profile_image_url, user_uuid FROM known_users WHERE user_uuid=?",
                           (user_uuid,))
            res = cursor.fetchall()
            if len(res) != 0:
                return User(res[0][0], res[0][1], res[0][2])
        finally:
            db.close()

    def delete_document(self, user_uuid, doc_uuid: str) -> bool:
        db, cursor = self.open_db()
        try:
            if user_uuid:
                min_restriction = DocumentRestriction.LIMITED
            else:
                min_restriction = DocumentRestriction.EDITABLE
            prev_len = len(self.list_documents(user_uuid))
            cursor.execute("DELETE FROM documents WHERE document_uuid=? AND (user_uuid=? OR restriction>=?)",
                           (doc_uuid, user_uuid, min_restriction,))
            db.commit()
            if len(self.list_documents(user_uuid)) == prev_len:
                return False
            return True
        finally:
            db.close()
