import json
import urllib.parse
from os import environ as env
import boto3
from boto3.dynamodb.conditions import Key

CHARSET = 'UTF-8'
region_name  = env.get("REGION_NAME")
table_name   = env.get("TABLE_NAME")
notification_email = env.get("NOTIFICATION_EMAIL")

source_email = 'noreply@gozeit.com'
subj = 'Abuse Gozeit Service'

table = boto3.resource("dynamodb", region_name=region_name).Table(table_name)
email_client = boto3.client('ses', region_name=region_name)


def lambda_handler(event, context):
    key_encode = event['Records'][0]['s3']['object']['key']
    key = urllib.parse.unquote(key_encode)
    email = key.split('/')[1]
    file = key.split('/')[2]
    item = file[:26]
    size = event['Records'][0]['s3']['object']['size'] / 1024
    filesize = "{:.2f}".format(size)
    response = table.query(
                KeyConditionExpression=Key("email").eq(email) & Key("item").eq(item))

    if response['Items']:
        response['Items'][0]['filesize'] = event['Records'][0]['s3']['object']['size']
        table.update_item(
                Key={'email': email, 'item': item
                },
                UpdateExpression='SET  filesize = :filesize',
                ExpressionAttributeValues={
                ':filesize': filesize
                }

            )
    else:
        msg = message_body(email)
        notification(email,msg,subj,source_email)

        # Notification to admin for abuse user
        notification(notification_email, msg, subj, source_email)
        response = table.query(
                KeyConditionExpression=Key("email").eq(email) & Key("item").eq('account'))

        if 'abuse_upload' in response['Items'][0]:

            ddos = response['Items'][0]['abuse_upload']
            ddos += 1

            if ddos > 3:
                table.update_item(
                Key={'email': email, 'item': 'account'
                },
                UpdateExpression='SET  deny_upload = :deny_upload',
                ExpressionAttributeValues={
                ':deny_upload': 'true'
                }

            )
            abuse_file = response['Items'][0]['abuse_file']
            abuse_files = abuse_file + '+' + file
            table.update_item(
                Key={'email': email, 'item': 'account'
                },
                UpdateExpression='SET  abuse_upload = :abuse_upload, abuse_file = :abuse_file',
                ExpressionAttributeValues={
                ':abuse_upload': ddos,
                ':abuse_file': abuse_files
                }
            )
        else:
            table.update_item(
                Key={'email': email, 'item': 'account'
                },
                UpdateExpression='SET  abuse_upload = :abuse_upload, abuse_file = :abuse_file',
                ExpressionAttributeValues={
                ':abuse_upload': 1,
                ':abuse_file': file
                }
            )
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }

def notification(to_addresses, msg, subj,source_email=source_email):
    return email_client.send_email(
        Destination={
            'ToAddresses': [to_addresses],
            },
            Message={
                'Body': {
                    'Text': {
                        'Charset': 'UTF-8',
                        'Data': msg,
                        },
                        },
                        'Subject': {
                            'Charset': 'UTF-8',
                            'Data': subj,
                            },
                            },
                            Source=source_email,
    )

def message_body(email):
    return """Hello!

This account {} has abused our storage service, Please be aware this action can block your account.

Thank you.

Best Regards,
Gozeit Team""".format(email)
