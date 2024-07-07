
-- Create the database if it doesn't exist and use it
CREATE DATABASE IF NOT EXISTS `AccessControl` DEFAULT CHARACTER SET utf8;
USE `AccessControl`;

-- Create stored procedure to create tables and other procedures
DELIMITER //

CREATE PROCEDURE `CreateAccessControlSchema`()
BEGIN
    -- Create tables
    CREATE TABLE IF NOT EXISTS `User` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `username` VARCHAR(45) NOT NULL,
        `password` VARCHAR(45) NOT NULL,
        PRIMARY KEY (`id`),
        UNIQUE INDEX `username_UNIQUE` (`username` ASC)
    ) ENGINE = InnoDB;

    CREATE TABLE IF NOT EXISTS `Action` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `name` VARCHAR(45) NOT NULL,
        `description` VARCHAR(200) NOT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE = InnoDB;

    CREATE TABLE IF NOT EXISTS `Group` (
        `id` INT NOT NULL AUTO_INCREMENT,
        `name` VARCHAR(45) NOT NULL,
        `description` VARCHAR(200) NOT NULL,
        PRIMARY KEY (`id`)
    ) ENGINE = InnoDB;

    CREATE TABLE IF NOT EXISTS `User_group` (
        `user_id` INT NOT NULL,
        `group_id` INT NOT NULL,
        PRIMARY KEY (`user_id`, `group_id`),
        INDEX `fk_user_has_group_group1_idx` (`group_id` ASC),
        INDEX `fk_user_has_group_user1_idx` (`user_id` ASC),
        CONSTRAINT `fk_user_has_group_user1`
            FOREIGN KEY (`user_id`)
            REFERENCES `User` (`id`)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION,
        CONSTRAINT `fk_user_has_group_group1`
            FOREIGN KEY (`group_id`)
            REFERENCES `Group` (`id`)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
    ) ENGINE = InnoDB;

    CREATE TABLE IF NOT EXISTS `Action_group` (
        `Group_id` INT NOT NULL,
        `Action_id` INT NOT NULL,
        PRIMARY KEY (`Group_id`, `Action_id`),
        INDEX `fk_Group_has_Action_Action1_idx` (`Action_id` ASC),
        INDEX `fk_Group_has_Action_Group1_idx` (`Group_id` ASC),
        CONSTRAINT `fk_Group_has_Action_Group1`
            FOREIGN KEY (`Group_id`)
            REFERENCES `Group` (`id`)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION,
        CONSTRAINT `fk_Group_has_Action_Action1`
            FOREIGN KEY (`Action_id`)
            REFERENCES `Action` (`id`)
            ON DELETE NO ACTION
            ON UPDATE NO ACTION
    ) ENGINE = InnoDB;
END//

DELIMITER ;

-- Call the procedure to create schema and tables
CALL `CreateAccessControlSchema`;

-- Create procedures to insert data
DELIMITER //

CREATE PROCEDURE `InsertUser`(IN _username VARCHAR(45), IN _password VARCHAR(45))
BEGIN
    DECLARE new_user_id INT;

    INSERT INTO `User` (username, password) VALUES (_username, _password);
    SET new_user_id = LAST_INSERT_ID();

    SELECT new_user_id AS insertId; 
END//

CREATE PROCEDURE `InsertAction`( IN _name VARCHAR(45), IN _description VARCHAR(200))
BEGIN
    INSERT INTO `Action` ( name, description) VALUES (_id, _name, _description);
END//

CREATE PROCEDURE `InsertGroup`(IN _name VARCHAR(45), IN _description VARCHAR(200))
BEGIN
    INSERT INTO `Group` ( name, description) VALUES (_id, _name, _description);
END//

DELIMITER ;

