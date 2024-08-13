import os.path
import subprocess
import logging
from usefull import gen_random_filename


class Converter:
    def __init__(self, tmp_folder, ascii_doc_exe):
        self.tmp_folder = tmp_folder
        if not os.path.exists(tmp_folder):
            os.mkdir(tmp_folder)
        self.ascii_doc_exe = ascii_doc_exe
        self.logger = logging.getLogger(__name__)

        self._clean_tmp_folder()

    def _clean_tmp_folder(self):
        if len(os.listdir(self.tmp_folder)) >= 30:
            self.logger.info("Cleaning tmp folder")
            for e in os.listdir(self.tmp_folder):
                os.remove(os.path.join(self.tmp_folder, e))

    def convert(self, data):
        self._clean_tmp_folder()
        filename = f"{self.tmp_folder}/document.aadoc"
        output_filename = f"{self.tmp_folder}/document.html"
        with open(filename, 'w') as file:
            file.write(data)
        subprocess.run(f"{self.ascii_doc_exe} {filename} -o {output_filename}".split(' '))

        return open(output_filename, 'r').read()

    def get_doc_as(self, data, _format) -> str:
        self._clean_tmp_folder()
        _format = _format.lower()
        if _format not in ["html", "pdf"]:
            raise RuntimeError(f"Invalid format should have been catched before : {_format}")
        random_filename = gen_random_filename()
        input_filename = f"{self.tmp_folder}/{random_filename}.aadoc"
        output_filename = f"{self.tmp_folder}/{random_filename}.{_format}"
        with open(input_filename, 'w') as file:
            file.write(data)

        if _format == "html":
            subprocess.run(f"{self.ascii_doc_exe} {input_filename} -o {output_filename}".split(' '))
        elif _format == "pdf":
            subprocess.run(
                f"{self.ascii_doc_exe} -r asciidoctor-pdf -b pdf {input_filename} -o {output_filename}".split(' '))
        return output_filename
