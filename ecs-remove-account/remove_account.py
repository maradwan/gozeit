import boto3
from boto3.dynamodb.conditions import Key
from os import environ as env

CHARSET = 'UTF-8'

email = env.get("email")
request = env.get("request")
item = env.get("item")
s3_key_file = env.get("s3_key_file")

region_name = env.get("region_name")
UserPoolId = env.get("userpoolid")
table_name = env.get("table_name")
source_email = env.get("source_email")
s3_bucket = env.get("s3_bucket")

subj_remove_account = 'Gozeit Deleted Your Account'

query_table = boto3.resource("dynamodb", region_name=region_name,endpoint_url="http://dynamodb." + region_name + ".amazonaws.com/").Table(table_name)
cognito = boto3.client('cognito-idp',region_name=region_name)
email_client = boto3.client('ses',region_name=region_name)

def delete_records(email):
    items = query_table.query(
        KeyConditionExpression=Key("email").eq(email)
        )
    for i in range(len(items['Items'])):
        query_table.delete_item(
        Key={
            'email': email,
            'item' : items['Items'][i]['item']
            }
            )
    s3 = boto3.resource('s3')
    if email:
        bucket = s3.Bucket(s3_bucket)
        key= 'customers/' + email + '/'
        for obj in bucket.objects.filter(Prefix=key):
            s3.Object(bucket.name,obj.key).delete()
    return True

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

def message_body(email):
    return """Hello!

We deleted your account {} as requested.

Thank you.

Best Regards,
Gozeit Team""".format(email)

if request == 'remove_account':
    try:
        delete_records(email)
        cognito.admin_delete_user(
            UserPoolId= UserPoolId,
            Username= email
            )
        print(email + ' has been removed')
        msg = message_body(email)
        notification(email, msg, subj_remove_account)
    except:
        pass

if request == 'remove_s3_file':
    try:
        s3 = boto3.resource('s3')
        file_remove = s3.Object(s3_bucket,s3_key_file)
        file_remove.delete()
    except:
        pass