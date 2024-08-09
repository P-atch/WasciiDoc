CREATE TABLE IF NOT EXISTS documents(
    id_doc INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    document_uuid VARCHAR(36) NOT NULL,
    document_name VARCHAR(500) NOT NULL,
    user_uuid UNSIGNED BIGINT NOT NULL,
    restriction TINYINT NOT NULL,
    UNIQUE(document_uuid),
    FOREIGN KEY (user_uuid) REFERENCES known_users(user_uuid)
);
--
CREATE TABLE IF NOT EXISTS known_users(
    id_user INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    auth_method VARCHAR(20),
    user_uuid UNSIGNED BIGINT NOT NULL,
    known_name VARCHAR(200) NOT NULL,
    profile_image_url VARCHAR(500),
    UNIQUE(user_uuid)
);
--
INSERT OR IGNORE INTO known_users(user_uuid, known_name) VALUES (0, 'Invited');
