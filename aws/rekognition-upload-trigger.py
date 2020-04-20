from __future__ import print_function

import boto3
import urllib

s3 = boto3.client('s3')
dynamodb = boto3.client('dynamodb')
rekognition = boto3.client('rekognition')


def index_faces(bucket, key):
    # index face into rekognition from s3 bucket
    response = rekognition.index_faces(
        Image={'S3Object':
            {'Bucket': bucket,
            'Name': key}},
            CollectionId='students_collection')
    return response


def update_index(tableName, faceId, accountNumber):
    # add new index face to the database
    response = dynamodb.put_item(
        TableName=tableName,
        Item={
            'RekognitionId': {'S': faceId},
            'AccountNumber': {'S': accountNumber}
            }
        )
    return response


def lambda_handler(event, context):
    # Get the object from the event
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = urllib.unquote_plus(
        event['Records'][0]['s3']['object']['key'].encode('utf8'))

    try:
        # Calls Amazon Rekognition IndexFaces API to detect faces in S3 object
        # to index faces into specified collection
        response = index_faces(bucket, key)

        # Commit faceId and account number object metadata to DynamoDB
        if response['ResponseMetadata']['HTTPStatusCode'] == 200:
            faceId = response['FaceRecords'][0]['Face']['FaceId']

            ret = s3.head_object(Bucket=bucket, Key=key)
            studentAccountNum = ret['Metadata']['accountnumber']

            update_index('students_collection', faceId, studentAccountNum)

        # Print response to console
        print('Reponse: {}'.format(response))

        return response
    except Exception as e:
        print(e)
        print('Error processing object {} from bucket {}. '.format(key, bucket))
        raise e
