import json
import boto3
from os import environ as env

table_name = env.get("TABLE_NAME")
region_name  = env.get("REGION_NAME")

CHARSET = 'UTF-8'
welcome_subj = 'Welcome To GoZeit'
forget_password_subj = 'Your password has been changed'
source_email = 'noreply@gozeit.com'
item = 'account'
limit = 11

email_client = boto3.client('ses', region_name=region_name)
query_table = boto3.resource("dynamodb", region_name=region_name,endpoint_url="http://dynamodb." + region_name + ".amazonaws.com/").Table(table_name)

def notification(to_addresses, msg, subj,source_email=source_email):
    return email_client.send_email(
        Destination={
            'ToAddresses': [to_addresses],
            },
            Message={
                'Body': {
                    'Text': {
                        'Charset': CHARSET,
                        'Data': msg,
                        },
                        },
                        'Subject': {
                            'Charset': CHARSET,
                            'Data': subj,
                            },
                            },
                            Source=source_email,
    )

def welcome_message():
    return """Hello!

Thank you for joining GoZeit.

Regards,
Gozeit Team"""

def forget_password_message():
    return """Hello!

Your password has been changed.

This is a confirmation that your password was changed.

Regards,
Gozeit Team"""

def add_item(email):
    return query_table.put_item(Item={ 'email': email, 'item' : item, 'limit': limit})

def lambda_handler(event, context):
    email = event['request']['userAttributes']['email']

    if event['triggerSource'] == 'PostConfirmation_ConfirmSignUp':
        msg = welcome_message()
        notification(email, msg, welcome_subj)
        add_item(email)
    elif event['triggerSource'] == 'PostConfirmation_ConfirmForgotPassword':
        msg = forget_password_message()
        notification(email,msg, forget_password_subj)

    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }