# Sistema de Asistencia: AWS

En este repositorio se encuentran todos los recursos de AWS utilizados para desarrollar el proyecto de un sistema de asistencia con reconocimiento facial. Para el codigo de el web server, revisar el [repositorio del web server](https://github.com/canozo/backend-asistencia).

## Despliegue del proyecto:

Antes de iniciar necesitamos el [interfaz de línea de comandos de AWS](https://aws.amazon.com/es/cli/) instalado en el sistema operativo.

1. Primero creamos la colección con AWS Rekognition:
```
aws rekognition create-collection --collection-id students_collection --region us-east-1
```

2. Creamos una tabla en DynamoDB para el indexado de los rostros con numeros de cuenta:
```
aws dynamodb create-table --table-name students_collection \
--attribute-definitions AttributeName=RekognitionId,AttributeType=S \
--key-schema AttributeName=RekognitionId,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
--region us-east-1
```

3. También creamos una tabla para saber que aulas de clases tienen asistencia abierta
```
aws dynamodb create-table --table-name active_classrooms \
--attribute-definitions AttributeName=IdClassroom,AttributeType=N \
--key-schema AttributeName=IdClassroom,KeyType=HASH \
--provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
--region us-east-1
```

4. Creamos un bucket en S3:
```
aws s3 mb s3://unitec-face-id --region us-east-1
```

5. Agregamos los permisos de acceso en los archivos `trust-policy.json` y `access-policy.json`, luego creamos un rol con estos:
```
create-role --role-name LambdaRekognitionRole --assume-role-policy-document file://trust-policy.json
```
```
aws iam put-role-policy --role-name LambdaRekognitionRole --policy-name LambdaPermissions --policy-document file://access-policy.json
```

6. Creamos una función lambda para manejar el ingreso de nuevas imagenes de usuarios al bucket S3 (`rekognition-upload-trigger.py`), esta función tiene el rol de LambdaRekognitionRole y se activa con un trigger en el bucket S3 en la carpeta `index/`.

7. Creamos una función lambda para manejar el ingreso de nuevos rostros detectados a traves de nuestro AWS Deeplens al bucket S3 (`rekognition-capture-trigger.py`), esta función tiene el rol de LambdaRekognitionRole y se activa con un trigger en el bucket S3 en la carpeta `captures/`.

## AWS DeepLens
La documentación del AWS DeepLens no esta totalmente actualizada, y el dispositivo tiene varios problemas al momento de registrarse con AWS: no se actualiza automáticamente como debería mediante el interfaz web, y el dispositivo no se puede utilizar si no esta totalmente actualizado.

### Actualizar y registrar
Para actualizar, se debe ingresar al dispositivo utilizando un cable Micro-HDMI o por medio de SSH (conectarse a la misma red wi-fi del dispositivo y configurar la clave de acceso al usuario aws_cam en http://deeplens.amazon.net/#deviceAccess), luego se deben actualizar los sources en `/etc/apt/sources.list` para permitir otros sources. Los sources utilizados en este proyecto se encuentran en `sources.list`.

### Salida de video
Si se esta conectado a la misma red del AWS DeepLens, se debería de poder ver la salida del video de esta por medio de un interfaz web en el puerto 4000, ej: https://192.168.1.9:4000/.

Para ver la salida de video hay que entrar al dispositivo con un cable Micro-HDMI y ejecutar el comando:
```
mplayer -demuxer lavf -lavfdopts format=mjpeg:probesize=32 /tmp/results.mjpeg
```
La salida del video procesado se almacena imagen por imagen en el archivo `/tmp/results.mjpeg`.

### Variables de entorno
El DeepLens o el dispositivo de la cámara debe tener una variable de entorno `ID_CLASSROOM` configurada en él, para identificar en que aula de clases está instalado el dispositivo, esto nos ayuda a identificar en que sección los profesores abren asistencia. La variable `MAIN_BUCKET_NAME` es el nombre de nuestro bucket S3 (en este caso, `unitec-face-id`). Las variables `CAMERA_USER` y `CAMERA_PW` nos sirven para que la camara se autentique automaticamente con el backend para enviar un token Las variables de entorno deben configurarse en la funcion Lambda en AWS:
```
ID_CLASSROOM="1"
MAIN_BUCKET_NAME="unitec-face-id"
CAMERA_USER="deeplens1@unitec.edu"
CAMERA_PW="claveEjemplo123"
```

Este identificador debe ser un identificador valido en la base de datos MySQL, en la tabla `class`.

### Desplegar
Una vez registrado y actualizado el AWS DeepLens, nos dirigimos a la consola y ingresamos a Desplegar un proyecto. Luego nos dirigmos a Crear un nuevo proyecto y seleccionamos el proyecto de ejemplo de Deteccion de rostros. Luego de crear el proyecto, nos deberia de crear una nueva función lambda cuyo nombre empieza con `deeplens-` (posiblemente se llame `deeplens-face-detection`). Debemos ingresar a esta función y agregar las variables de entorno. Luego modificamos el codigo de la función concorde a el codigo en `deeplens-inference-function.py`.

Luego de hacer esto, siguiendo las buenas prácticas de AWS, debemos crear un nuevo rol con todos los permisos necesarios a S3 y asignarle este rol a la cámara. El único permiso que necesitamos es `PutObject`, aunque podemos agregar acceso total a S3. Luego de crear el rol, obtenemos las credenciales necesarias (`Access key ID` y `Secret access key`), e ingresamos estas credenciales en el archivo `deeplens-inference-function.py`:
```py
# s3 client
s3 = boto3.client(
    's3',
    aws_access_key_id='<AWS_ACCESS_KEY_ID>',
    aws_secret_access_key='<AWS_SECRET_ACCESS_KEY>'
)

# dynamodb client
dynamodb = boto3.client(
    'dynamodb',
    aws_access_key_id='<AWS_ACCESS_KEY_ID>',
    aws_secret_access_key='<AWS_SECRET_ACCESS_KEY>'
)
```
