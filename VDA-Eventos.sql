CREATE DATABASE IF NOT EXISTS eventos_VDA
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE eventos_VDA;

CREATE TABLE IF NOT EXISTS users (
    id_user INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('usuario', 'organizador', 'administrador') NOT NULL DEFAULT 'usuario',
    avatar VARCHAR(20) NULL,
    email_verificado TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS companys (
    id_company INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    nomeEmpresa VARCHAR(50) NOT NULL,
    emailEmpresa VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS eventos (
    id_event INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nomeEvento VARCHAR(200) NOT NULL,
    categoria VARCHAR(20) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    dataEvento DATE NOT NULL,
    horaEvento TIME NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    endereco VARCHAR(255) NOT NULL,
    precoIngresso DECIMAL(10,2) NOT NULL DEFAULT 0,
    qtdIngresso INT UNSIGNED NULL,
    link VARCHAR(255) NULL,
    id_user INT UNSIGNED NOT NULL,
    id_company INT UNSIGNED NULL,
    INDEX idx_eventos_data (dataEvento, horaEvento),
    CONSTRAINT fk_eventos_usuario FOREIGN KEY (id_user)
        REFERENCES users(id_user) ON DELETE RESTRICT,
    CONSTRAINT fk_eventos_empresa FOREIGN KEY (id_company)
        REFERENCES companys(id_company) ON DELETE SET NULL
) ENGINE=InnoDB;
