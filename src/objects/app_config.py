class AppConfig:
    def __init__(self, allow_anonymous_edit: bool,
                 allow_anonymous_creation: bool,
                 debug: bool,
                 default_doc_permission: int):
        self.allow_anonymous_edit = allow_anonymous_edit
        self.allow_anonymous_creation = allow_anonymous_creation
        self.debug = debug
        self.default_doc_permission = default_doc_permission

    def json(self, for_user=True):
        return {
            'allow_anonymous_edit': self.allow_anonymous_edit,
            'allow_anonymous_creation': self.allow_anonymous_creation,
        }
