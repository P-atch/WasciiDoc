class DocumentRestriction:
    EDITABLE = 4  # Public
    LIMITED = 3  # No stranger edit
    LOCKED = 2  # Only owner can edit
    PROTECTED = 1   # Only owner can edit, no stranger R/O
    PRIVATE = 0     # Only owner can access

    def __init__(self, restriction: int):
        if restriction < 0 or restriction > 4:
            raise ValueError("Restriction must be between 0 and 4")
