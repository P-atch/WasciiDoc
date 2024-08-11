class DocumentRestriction:
    EDITABLE = 4  # Public
    LIMITED = 3  # No stranger edit
    LOCKED = 2  # Only owner can edit
    PROTECTED = 1   # Only owner can edit, no stranger R/O
    PRIVATE = 0     # Only owner can access

    def __init__(self, restriction: int):
        if restriction < 0 or restriction > 4:
            raise ValueError("Restriction must be between 0 and 4")

    @staticmethod
    def from_string(restriction: str) -> int | None:
        if restriction in ["0","1","2","3","4"]:
            return int(restriction)
        else:
            if restriction.lower() == "editable":
                return DocumentRestriction.EDITABLE
            elif restriction.lower() == "limited":
                return DocumentRestriction.LIMITED
            elif restriction.lower() == "locked":
                return DocumentRestriction.LOCKED
            elif restriction.lower() == "protected":
                return DocumentRestriction.PROTECTED
            elif restriction.lower() == "private":
                return DocumentRestriction.PRIVATE
