from threading import Thread, Event
import os
import re
import json
import numpy as np
import awscam
import cv2
import greengrasssdk
import boto3
import time
import datetime
import urllib
import urllib2

class LocalDisplay(Thread):
    """ Class for facilitating the local display of inference results
        (as images). The class is designed to run on its own thread. In
        particular the class dumps the inference results into a FIFO
        located in the tmp directory (which lambda has access to). The
        results can be rendered using mplayer by typing:
        mplayer -demuxer lavf -lavfdopts format=mjpeg:probesize=32 /tmp/results.mjpeg
    """
    def __init__(self, resolution):
        """ resolution - Desired resolution of the project stream """
        # Initialize the base class, so that the object can run on its own
        # thread.
        super(LocalDisplay, self).__init__()
        # List of valid resolutions
        RESOLUTION = {'1080p' : (1920, 1080), '720p' : (1280, 720), '480p' : (858, 480)}
        if resolution not in RESOLUTION:
            raise Exception("Invalid resolution")
        self.resolution = RESOLUTION[resolution]
        # Initialize the default image to be a white canvas. Clients
        # will update the image when ready.
        self.frame = cv2.imencode('.jpg', 255*np.ones([640, 480, 3]))[1]
        self.stop_request = Event()

    def run(self):
        """ Overridden method that continually dumps images to the desired
            FIFO file.
        """
        # Path to the FIFO file. The lambda only has permissions to the tmp
        # directory. Pointing to a FIFO file in another directory
        # will cause the lambda to crash.
        result_path = '/tmp/results.mjpeg'

        # Create the FIFO file if it doesn't exist.
        if not os.path.exists(result_path):
            os.mkfifo(result_path)

        # This call will block until a consumer is available
        with open(result_path, 'w') as fifo_file:
            while not self.stop_request.isSet():
                try:
                    # Write the data to the FIFO file. This call will block
                    # meaning the code will come to a halt here until a consumer
                    # is available.
                    fifo_file.write(self.frame.tobytes())
                except IOError:
                    continue

    def set_frame_data(self, frame):
        """ Method updates the image data. This currently encodes the
            numpy array to jpg but can be modified to support other encodings.
            frame - Numpy array containing the image data tof the next frame
                    in the project stream.
        """
        ret, jpeg = cv2.imencode('.jpg', cv2.resize(frame, self.resolution))
        if not ret:
            raise Exception('Failed to set frame data')
        self.frame = jpeg

    def join(self):
        self.stop_request.set()

