CREATE DATABASE IF NOT EXISTS eventos_VDA;

USE eventos_VDA;

CREATE TABLE IF NOT EXISTS users(
    id_user INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    senha VARCHAR (255) NOT NULL,
    telefone CHAR (11) NOT NULL
)ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS companys(
    id_company INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    nomeEmpresa VARCHAR(50) NOT NULL,
    emailEmpresa VARCHAR(255) NOT NULL,
    telefone CHAR (11) NOT NULL
)ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS labels(
    id_label INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nomeCategoria VARCHAR(200)
)ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS eventos(
    id_event INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nomeEvento VARCHAR(200) NOT NULL,
    dataEvento DATE NOT NULL,
    horaEvento DATETIME NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    precoIngresso DECIMAL(10,2) NOT NULL,
    qtdIngresso VARCHAR(255) NOT NULl,
    inscricao VARCHAR(255) NOT NULl,
    link VARCHAR(255) NOT NULL,
    dataPublicacao DATE NOT NULL,
    id_user INT UNSIGNED,
    id_label INT UNSIGNED,
    id_company INT UNSIGNED,
    FOREIGN KEY(id_user) REFERENCES users(id_user),
    FOREIGN KEY(id_label) REFERENCES labels(id_label),
    FOREIGN KEY(id_company) REFERENCES companys(id_company)
)ENGINE=InnoDB;

