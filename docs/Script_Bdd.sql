```-- Create the database
CREATE DATABASE quiz_system;

-- Use the database
USE quiz_system;
-- Create rh
Create Table rh(
    id INT PRIMARY KEY AUTO_INCREMENT,
    mail VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL UNIQUE
);


-- Create users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    creation_date DATETIME NOT NULL,
    mail VARCHAR(255) NOT NULL UNIQUE,
    token VARCHAR(255),
    result VARCHAR(50),
    temps INT,
    quizzID INT
);

-- Create quizzes table
CREATE TABLE quizzes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    time_limit INT
);

-- Create questions table
CREATE TABLE questions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    quiz_id INT NOT NULL,
    text TEXT NOT NULL,
    `order` INT NOT NULL,
    points INT NOT NULL,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- Create answers table
CREATE TABLE answers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- Create candidate_attempts table
CREATE TABLE candidate_attempts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    quiz_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    status VARCHAR(50) NOT NULL,
    score INT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
);

-- Create candidate_responses table
CREATE TABLE candidate_responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_id INT,
    time_spent INT,
    FOREIGN KEY (attempt_id) REFERENCES candidate_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id),
    FOREIGN KEY (answer_id) REFERENCES answers(id)
);
CREATE USER 'dev'@'localhost' IDENTIFIED BY 'dev';
GRANT ALL PRIVILEGES ON *.* TO 'dev'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES; 

INSERT INTO rh (mail, password_hash) VALUES ('rh@company.com', '$2b$10$JXFiL6MzFEB8vGCE2QXy8eCmv5i/pzaWvvW61lcha4J7EwAbmnWUm'
);

```