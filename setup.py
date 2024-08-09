import time
import time
from setuptools import setup, Command
import os
import sys
import subprocess

class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    ENDC = '\033[0m'

class Build(Command):
    """Custom build command."""

    user_options = [ ]

    def initialize_options(self) -> None:
        r = subprocess.run("npm".split(' '), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        while r.returncode is None:
            time.sleep(0.1)
        if r.returncode == 127:
            print(
                f"{bcolors.FAIL}Error : npm is required to build angular app{bcolors.ENDC}")
            exit(1)
        print(f"{bcolors.OKCYAN}Found npm binary{bcolors.ENDC}")


    def finalize_options(self) -> None:
        print("OK")

    def run(self) -> None:
        print("OK")


if sys.version_info < (3, 11):
    sys.exit('Sorry, Python < 3.11 is not supported')
r = subprocess.run("asciidoctor -h".split(' '), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
while r.returncode is None:
    time.sleep(0.1)
if r.returncode != 0:
    print(f"{bcolors.WARNING}Warning : asciidoctor binary is required, either set in parameters or add it to the path{bcolors.ENDC}")

setup(
    name='WasciiDoc',
    version='1.0.0',
    cmdclass={'build_angular': Build},
    python_requires='>3.11.0',
    install_requires=[
        'flask',
        'flask-socketio',
        'asciidoc',
        'python-dotenv',
        'requests',
        'Authlib',
        'gunicorn',
        'gevent'
    ],

)