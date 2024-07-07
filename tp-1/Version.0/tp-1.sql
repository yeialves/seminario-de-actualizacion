-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema AccessControl
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema AccessControl
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `AccessControl` DEFAULT CHARACTER SET utf8 ;
USE `AccessControl` ;

-- -----------------------------------------------------
-- Table `AccessControl`.`User`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AccessControl`.`User` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `password` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `AccessControl`.`Action`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AccessControl`.`Action` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `description` VARCHAR(200) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `AccessControl`.`Group`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AccessControl`.`Group` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `description` VARCHAR(200) NOT NULL,
  PRIMARY KEY (`id`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `AccessControl`.`User_group`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AccessControl`.`User_group` (
  `user_id` INT NOT NULL,
  `group_id` INT NOT NULL,
  PRIMARY KEY (`user_id`, `group_id`),
  INDEX `fk_user_has_group_group1_idx` (`group_id` ASC),
  INDEX `fk_user_has_group_user1_idx` (`user_id` ASC),
  CONSTRAINT `fk_user_has_group_user1`
    FOREIGN KEY (`user_id`)
    REFERENCES `AccessControl`.`User` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_user_has_group_group1`
    FOREIGN KEY (`group_id`)
    REFERENCES `AccessControl`.`Group` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `AccessControl`.`Action_group`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `AccessControl`.`Action_group` (
  `Group_id` INT NOT NULL,
  `Action_id` INT NOT NULL,
  PRIMARY KEY (`Group_id`, `Action_id`),
  INDEX `fk_Group_has_Action_Action1_idx` (`Action_id` ASC),
  INDEX `fk_Group_has_Action_Group1_idx` (`Group_id` ASC),
  CONSTRAINT `fk_Group_has_Action_Group1`
    FOREIGN KEY (`Group_id`)
    REFERENCES `AccessControl`.`Group` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_Group_has_Action_Action1`
    FOREIGN KEY (`Action_id`)
    REFERENCES `AccessControl`.`Action` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
