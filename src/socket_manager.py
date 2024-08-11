import base64
import binascii
import os
import shutil
from flask import session, request
from flask_socketio import SocketIO, emit, leave_room, rooms
from flask_socketio.namespace import Namespace
from converter import Converter
from auth_manager import AuthManager, User
from db_manager import DbManager
from src.objects.document_restriction import DocumentRestriction
from pathlib import Path
from usefull import gen_random_filename
import logging


class SocketManager (Namespace):

    socketio: SocketIO = None
    auth_manager: AuthManager = None
    db_manager: DbManager
    converter: Converter

    def __init__(self, socketio: SocketIO, auth_manager: AuthManager, db_manager: DbManager, converter: Converter, document_manager, rooms_manager, data_folder):
        self.socketio = socketio
        self.auth_manager = auth_manager
        self.db_manager = db_manager
        self.converter = converter
        self.document_manager = document_manager
        self.rooms_manager = rooms_manager
        self.logger = logging.getLogger()
        self.data_folder = data_folder
        super().__init__()

    def on_connect(self):
        self.auth_manager.check_oauth_status()

    def on_disconnect(self):
        doc_uuid = self.document_manager.get_user_current_doc_uuid(rooms())
        if doc_uuid:
            self.on_leave_room(doc_uuid)

    ## Document Editor
    def on_join_room(self, doc_uuid):
        u_info = self.auth_manager.get_userinfos()

        if self.db_manager.get_document(doc_uuid, u_info.user_unique_identifier) is not None:
            emit("join_room", "OK")

            self.logger.info(f"User '{u_info.username}' join room '{doc_uuid}'")

            self.rooms_manager.add_user_to_room(doc_uuid, u_info)

            self.socketio.emit("room_info", f"{u_info.username} has entered the room", to=doc_uuid)
            room_users_json = self.rooms_manager.get_room_users(doc_uuid, to_json=True)

            self.socketio.emit("room_users", room_users_json)
        else:
            emit("join_room", "KO")
            emit("display_error", {"error": "This room doesn't exists or you are not authorized to consult it", "required_action": "reload"})

    def on_leave_room(self, doc_uuid):
        @self.rooms_manager.require_editing_room
        def _():
            u_info = self.auth_manager.get_userinfos()
            if u_info is not None:
                username = u_info.username
            else:
                username = "Invited"
            leave_room(doc_uuid)
            emit("room_info", f"{username} has left the room", to=doc_uuid)
            self.rooms_manager.remove_room_user(doc_uuid, session.get("client_id"))
            session["client_id"] = None
            if self.rooms_manager.room_exists(doc_uuid):
                self.socketio.emit("room_users",
                              self.rooms_manager.get_room_users(doc_uuid, to_json=True),
                              to=doc_uuid)
        return _()

    def on_key(self, data):
        @self.rooms_manager.require_editing_room
        @self.rooms_manager.require_write_permission
        def _():
            doc_uuid = self.document_manager.get_user_current_doc_uuid(rooms())
            update_id = data["update_id"]
            if update_id < self.rooms_manager.get_update_id(doc_uuid):
                self.logger.debug("update_id older than our")
                return
            with open(os.path.join(self.document_manager.get_document_folder(doc_uuid), doc_uuid + ".adoc"),
                      'w') as f:  # Create the file
                f.write(data["content"])
            self.rooms_manager.increase_update_id(doc_uuid)
            ret = {"content": data["content"], "html": self.converter.convert(data["content"]),
                   "update_id": self.rooms_manager.get_update_id(doc_uuid), "client_id": data["client_id"], "cursor_position": data["cursor_position"]}
            self.socketio.emit("update", ret, to=doc_uuid)
        return _()

    def on_cursor_update(self, data):
        @self.rooms_manager.require_editing_room
        @self.rooms_manager.require_write_permission
        def _():
            doc_uuid = self.document_manager.get_user_current_doc_uuid(rooms())
            if data.get("client_id") is not None and data.get("cursor_position") is not None:
                self.socketio.emit("client_cursor_update", data, to=doc_uuid)
            else:
                self.logger.debug(f"Invalid cursor pos received : {data}")
        return _()

    def on_send_image(self, data):
        @self.rooms_manager.require_editing_room
        @self.rooms_manager.require_write_permission
        def _():
            doc_uuid = self.document_manager.get_user_current_doc_uuid(rooms())
            u_info = self.auth_manager.get_userinfos()
            if u_info is not None:
                u_uid = u_info.user_unique_identifier
            else:
                u_uid = 0
            if not self.db_manager.get_document(doc_uuid, u_uid):
                self.logger.info("User tried to push image with invalid doc uuid or u_uid")
                emit("Unable to retrieve the document with your permissions")
                return
            self.logger.info("Received image")
            image_filename = gen_random_filename()
            while image_filename in os.listdir(self.data_folder):
                image_filename = gen_random_filename()

            data_format = data["format"].replace('image/', '')
            if "jpg" in data_format or "jpeg" in data_format:
                image_filename += ".jpg"
            elif "png" in data_format:
                image_filename += ".png"
            if not data_format in ["png", "jpg", "webp"]:
                self.logger.info(f"Warning, user trying to send unsupported type of document : {data_format}")
                emit("display_error", {"error": "Sorry, this type of document is not supported"})
            try:
                image_data = base64.b64decode(data["data"])
            except binascii.Error as e:
                self.logger.info(f"Error treating image : {e}")
                emit("display_error", {"error": "Internal error, can't save image"})
                return

            self.logger.info(f"Writing new image at {image_filename}")
            with open(os.path.join(self.document_manager.get_document_folder(doc_uuid), image_filename), "wb") as f:
                f.write(image_data)

            emit("send_image", {"image_url": f"{request.url_root}s/{doc_uuid}/{image_filename}"})
        return _()

    def on_set_document_name(self, data):
        @self.rooms_manager.require_editing_room
        @self.rooms_manager.require_write_permission
        def _():
            doc_uuid = self.document_manager.get_user_current_doc_uuid(rooms())
            u_info = self.auth_manager.get_userinfos()
            if u_info is not None:
                u_uid = u_info.user_unique_identifier
            else:
                u_uid = 0
            new_name = data["document"]["doc_name"]
            document = self.db_manager.get_document(doc_uuid, u_uid)
            if document is None:
                self.logger.error(f"Error setting document name : Document '{doc_uuid}' not found in DB for uuid '{u_uid}'")
                return
            self.logger.info(f"Changing document {doc_uuid} name : {document.doc_name} -> {new_name}")
            document.doc_name = new_name
            self.db_manager.set_document(document)
            self.socketio.emit("update_document", {"document": self.db_manager.get_document(doc_uuid, u_uid).json()}, to=doc_uuid)
        return _()

    def on_set_document_restriction(self, data):
        @self.rooms_manager.require_editing_room
        @self.rooms_manager.require_write_permission
        def _():
            doc_uuid = self.document_manager.get_user_current_doc_uuid(rooms())
            u_info = self.auth_manager.get_userinfos()
            if u_info is not None:
                u_uid = u_info.user_unique_identifier
            else:
                u_uid = 0
            new_restriction = data["document"]["restriction"]
            document = self.db_manager.get_document(doc_uuid, u_uid)
            if document is None:
                self.logger.error(
                    f"Error setting document restriction : Document '{doc_uuid}' not found in DB for uuid '{u_uid}'")
            if u_uid == 0:
                emit("display_error", {"error": "Only registered members can set document permissions"})
            elif u_uid != document.owner:
                emit("display_error", {"error": "Only the owner can change permissions"})
            else:
                self.logger.info(f"Changing document {doc_uuid} restriction : {document.restriction} -> {new_restriction}")
                document.restriction = new_restriction
                self.db_manager.set_document(document)
            self.socketio.emit("update_document", {"document": self.db_manager.get_document(doc_uuid, u_uid).json()}, to=doc_uuid)
        return _()

    # Initial getting of document
    def on_init_document_editor(self):
        @self.rooms_manager.require_editing_room
        def _():
            doc_uuid = self.document_manager.get_user_current_doc_uuid(rooms())
            u_info = self.auth_manager.get_userinfos()
            if u_info is not None:
                u_uid = u_info.user_unique_identifier
            else:
                u_uid = 0
            doc = self.db_manager.get_document(doc_uuid, u_uid)
            with open(os.path.join(self.document_manager.get_document_folder(doc_uuid), doc_uuid + ".adoc"), 'r') as f:
                content = f.read()

            client_id = session.get("client_id")

            content = content
            ret = {
                "document": doc.json(),
                "content": content,
                "html": self.converter.convert(content),
                "client_id": client_id,
                "update_id": self.rooms_manager.get_update_id(doc_uuid),
                "client_cursors": [],
            }
            emit("init_document_editor", ret)
        return _()

    ## Authent
    def on_get_auth_methods(self):
        emit("get_auth_methods", {"auth_methods": self.auth_manager.auth_methods})

    def on_get_userinfos(self, target_uuid=None):
        if target_uuid is not None:
            u_info = self.db_manager.get_user_by_uuid(target_uuid)
            if u_info is not None:
                u_info = u_info.json()
        else:
            u_info = None
            if session.get("user") is not None:
                u_info = User.from_json(session.get("user")).json()
        self.logger.info(f"Getting u_info : {u_info}")
        emit("get_userinfos", {"user": u_info})

    ## Document creation

    def on_create_document(self, data=None):
        example = False
        if isinstance(data, dict):
            if data.get("example"):
                example = True
        u_info = self.auth_manager.get_userinfos()
        if u_info is not None:
            u_uid = u_info.user_unique_identifier
        else:
            u_uid = 0

        if not example:
            conf_permission = os.environ.get("WASCII_DEFAULT_DOC_PERMISSION")
            if conf_permission is None:
                initial_restriction = DocumentRestriction.EDITABLE
            else:
                initial_restriction = DocumentRestriction.from_string(conf_permission)
                if initial_restriction is None:
                    self.logger.warning("Invalid document permission set in config, defaulting to EDITABLE")

            new_doc = self.db_manager.create_document("New document", u_uid, initial_restriction)
            self.logger.info(f"Created document : {new_doc.json()}")
            os.mkdir(self.document_manager.get_document_folder(new_doc.doc_uuid))
            # with open(os.path.join(tmp_folder, new_doc.doc_uuid + ".adoc"), 'w') as f:  # Create the file
            with open(os.path.join(self.document_manager.get_document_folder(new_doc.doc_uuid), new_doc.doc_uuid + ".adoc"),
                      'w') as f:  # Create the file
                f.write("")
        else:
            new_doc = self.db_manager.create_document("Example document", u_uid, DocumentRestriction.PRIVATE)
            self.logger.info(f"Created example document : {new_doc.json()}")
            with open(Path(__file__).parent.joinpath("example_document.adoc"), 'r') as f:
                doc = f.read()
            os.mkdir(self.document_manager.get_document_folder(new_doc.doc_uuid))
            with open(os.path.join(self.document_manager.get_document_folder(new_doc.doc_uuid), new_doc.doc_uuid + ".adoc"),
                      'w') as f:  # Create the file
                f.write(doc)
        emit("create_document", {"document": new_doc.json()})

    def on_delete_document(self, data):
        try:
            doc_uuid = data.get("document").get("doc_uuid")
            u_info = self.auth_manager.get_userinfos()
            if u_info is not None:
                u_uid = u_info.user_unique_identifier
            else:
                u_uid = 0

            doc = self.db_manager.get_document(user_uuid=u_uid, doc_uuid=doc_uuid)
            if doc is None:
                self.socketio.emit("display_error",
                              {"error": "Document does not exist or you are not authorized to delete it"})
                self.logger.warning(f"Document {doc_uuid} not found for user {u_uid}")
                return
            doc_name = doc.doc_name
            if not self.db_manager.delete_document(u_uid, doc_uuid):
                self.socketio.emit("display_error",
                              {"error": "Document does not exist or you are not authorized to delete it"})
                self.logger.warning(f"Error deleting {doc_uuid}({doc_name}) for user {u_uid}")
                return
            shutil.rmtree(os.path.join(self.document_manager.get_document_folder(doc_uuid)))

            emit("display_success", {"message": f"Document '{doc_name}' has been removed"})
        finally:
            emit("delete_document")

    def on_list_documents(self):
        # print(sid)
        u_info = self.auth_manager.get_userinfos()
        if u_info is not None:
            u_uid = u_info.user_unique_identifier
        else:
            u_uid = 0
        documents = self.db_manager.list_documents(u_uid)
        ret = [doc.json() for doc in documents]
        emit("list_documents", ret)
