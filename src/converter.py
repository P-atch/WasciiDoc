import os.path
import subprocess
class Converter:
    def __init__(self, tmp_folder, ascii_doc_exe):
        self.tmp_folder = tmp_folder

        if not os.path.exists(tmp_folder):
            os.mkdir(tmp_folder)
        self.ascii_doc_exe = ascii_doc_exe

    def convert(self, data):
        filename = f"{self.tmp_folder}/document.aadoc"
        output_filename = f"{self.tmp_folder}/document.html"
        with open(filename, 'w') as file:
            file.write(data)
        subprocess.run(f"{self.ascii_doc_exe} {filename} -o {output_filename}".split(' '))

        return open(output_filename, 'r').read()
