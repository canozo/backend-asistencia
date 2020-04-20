from __future__ import print_function

import boto3
import urllib
import urllib2

s3 = boto3.client('s3')
dynamodb = boto3.client('dynamodb')
rekognition = boto3.client('rekognition')


def lambda_handler(event, context):
    # Get the object from the event
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.unquote_plus(
        event['Records'][0]['s3']['object']['key'].encode('utf8'))

    try:
        response = rekognition.search_faces_by_image(
                CollectionId='students_collection',
                Image={'S3Object': {
                    'Bucket': bucket,
                    'Name': key}},
                )

        for match in response['FaceMatches']:
            print(match['Face']['FaceId'], match['Face']['Confidence'])

            face = dynamodb.get_item(
                TableName='students_collection',
                Key={'RekognitionId': {'S': match['Face']['FaceId']}})

            if 'Item' in face:
                ret = s3.head_object(Bucket=bucket, Key=key)
                token = ret['Metadata']['token']
                idAttendanceLog = ret['Metadata']['idattendancelog']
                accountNumber = face['Item']['AccountNumber']['S']
                if match['Face']['Confidence'] >= 90:
                    # There is a sure match, mark attendance and stop looking for faces
                    data = urllib.urlencode({})
                    host = 'http://192.168.1.2:5000'
                    url = host + '/api/attendance'
                    req = urllib2.Request(url, data)
                    req.add_header('Authorization', 'Bearer ' + token)
                    # res = urllib2.urlopen(req)
                    print('{}/{}/mark-account-num/{}'.format(url, idAttendanceLog, accountNumber))
                    break
            else:
                print('Face not found in database.')

        # Print response to console
        print('Reponse: {}'.format(response))

        return response
    except Exception as e:
        print(e)
        print('Error processing object {} from bucket {}. '.format(key, bucket))
        raise e
