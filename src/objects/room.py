from objects.user import User
import random
from datetime import datetime

class Room:
    _users = {}
    _last_seens = {}
    _update_id = 0

    def increase_update_id(self):
        self._update_id += 1
    def get_update_id(self):
        return self._update_id

    def _gen_new_client_id(self):
        client_id = random.randint(100000, 999999)
        while client_id in self._users.keys():
            client_id = random.randint(100000, 999999)
        return client_id

    def __init__(self):
        pass

    def get_users(self, to_json=False) -> dict:
        if to_json:
            users = {}
            for client_id, user in self._users.items():
                users[client_id] = user.json()
            return users
        else:
            return self._users

    def add_user(self, user: User) -> int:
        assert isinstance(user, User)
        # If not invited and already in room
        #if user.user_unique_identifier != 0 and self.contain_user(user):
        #    client_id = self.contain_user(user)
        #else:
        #    client_id = self._gen_new_client_id()
        client_id = self._gen_new_client_id()
        self._users[client_id] = user
        self._last_seens[client_id] = datetime.now()
        return client_id

    def contain_user(self, given_user: User) -> bool | int:
        for client_id, user in self._users.items():
            if user.user_unique_identifier == given_user.user_unique_identifier:
                return client_id
        return False

    def update_user_last_seen(self, client_id):
        if client_id not in self._users.keys():
            self._last_seens[client_id] = datetime.now()

    def remove_user(self, client_id):
        self._users.pop(client_id)
        self._last_seens.pop(client_id)

    def remove_old_users(self, max_last_seen_duration: int=60):
        client_ids_to_pop = []
        for client_id, last_seen in self._last_seens.items():
            if (datetime.now() - last_seen).seconds > max_last_seen_duration:
                client_ids_to_pop.append(client_id)
        for client_id in client_ids_to_pop:
            self._users.pop(client_id)
            self._last_seens.pop(client_id)