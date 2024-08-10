FROM debian:latest

RUN apt update
RUN apt -y install python3.11 asciidoctor python3-pip python3-setuptools
RUN mkdir /opt/wasciidoc/
COPY *.md *.py *.txt LICENSE /opt/wasciidoc/
COPY src /opt/wasciidoc/src
#RUN python3.11 /opt/wasciidoc/setup.py install
RUN python3.11 -m pip install --break-system-packages -r /opt/wasciidoc/requirements.txt

ENV PYTHONPATH="/opt/wasciidoc/src/"
ENV DATA_FOLDER="/opt/wasciidoc/workdir/"
ENV WASCII_ASCIIDOCTOR_EXEC="asciidoctor"

EXPOSE 80
RUN mkdir /opt/wasciidoc/workdir
RUN useradd -M -s /sbin/nologin wasciidoc
RUN mkdir -p /opt/wasciidoc/workdir
RUN chown wasciidoc:wasciidoc -R /opt/wasciidoc/

WORKDIR /opt/wasciidoc/workdir
ENTRYPOINT ["gunicorn", "--worker-class", "eventlet", "-w", "1", "-u", "wasciidoc", "-g", "wasciidoc", "-b", "0.0.0.0:80", "main:app"]