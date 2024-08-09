class User:
    def __init__(self, username, profile_image_url, user_unique_identifier):
        self.user_unique_identifier = int(user_unique_identifier)
        self.username = username
        self.profile_image_url = profile_image_url


    def json(self):
        return {"username": self.username, "profile_image_url": self.profile_image_url, "user_unique_identifier": self.user_unique_identifier}

    @staticmethod
    def from_json(content: dict):
        assert isinstance(content, dict)
        for required_key in ["username", "profile_image_url", "user_unique_identifier"]:
            if required_key not in content:
                raise ValueError(f"Invalid user JSON Required key '{required_key}' is missing, full data : {content}")
        return User(content["username"], content["profile_image_url"], content["user_unique_identifier"])


    @staticmethod
    def from_github(content: dict):
        return User(content.get("name"), content.get("avatar_url"), content.get("id"))
    @staticmethod
    def from_gitlab(content: dict):
        return User(content.get("preferred_username"), content.get("picture"), content.get("sub"))