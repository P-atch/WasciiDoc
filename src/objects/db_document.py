class DbDocument:
    def __init__(self, doc_uuid: str, doc_name, owner, restriction, owner_known_name):
        self.doc_uuid = doc_uuid
        self.doc_name = doc_name
        self.owner = owner
        self.restriction = restriction
        self.owner_known_name = owner_known_name

    def json(self):
        return {
            "doc_uuid": self.doc_uuid,
            "doc_name": self.doc_name,
            "owner": self.owner,
            "owner_known_name": self.owner_known_name,
            "restriction": self.restriction
        }

    def __str__(self):
        return str(self.json())