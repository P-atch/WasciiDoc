import functools
import authlib.integrations.base_client.errors
import requests.exceptions
from flask import session
from authlib.integrations.flask_client import OAuth
from authlib.integrations.base_client.errors import MissingTokenError
from db_manager import DbManager
from objects.user import User
import logging


class AuthManager:
    def __init__(self, app, app_config, db_manager: DbManager):
        self.db_manager = db_manager
        self.logger = logging.getLogger(__name__)
        for k in app_config.keys():
            if k.startswith("GITLAB"):
                app.config[k] = app_config[k]
            if k.startswith("GITHUB"):
                app.config[k] = app_config[k]
        self.oauth = OAuth(app)
        self.oauth.init_app(app)
        self.enable_gitlab_oauth = False
        if str(app_config.get("ENABLE_GITLAB_OAUTH")).lower() == "true":
            self.enable_gitlab_oauth = True
            self.oauth.register("gitlab", client_kwargs={'scope': 'openid'})
        self.enable_github_oauth = False
        if str(app_config.get("ENABLE_GITHUB_OAUTH")).lower() == "true":
            self.enable_github_oauth = True
            self.oauth.register("github")

    @property
    def auth_methods(self):
        auth_methods = []
        if self.enable_gitlab_oauth:
            auth_methods.append("gitlab")
        if self.enable_github_oauth:
            auth_methods.append("github")
        return auth_methods

    def get_userinfos(self) -> User:
        if self.enable_gitlab_oauth and (session.get("auth_method") == "gitlab" or session.get("auth_method") is None):
            user = None
            try:
                user = self.oauth.gitlab.userinfo(token=session.get("token"))
            except (MissingTokenError, requests.exceptions.HTTPError, authlib.integrations.base_client.errors.OAuthError) as e:
                #self.logger.warning(f"Invalid auth error : {e}")
                session["user"] = None
                session["auth_method"] = None
            if user is not None:
                session["user"] = User.from_gitlab(user).json()
                session["auth_method"] = "gitlab"
        elif self.enable_github_oauth and (session.get("auth_method") == "github" or session.get("auth_method") is None):
            try:
                res = self.oauth.github.get("https://api.github.com/user", token=session.get("token"))
                res.raise_for_status()
                session["user"] = User.from_github(res.json()).json()
                session["auth_method"] = "github"
            except (MissingTokenError, requests.exceptions.HTTPError, authlib.integrations.base_client.errors.OAuthError) as e:
                #self.logger.warning("Invalid auth error : ", e)
                session["user"] = None
                session["auth_method"] = None

        if session.get("user") is not None:
            user = User.from_json(session.get("user"))
            self.db_manager.insert_update_user(user)
            return user
        else:
            return User("Invited", None, 0)

    def get_current_u_uid(self) -> int:
        u_info = self.get_userinfos()
        if u_info is not None:
            return u_info.user_unique_identifier
        else:
            return 0

    def check_oauth_status(self):
        #if (session.get("last_auth_check") and
        #        (datetime.now() - datetime.fromtimestamp(int(session.get("last_auth_check")))).seconds < 60):
        #    return function(*args, **kwargs)
        #session["last_auth_check"] = datetime.now().timestamp()
        if session.get("user") is not None:
            user = User.from_json(session.get("user"))
            self.db_manager.insert_update_user(user)
        self.get_userinfos()

    def check_oauth(self, function):
        @functools.wraps(function)
        def decorator(*args, **kwargs):  # Return corresponding function with oauth_status
            self.check_oauth_status()
            return function(*args, **kwargs)
        return decorator
