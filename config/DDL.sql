CREATE SCHEMA IF NOT EXISTS `asistencia`;
USE `asistencia`;

CREATE TABLE IF NOT EXISTS `user_type` (
  `id_user_type` INT NOT NULL AUTO_INCREMENT,
  `user_type` VARCHAR(30) NOT NULL COMMENT 'Descripcion del tipo de usuario, ej: Estudiante, Profesor, Personal Administrativo',
  `alias` VARCHAR(20) NOT NULL COMMENT 'Alias corto del tipo de usuario, ej: student, professor, admin, camera. Se utiliza para las rutas del sitio web.',
  PRIMARY KEY (`id_user_type`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `user` (
  `id_user` INT NOT NULL AUTO_INCREMENT,
  `id_user_type` INT NOT NULL,
  `email` VARCHAR(35) NOT NULL COMMENT 'Correo del usuario, ej: cano@unitec.edu',
  `names` VARCHAR(25) NOT NULL COMMENT 'Nombres, ej: Javier Edgardo',
  `surnames` VARCHAR(25) NOT NULL COMMENT 'Apellidos, ej: Cano Deras',
  `password` VARCHAR(64) NOT NULL COMMENT 'Clave del usuario hasheada, utilizando bcrypt',
  `account_number` VARCHAR(10) NULL COMMENT 'Numero de cuenta, ej: 11741291',
  PRIMARY KEY (`id_user`),
  INDEX `fk_users_user_type1_idx` (`id_user_type` ASC),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC),
  UNIQUE INDEX `account_number_UNIQUE` (`account_number` ASC),
  CONSTRAINT `fk_users_user_type1`
    FOREIGN KEY (`id_user_type`)
    REFERENCES `user_type` (`id_user_type`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `campus` (
  `id_campus` INT NOT NULL AUTO_INCREMENT,
  `id_created_by` INT NOT NULL,
  `campus` VARCHAR(40) NOT NULL COMMENT 'Nombre del campus, ej: UNITEC Tegucigalpa',
  `alias` VARCHAR(15) NOT NULL COMMENT 'Alias corto del campus, ej: UNITEC-TGU',
  PRIMARY KEY (`id_campus`),
  INDEX `fk_campus_users1_idx` (`id_created_by` ASC),
  CONSTRAINT `fk_campus_users1`
    FOREIGN KEY (`id_created_by`)
    REFERENCES `user` (`id_user`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `building` (
  `id_building` INT NOT NULL AUTO_INCREMENT,
  `id_campus` INT NOT NULL,
  `id_created_by` INT NOT NULL,
  `alias` VARCHAR(10) NOT NULL COMMENT 'Alias del edificio, ej: 02, 03, CATI',
  PRIMARY KEY (`id_building`),
  INDEX `fk_edificio_campus1_idx` (`id_campus` ASC),
  INDEX `fk_building_users1_idx` (`id_created_by` ASC),
  CONSTRAINT `fk_edificio_campus1`
    FOREIGN KEY (`id_campus`)
    REFERENCES `campus` (`id_campus`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_building_users1`
    FOREIGN KEY (`id_created_by`)
    REFERENCES `user` (`id_user`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `classroom` (
  `id_classroom` INT NOT NULL AUTO_INCREMENT,
  `id_building` INT NOT NULL,
  `id_created_by` INT NOT NULL,
  `capacity` INT NOT NULL COMMENT 'Capacidad maxima de estudiantes en el aula, ej: 30, 45',
  `alias` VARCHAR(10) NOT NULL COMMENT 'Alias corto del aula, ej: 301, 302, LAB1',
  PRIMARY KEY (`id_classroom`),
  INDEX `fk_aula_edificio_idx` (`id_building` ASC),
  INDEX `fk_classroom_users1_idx` (`id_created_by` ASC),
  CONSTRAINT `fk_aula_edificio`
    FOREIGN KEY (`id_building`)
    REFERENCES `building` (`id_building`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_classroom_users1`
    FOREIGN KEY (`id_created_by`)
    REFERENCES `user` (`id_user`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `class` (
  `id_class` INT NOT NULL AUTO_INCREMENT,
  `id_created_by` INT NOT NULL,
  `class` VARCHAR(50) NOT NULL COMMENT 'Nombre de la clase, ej: Algoritmos y Estructuras de datos II',
  `code` VARCHAR(10) NOT NULL COMMENT 'Codigo de la clase, ej: MAT420',
  `comments` VARCHAR(100) NULL COMMENT 'Comentarios de la clase, ej: Con Laboratorios (LCP208)',
  PRIMARY KEY (`id_class`),
  INDEX `fk_class_users1_idx` (`id_created_by` ASC),
  UNIQUE INDEX `code_UNIQUE` (`code` ASC),
  CONSTRAINT `fk_class_users1`
    FOREIGN KEY (`id_created_by`)
    REFERENCES `user` (`id_user`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `schedule_time` (
  `id_schedule_time` INT NOT NULL AUTO_INCREMENT,
  `schedule_time` TIME NOT NULL COMMENT 'Horario, ej: 8:30:00 (o 8:30AM), 17:10:00 (o 5:10PM)',
  PRIMARY KEY (`id_schedule_time`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `finish_time` (
  `id_finish_time` INT NOT NULL,
  PRIMARY KEY (`id_finish_time`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `semester` (
  `id_semester` INT NOT NULL AUTO_INCREMENT,
  `id_created_by` INT NOT NULL,
  `alias` VARCHAR(15) NOT NULL COMMENT 'Nombre para identificar el semestre, ej: 2018-I, 2020-Q1, etc.',
  `active` TINYINT(1) NOT NULL COMMENT 'Campo para definir si el semestre esta activo (ej, 2020-Q2 = true) o ya pasó (ej, 2018-Q1)',
  PRIMARY KEY (`id_semester`),
  UNIQUE INDEX `alias_UNIQUE` (`alias` ASC),
  INDEX `fk_semester_user1_idx` (`id_created_by` ASC),
  CONSTRAINT `fk_semester_user1`
    FOREIGN KEY (`id_created_by`)
    REFERENCES `user` (`id_user`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `section` (
  `id_section` INT NOT NULL AUTO_INCREMENT,
  `id_semester` INT NOT NULL,
  `id_class` INT NOT NULL,
  `id_classroom` INT NOT NULL,
  `id_start_time` INT NOT NULL,
  `id_finish_time` INT NOT NULL,
  `id_professor` INT NOT NULL,
  `id_created_by` INT NOT NULL,
  `comments` VARCHAR(100) NULL COMMENT 'Comentarios de la seccion, ej: Compartida con MAT111',
  PRIMARY KEY (`id_section`),
  INDEX `fk_section_schedule_time1_idx` (`id_start_time` ASC),
  INDEX `fk_section_schedule_time2_idx` (`id_finish_time` ASC),
  INDEX `fk_section_classroom1_idx` (`id_classroom` ASC),
  INDEX `fk_section_class1_idx` (`id_class` ASC),
  INDEX `fk_section_users1_idx` (`id_professor` ASC),
  INDEX `fk_section_users2_idx` (`id_created_by` ASC),
  INDEX `fk_section_semester1_idx` (`id_semester` ASC),
  CONSTRAINT `fk_section_schedule_time1`
    FOREIGN KEY (`id_start_time`)
    REFERENCES `schedule_time` (`id_schedule_time`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_section_schedule_time2`
    FOREIGN KEY (`id_finish_time`)
    REFERENCES `schedule_time` (`id_schedule_time`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_section_classroom1`
    FOREIGN KEY (`id_classroom`)
    REFERENCES `classroom` (`id_classroom`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_section_class1`
    FOREIGN KEY (`id_class`)
    REFERENCES `class` (`id_class`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_section_users1`
    FOREIGN KEY (`id_professor`)
    REFERENCES `user` (`id_user`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_section_users2`
    FOREIGN KEY (`id_created_by`)
    REFERENCES `user` (`id_user`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_section_semester1`
    FOREIGN KEY (`id_semester`)
    REFERENCES `semester` (`id_semester`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `schedule_day` (
  `id_schedule_day` INT NOT NULL AUTO_INCREMENT,
  `schedule_day` VARCHAR(45) NOT NULL COMMENT 'Horario en dias, ej: Lunes, Martes, Miercoles',
  `alias` VARCHAR(3) NOT NULL COMMENT 'Horario en dias, formato corto, ej: Lu, Ma, Mie, Jue, Vie, Sa, Do',
  PRIMARY KEY (`id_schedule_day`))
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `section_x_schedule_day` (
  `id_section` INT NOT NULL,
  `id_schedule_day` INT NOT NULL,
  PRIMARY KEY (`id_section`, `id_schedule_day`),
  INDEX `fk_section_x_schedule_day_schedule_day1_idx` (`id_schedule_day` ASC),
  CONSTRAINT `fk_section_x_schedule_day_section1`
    FOREIGN KEY (`id_section`)
    REFERENCES `section` (`id_section`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_section_x_schedule_day_schedule_day1`
    FOREIGN KEY (`id_schedule_day`)
    REFERENCES `schedule_day` (`id_schedule_day`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `attendance_log` (
  `id_attendance_log` INT NOT NULL AUTO_INCREMENT,
  `id_section` INT NOT NULL,
  `opened_at` DATETIME(0) NOT NULL COMMENT 'Hora a la que se abrio asistencia, ej: 18:30',
  `closed_at` DATETIME(0) NULL COMMENT 'Hora a la que se abrio asistencia, ej: 18:45',
  PRIMARY KEY (`id_attendance_log`),
  INDEX `fk_attendance_log_section1_idx` (`id_section` ASC),
  CONSTRAINT `fk_attendance_log_section1`
    FOREIGN KEY (`id_section`)
    REFERENCES `section` (`id_section`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `attendance_x_student` (
  `id_attendance_log` INT NOT NULL,
  `id_student` INT NOT NULL,
  `id_marked_by` INT NOT NULL,
  `marked_at` DATETIME(0) NOT NULL COMMENT 'Hora en la que se marco al estudiante, ej: 18:35',
  PRIMARY KEY (`id_attendance_log`, `id_student`),
  INDEX `fk_attendance_x_student_users1_idx` (`id_student` ASC),
  INDEX `fk_attendance_x_student_user1_idx` (`id_marked_by` ASC),
  CONSTRAINT `fk_attendance_x_student_attendance_log1`
    FOREIGN KEY (`id_attendance_log`)
    REFERENCES `attendance_log` (`id_attendance_log`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_attendance_x_student_users1`
    FOREIGN KEY (`id_student`)
    REFERENCES `user` (`id_user`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_attendance_x_student_user1`
    FOREIGN KEY (`id_marked_by`)
    REFERENCES `user` (`id_user`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `section_x_student` (
  `id_section` INT NOT NULL,
  `id_student` INT NOT NULL,
  PRIMARY KEY (`id_section`, `id_student`),
  INDEX `fk_section_x_student_users1_idx` (`id_student` ASC),
  CONSTRAINT `fk_section_x_student_section1`
    FOREIGN KEY (`id_section`)
    REFERENCES `section` (`id_section`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_section_x_student_users1`
    FOREIGN KEY (`id_student`)
    REFERENCES `user` (`id_user`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;
