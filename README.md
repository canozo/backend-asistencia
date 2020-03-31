# Sistema de Asistencia: Backend

En este repositorio se encuentran todos los recursos y el codigo necesario para el backend del sistema de asistencia con reconocimiento facial.

## EC2
Necesitamos crear una instancia de EC2 para desplegar el Web Server. En este caso utilizaremos Ubuntu 18. Al momento de crear la instancia, asegurarse que en el `Security Group` se permitan los puertos de SSH, HTTP y HTTPS a cualquier IP de origen.

Luego debemos secargar las llaves de acceso para ingresar con SSH, y crear la instancia. Para ingresar a la instancia utilizamos el siguiente comando, donde `llaves.pem` es el archivo de llaves que acabamos de descargar y `ec2-3-82-189-61.compute-1.amazonaws.com` es el DNS de nuestra instancia:
```
ssh -i llaves.pem ubuntu@ec2-3-82-189-61.compute-1.amazonaws.com
```

## Node
Ya que estamos en Ubuntu, actualizamos los repositorios e instalamos Node:
```
sudo apt update
curl -sL https://deb.nodesource.com/setup_10.x -o nodesource_setup.sh
sudo apt install nodejs
```
## PM2
Podemos utilizar un administrador de procesos para nuestro servidor Node, en este utilizaremos [PM2](https://pm2.keymetrics.io/):
```
sudo npm install pm2 -g
```
## Certificado SSL
Asegurarse que openssl esta instalado, correr el comando:
```
openssl req -nodes -new -x509 -keyout server.key -out server.cert
```
Este nos hara una serie de preguntas, responderlas concordemente. Cuando nos pregunte el `Common Name` ingresar `localhost` si es un ambiente local o el nombre de dominio de la instancia EC2 si es en el ambiente de produccion (ej: `ec2-3-82-189-61.compute-1.amazonaws.com`).

## NGINX
En caso de que en un futuro querramos utilizar un ambiente de produccion mas robusto, balanceo de carga o otro servidor de Node, utilizamos `NGINX`:
```
sudo apt install nginx
```

Modificar el archivo `/etc/nginx/sites-available/default`:
```
server {
	listen 80 default_server;
	listen [::]:80 default_server;

	listen 443 ssl default_server;
	listen [::]:443 ssl default_server;

	ssl_certificate  /etc/nginx/ssl/server.cert;
	ssl_certificate_key /etc/nginx/ssl/server.key;

	root /var/www/html;

	index index.html;

	server_name _;

	location / {
		try_files $uri $uri/ =404;
	}

	location /api {
		proxy_pass http://localhost:5000;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host $host;
		proxy_cache_bypass $http_upgrade;
	}
}
```

Despues de hacer cualquier cambio, probar si no hay errores `sudo nginx -t` y reiniciar el servicio `sudo service nginx restart`.

Ahora podemos clonar el repositorio e iniciar el servidor:
```
git clone https://github.com/canozo/backend-asistencia.git
cd backend-asistencia
npm i
pm2 start app.js
```