def infinite_infer_run():
    """ Entry point of the lambda function"""
    # Create an IoT client for sending to messages to the cloud.
    client = greengrasssdk.client('iot-data')
    iot_topic = '$aws/things/{}/infer'.format(os.environ['AWS_IOT_THING_NAME'])

    try:
        # set request to login with backend
        data = urllib.urlencode({
            'email': os.environ['CAMERA_USER'],
            'password': os.environ['CAMERA_PW']
        })
        host = 'https://ec2-3-86-140-112.compute-1.amazonaws.com'
        url = host + '/api/auth/login'
        req = urllib2.Request(url, data)
        cert = '/etc/asistencia/server.cert'
        token = ''

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

        # This face detection model is implemented as single shot detector (ssd).
        model_type = 'ssd'
        output_map = {1: 'face'}

        # Create a local display instance that will dump the image bytes to a FIFO
        # file that the image can be rendered locally.
        local_display = LocalDisplay('1080p')
        local_display.start()

        # The sample projects come with optimized artifacts, hence only the artifact
        # path is required.
        model_path = '/opt/awscam/artifacts/mxnet_deploy_ssd_FP16_FUSED.xml'

        # Load the model onto the GPU.
        client.publish(topic=iot_topic, payload='Loading face detection model')
        model = awscam.Model(model_path, {'GPU': 1})
        client.publish(topic=iot_topic, payload='Face detection model loaded')

        # Set the threshold for detection
        detection_threshold = 0.25
        # The height and width of the training set images
        input_height = 300
        input_width = 300

        token_age = 0

        # Do inference until the lambda is killed.
        while True:
            if int(time.time() * 1000.0) > token_age + 5400000:
                # token expired, get another one
                token_age = int(time.time() * 1000.0)
                res = json.loads(urllib2.urlopen(req, cafile=cert).read())
                if 'error' in res:
                    raise Exception('Couldn\'t authenticate @ backend: {}'.format(json.dump(res)))
                token = res['token']

            # Check if there is open an attendance check
            active = dynamodb.get_item(
                TableName='active_classrooms',
                Key={'IdClassroom': {'N': os.environ['ID_CLASSROOM']}})

            if 'Item' in active:
                # Get a frame from the video stream
                ret, frame = awscam.getLastFrame()
                if not ret:
                    raise Exception('Failed to get frame from the stream')

                # Resize frame to the same size as the training set.
                frame_resize = cv2.resize(frame, (input_height, input_width))
                # Run the images through the inference engine and parse the results using
                # the parser API, note it is possible to get the output of doInference
                # and do the parsing manually, but since it is a ssd model,
                # a simple API is provided.
                parsed_inference_results = model.parseResult(model_type,
                                                            model.doInference(frame_resize))
                # Compute the scale in order to draw bounding boxes on the full resolution
                # image.
                yscale = float(frame.shape[0]) / float(input_height)
                xscale = float(frame.shape[1]) / float(input_width)
                # Dictionary to be filled with labels and probabilities for MQTT
                cloud_output = {}

                # Get the detected faces and probabilities
                for obj in parsed_inference_results[model_type]:
                    if obj['prob'] > detection_threshold:
                        # Get the face position
                        xmin = int(xscale * obj['xmin'])
                        ymin = int(yscale * obj['ymin'])
                        xmax = int(xscale * obj['xmax'])
                        ymax = int(yscale * obj['ymax'])

                        # Cut the image of the face on a new picture
                        face_img = frame[ymin:ymax, xmin:xmax]

                        # set filename
                        now = datetime.datetime.now()
                        keyname = re.sub(r'[ \-:.]', '', str(now)) + '.jpg'

                        # save locally
                        local_file = '/tmp/{}'.format(keyname)
                        cv2.imwrite(local_file, face_img)

                        # upload to S3
                        metadata = {
                            'IdAttendanceLog': active['Item']['IdAttendanceLog']['N'],
                            'token': token
                        }
                        res_key = 'captures/{}'.format(keyname)
                        s3.upload_file(
                            local_file,
                            os.environ['MAIN_BUCKET_NAME'],
                            res_key,
                            ExtraArgs={'Metadata': metadata})

                        # remove locally
                        os.remove(local_file)

                        # Add bounding boxes to full resolution frame
                        # See https://docs.opencv.org/3.4.1/d6/d6e/group__imgproc__draw.html
                        # for more information about the cv2.rectangle method.
                        # Method signature: image, point1, point2, color, and tickness.
                        cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), (255, 165, 20), 10)

                        # Amount to offset the label/probability text above the bounding box.
                        text_offset = 15
                        # See https://docs.opencv.org/3.4.1/d6/d6e/group__imgproc__draw.html
                        # for more information about the cv2.putText method.
                        # Method signature: image, text, origin, font face, font scale, color,
                        # and tickness
                        cv2.putText(frame, '{:.2f}%'.format(obj['prob'] * 100),
                                    (xmin, ymin-text_offset),
                                    cv2.FONT_HERSHEY_SIMPLEX, 2.5, (255, 165, 20), 6)
                        # Store label and probability to send to cloud
                        cloud_output[output_map[obj['label']]] = obj['prob']

                # Set the next frame in the local display stream.
                local_display.set_frame_data(frame)

                # Send results to the cloud
                client.publish(topic=iot_topic, payload=json.dumps(cloud_output))
            else:
                # Send heartbeat to the cloud
                client.publish(topic=iot_topic, payload='Waiting attendance open')

            # Sleep for 5 seconds to alleviate workload
            time.sleep(5)

    except Exception as ex:
        client.publish(topic=iot_topic, payload='Error in face detection lambda: {}'.format(ex))

# run the infer function
infinite_infer_run()

# dummy handler
def function_handler(event, context):
    return
