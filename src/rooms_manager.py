import functools
from flask_socketio import emit, rooms, join_room, leave_room
from flask import session
import re
import os
from objects.user import User
from documents_manager import DocumentManager
import logging
from objects.room import Room
import time


class RoomsManager:
    _rooms = {}

    def cleaner_thread(self):
        while True:
            rooms_to_delete = []
            for doc_uuid, room in self._rooms.items():
                previous_count = len(room.get_users())
                room.remove_old_users()
                new_count = len(room.get_users())
                if new_count != previous_count:
                    self.logger.info(f"Room {doc_uuid} : Removed {new_count - previous_count} old users")
                    if new_count == 0:
                        self.logger.info(f"Room {doc_uuid} : Removing as it is empty")
                        rooms_to_delete.append(doc_uuid)
                room_users_json = self.get_room_users(doc_uuid, to_json=True)
                self.socketio.emit("room_users", room_users_json, to=doc_uuid)
            for doc_uuid in rooms_to_delete:
                self._rooms.pop(doc_uuid)
            time.sleep(60)

    def __init__(self, socketio, document_manager: DocumentManager):
        self.document_manager = document_manager
        self.logger = logging.getLogger(__name__)
        self.socketio = socketio
        # self.logger.info("Starting rooms cleaner thread")
        #thread = threading.Thread(target=self.cleaner_thread, daemon=True) # Not necessary
        #thread.start()

    def _get_room(self, doc_uuid) -> Room:
        room = self._rooms.get(doc_uuid)
        if room is None:
            raise RuntimeError(f"Room '{doc_uuid}' doesn't exists")
        return room

    def increase_update_id(self, doc_uuid):
        self._rooms.get(doc_uuid).increase_update_id()

    def get_update_id(self, doc_uuid):
        return self._rooms.get(doc_uuid).get_update_id()

    def add_user_to_room(self, doc_uuid, user: User) -> int:
        join_room(doc_uuid)
        if not self._rooms.get(doc_uuid):
            self._rooms[doc_uuid] = Room()
        new_client_id = self._get_room(doc_uuid).add_user(user)
        session["client_id"] = new_client_id
        self.logger.info(f"Room {doc_uuid} -> Adding user {user.username} with client ID {new_client_id}")
        return new_client_id

    def remove_room_user(self, doc_uuid, client_id):
        self._get_room(doc_uuid).remove_user(client_id)
        self.logger.info(f"Removing client {client_id} from room {doc_uuid}")
        if len(self._get_room(doc_uuid).get_users()) == 0:
            self._rooms.pop(doc_uuid)
            self.logger.info(f"Room {doc_uuid} -> Empty, removing it")

    def get_room_users(self, doc_uuid, to_json=False):
        return self._get_room(doc_uuid).get_users(to_json)

    def room_exists(self, doc_uuid) -> bool:
        return doc_uuid in self._rooms.keys()

    def require_editing_room(self, function):
        @functools.wraps(function)
        def decorator(*args, **kwargs):  # Return corresponding function with oauth_status
            client_id = session.get("client_id")
            if not client_id:
                self.logger.warning("User trying to access room endpoint without client_id")
                emit("display_error", {"error": "Error from the editor, please reconnect"})

            doc_uuids = []
            for room in rooms():
                if re.fullmatch(r"[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}", room):
                    doc_uuids.append(room)

            if not doc_uuids:
                self.logger.warning("User trying to access room endpoint without being in a room")
                emit("display_error", {"error": "You have been disconnected from the editor"})
                return
            elif len(doc_uuids) > 2:
                self.logger.warning(f"User {client_id} is connected to multiple rooms, refusing and disconnecting")
                emit("display_error", {"error": "Error from the editor, please reconnect"})
                for doc_uuid in doc_uuids:  # Leave all rooms
                    leave_room(doc_uuid)
                    self.remove_room_user(doc_uuid, client_id)
                return

            doc_uuid = doc_uuids[0]
            if not os.path.exists(
                    os.path.join(self.document_manager.get_document_folder(doc_uuid), doc_uuid + ".adoc")):
                self.logger.warning("User is in a room but has no access to document, disconnecting")
                emit("display_error", {"error": "This document doesn't seems to exist"})
                self.remove_room_user(doc_uuid, client_id)
                return

            if doc_uuid not in self._rooms.keys():
                emit("display_error", {"error": "Sorry, this room no longer exists"})
                return

            self._get_room(doc_uuid).update_user_last_seen(client_id)
            return function(*args, **kwargs)

        return decorator
