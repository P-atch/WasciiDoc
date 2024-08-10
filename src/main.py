import os
from flask import Flask, render_template, redirect, url_for, make_response, session, abort, send_file
from flask_socketio import SocketIO
from dotenv import dotenv_values, load_dotenv
from converter import Converter
from auth_manager import AuthManager, User
from db_manager import DbManager
import re
from rooms_manager import RoomsManager
from documents_manager import DocumentManager
import logging
from socket_manager import SocketManager

load_dotenv(".env")

for mandatory in ["WASCII_ASCIIDOCTOR_EXEC", "DATA_FOLDER"]:
    if not os.environ.get(mandatory):
        raise EnvironmentError(f"Missing mandatory environment key '{mandatory}'")

if os.environ.get("WASCII_DEBUG"):
    print("Loading DEBUG config")
    template_folder = "../angular/dist/wascii-doc/browser/"
    static_folder = "../angular/dist/wascii-doc/browser/"
else:
    print("Loading production config")
    template_folder = "templates"
    static_folder = "static"
data_folder = os.environ["DATA_FOLDER"]
tmp_folder = os.path.join(data_folder, "documents")
for e in [data_folder, tmp_folder]:
    try:
        os.mkdir(e)
    except FileExistsError:
        pass
    if not os.path.exists(e):
        raise FileNotFoundError(e)
os.environ["PATH"] = os.environ["PATH"] + f";{os.environ.get('WASCII_RUBY_FOLDER')}"

logging.basicConfig(level=os.environ.get("WASCII_LOG_LEVEL", "INFO"))
app = Flask(__name__, template_folder=template_folder, static_folder=static_folder, static_url_path="/")
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app)
converter = Converter(tmp_folder, os.environ["WASCII_ASCIIDOCTOR_EXEC"])




db_manager = DbManager(data_folder + "/" + "db.sqlite")
auth_manager = AuthManager(app, os.environ, db_manager)
document_manager = DocumentManager(tmp_folder)
rooms_manager = RoomsManager(socketio, document_manager)
#socket_manager = SocketManager(socketio, auth_manager, db_manager)

uuid_re = r"[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}"
logger = logging.getLogger()
socketio.on_namespace(SocketManager(socketio, auth_manager, db_manager,
                                    converter, document_manager, rooms_manager, data_folder))

@app.route("/")
@auth_manager.check_oauth
def root():
    return render_template("index.html")


@app.route("/editor")
@auth_manager.check_oauth
def root1():
    return render_template("index.html")


@app.route("/editor/<doc_uuid>")
@auth_manager.check_oauth
def root2(doc_uuid):
    return render_template("index.html")


@app.route("/s/<doc_uuid>/<filename>")
@auth_manager.check_oauth
def get_static_file(doc_uuid, filename):
    if not re.fullmatch(uuid_re, doc_uuid):
        print(f"Request for static resource on invalid doc uuid : {doc_uuid}")
        abort(404)
    if not re.fullmatch(r"[A-z0-9]+\.[A-z]+", filename):
        print(f"Request for static resource on invalid filename : {filename}")
        abort(404)
    return send_file(os.path.join(document_manager.get_document_folder(doc_uuid), filename))


@app.route("/auth/gitlab/login")
def login_gitlab():
    if not str(os.environ.get("ENABLE_GITLAB_OAUTH").lower()) == "true":
        abort(404)
    redirect_uri = url_for("gitlab_oauth_callback", _external=True)
    return auth_manager.oauth.gitlab.authorize_redirect(redirect_uri)


@app.route("/auth/github/login")
def login_github():
    if not str(os.environ.get("ENABLE_GITHUB_OAUTH").lower()) == "true":
        abort(404)
    redirect_uri = url_for("github_oauth_callback", _external=True)
    return auth_manager.oauth.github.authorize_redirect(redirect_uri)


@app.route("/auth/gitlab/callback")
def gitlab_oauth_callback():
    if not str(os.environ.get("ENABLE_GITLAB_OAUTH").lower()) == "true":
        abort(404)
    token = auth_manager.oauth.gitlab.authorize_access_token()
    session["token"] = token
    auth_manager.get_userinfos()
    print(f"Session started : {session.get('user')}")
    session["auth_method"] = "gitlab"
    return redirect(url_for("root"))


@app.route("/auth/github/callback")
def github_oauth_callback():
    if not str(os.environ.get("ENABLE_GITHUB_OAUTH").lower()) == "true":
        abort(404)
    token = auth_manager.oauth.github.authorize_access_token()
    session["token"] = token
    auth_manager.get_userinfos()
    print(f"Session started : {session.get('user')}")
    session["auth_method"] = "github"
    return redirect(url_for("root"))


@app.route("/userinfo")
@auth_manager.check_oauth
def user_info():
    if not session.get("user"):
        abort(403)
    return make_response(session.get("user"))


@app.route("/logout")
def logout():
    session["user"] = None
    session["token"] = None
    return redirect(url_for("root"))


if __name__ == "__main__":
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True, host="localhost")
