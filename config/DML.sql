-- tipos de usuario
insert ignore into user_type
(id_user_type, user_type)
values
(1, 'Personal Administrativo'),
(2, 'Profesor'),
(3, 'Estudiante'),
(4, 'Camara');

-- horarios
insert ignore into schedule_time
(id_schedule_time, schedule_time)
values
(1, time('7:00')),
(2, time('8:30')),
(3, time('10:10')),
(4, time('11:30')),
(5, time('13:00')),
(6, time('14:20')),
(7, time('15:40')),
(8, time('17:00')),
(9, time('18:30')),
(10, time('20:00')),
(11, time('21:30'));

-- dias de semana
insert ignore into schedule_day
(id_schedule_day, schedule_day, alias)
values
(1, 'Domingo', 'Do'),
(2, 'Lunes', 'Lu'),
(3, 'Martes', 'Ma'),
(4, 'Miercoles', 'Mi'),
(5, 'Jueves', 'Ju'),
(6, 'Viernes', 'Vi'),
(7, 'Sabado', 'Sa');

-- super usuario y camara deeplens (clave: Unitec2020!)
insert ignore into user
(`id_user`, `id_user_type`, `names`, `surnames`, `email`, `password`)
values
(1, 1, 'super', 'usuario', 'admin@unitec.edu', '$2a$12$4nEaL8xOt0OMgdGN..67GOqyCXkWCeQf18J.g2hKG6S0nNRIu9qiS'),
(1, 4, 'deep', 'lens 1', 'deeplens1@unitec.edu', '$2a$12$4nEaL8xOt0OMgdGN..67GOqyCXkWCeQf18J.g2hKG6S0nNRIu9qiS');
