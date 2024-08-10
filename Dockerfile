FROM debian:latest

RUN apt update
RUN apt -y install python3.11 asciidoctor python3-pip python3-setuptools
COPY . /opt/wasciidoc
#RUN python3.11 /opt/wasciidoc/setup.py install
RUN python3.11 -m pip install -r /opt/wasciidoc/requirements.txt

ENV PYTHONPATH="$PYTHONPATH;/opt/wasciidocapi/src/"

EXPOSE 80
RUN mkdir /opt/wasciidoc/workdir
RUN useradd -M -s /sbin/nologin wasciidoc
RUN chown wasciidoc: -R /opt/wasciidoc/

WORKDIR /opt/wasciidocapi/workdir
ENTRYPOINT ["gunicorn", "--worker-class", "eventlet", "-w", "1", "-b", "--uid", "wasciidoc", "--gid", "wasciidoc", "0.0.0.0:80", "main:app"]