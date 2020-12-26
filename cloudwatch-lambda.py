from os import environ as env
from datetime import datetime
import boto3
import requests
from boto3.dynamodb.conditions import Key

CHARSET = 'UTF-8'

source_email = env.get("SOURCE_EMAIL")
region_name  = env.get("REGION_NAME")
table_name   = env.get("TABLE_NAME")
index_name   = env.get("INDEX_NAME")
key          = env.get("KEY")
subject      = env.get("SUBJECT")
group_subject      = env.get("GROUP_SUBJECT")

table = boto3.resource("dynamodb", region_name=region_name).Table(table_name)
email_client = boto3.client('ses', region_name=region_name)

def lambda_handler(event, context):
    resp = get_users(index_name,key,gen_time())

    for i in range(len(resp['Items'])):
        # for item == account group and users
        if resp['Items'][i]['item'] == 'account':
            continue

        ## for Group
        if '_g@gozeit.com' in resp['Items'][i]['email']:

            creator = resp['Items'][i]['creator']
            item_type = resp['Items'][i]['item_type']
            item_info = resp['Items'][i]['item_info']
            item_name = resp['Items'][i]['item_name']
            end_date = resp['Items'][i]['end_date']

            get_group = get_record(resp['Items'][i]['email'],'account')

            group_creator = get_group[0]['group_creator'][0]

            group_admin = get_group[0]['group_admin']
            group_member = get_group[0]['group_member']

            group_name = get_group[0]['group_name']

            subj = group_subject + ' ' + group_name
            msg = group_message(group_name, item_name, item_type, item_info, end_date, creator)

            notification(group_creator, msg, subj)

            itemname = "your group {}. The item name is {}. The item info is {}. The item type is {}".format(group_name,item_name,item_info,item_type)
            remarks = "created by {}".format(creator)

            try:
                webhook_notification(group_creator,itemname,end_date,remarks)
            except:
                pass

            if len(group_admin) > 0:
                for admins in get_group[0]['group_admin']:
                    notification(admins, msg, subj)

                    try:
                        webhook_notification(admins,itemname,end_date,remarks)
                    except:
                        pass

            if  len(group_member) > 0:
                for members in get_group[0]['group_member']:
                    notification(members, msg, subj)
                    try:
                        webhook_notification(members,itemname,end_date,remarks)
                    except:
                        pass

        else:
            email = resp['Items'][i]['email']

            itemname  = resp['Items'][i]['itemname']
            typename  = resp['Items'][i]['typename']
            end_date = resp['Items'][i]['end_date']
            remark = resp['Items'][i]['remarks']

            if len(remark) > 1 or remark != ' ':
                remarks = ', and your remark is ' + remark
            else:
                remarks = ' '

            msg = message(itemname, end_date, remarks)
            subj = subject + ' ' + typename
            notification(email, msg, subj)

            ## Webook
            try:
                webhook_notification(email,itemname,end_date,remarks)
            except:
                pass
            print ("The message has been sent to {}".format(email))

    print ("The nubmer of messages has been sent to {} users".format(len(resp['Items'])))

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": "The nubmer of messages has been sent to {} users".format(len(resp['Items']))
    }

def message(itemname,end_date,remarks):
    return """Hello!

This is notification for your {}, the expire date is {} {}.

Thank you for using our application!

Regards,
Gozeit Team""".format(itemname,end_date,remarks)

def group_message(group_name, item_name, item_type, item_info, end_date, creator):
    return """Hello!

This is notification for your group {}
The item name is {}
The item type is {}
The item info is {}

The expire date is {}

This item created by {}

Thank you for using our application!

Regards,
Gozeit Team""".format(group_name, item_name, item_type, item_info, end_date, creator)

def gen_time():
    timenow = datetime.now()
    return timenow.strftime("%Y-%m-%d")

def get_users(index,key,date):
    return table.query(
        IndexName=index,KeyConditionExpression=Key(
            key).eq(date),)

def get_record(email,item):
    response = table.query(
        KeyConditionExpression=Key("email").eq(email) & Key("item").eq(item))
    return response['Items']

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

def webhook_notification(email,itemname,end_date,remarks):
    response = get_record (email,'account')
    url = response[0]['webhook_url']
    status = response[0]['webhook']
    if status == 'Enabled' and url:
        requests.post(
            url,
            timeout = 1,
            json = {'text': str('This is notification for your {}, the expire date is {} {}').format(itemname,end_date,remarks)},
            headers = {'Content-Type': 'application/json'}
            )