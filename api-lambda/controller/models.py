import decimal
import boto3
from boto3.dynamodb.conditions import Key
from os import environ as env
import simplejson as json

s3_bucket = env.get("S3_BUCKET")
table_name = env.get("TABLE_NAME")
region_name  = env.get("REGION_NAME")
query_table = boto3.resource("dynamodb", region_name= region_name, verify=False).Table(table_name)

def get_record(email,item):
    response = query_table.query(
        KeyConditionExpression=Key("email").eq(email) & Key("item").eq(item))
    return response['Items']

def get_records(email,account=None):
    z = {}
    x = []
    z['Items'] = []
    response= query_table.query(
        KeyConditionExpression=Key("email").eq(email)
    )

    for i in response[u'Items']:
        if account:
            x.append( json.loads(json.dumps(i, cls=DecimalEncoder)))

        elif i['item'] not in ['account','remove_account']:
            x.append( json.loads(json.dumps(i, cls=DecimalEncoder)))

    z['Items'] = x
    return z

def add_record(item):
    return query_table.put_item(Item=item)

def delete_record(email,item):
    return query_table.delete_item(
        Key={
            'email': email,
            'item' : item
            }
            )

def delete_records(email,account=False):
    items = get_records(email,account)
    for i in range(len(items['Items'])):
        query_table.delete_item(
        Key={
            'email': email,
            'item' : items['Items'][i]['item']
            }
            )
    ## Delete All files from S3
    #s3 = boto3.resource('s3')
    #if email:
    #    bucket = s3.Bucket(s3_bucket)
    #    key= 'customers/' + email + '/'
    #    for obj in bucket.objects.filter(Prefix=key):
    #        s3.Object(bucket.name,obj.key).delete()
    return True

def update_record(email,item,update_item):
    return query_table.update_item(
                Key={'email': email, 'item': item
                },
                UpdateExpression='SET itemname = :itemname, end_date = :end_date, notify_date = :notify_date, typename = :typename, remarks = :remarks, updated = :updated',
                ExpressionAttributeValues={
                ':itemname': update_item['itemname'],
                ':end_date': update_item['end_date'],
                ':notify_date': update_item['notify_date'],
                ':typename': update_item['typename'],
                ':remarks': update_item['remarks'],
                ':updated': update_item['updated']
                }
            )

def update_group_record(email,item,update_item):
    return query_table.update_item(
                Key={'email': email, 'item': item
                },
                UpdateExpression='SET item_info = :item_info, item_name = :item_name, item_type = :item_type, end_date = :end_date, notify_date = :notify_date, updated = :updated',
                ExpressionAttributeValues={
                ':item_info': update_item['item_info'],
                ':item_name': update_item['item_name'],
                ':item_type': update_item['item_type'],
                ':end_date': update_item['end_date'],
                ':notify_date': update_item['notify_date'],
                ':updated': update_item['updated']
                }
            )

def update_group(email,item,update_item):
    return query_table.update_item(
                Key={'email': email, 'item': item
                },
                UpdateExpression='SET group_name = :group_name, updated = :updated',
                ExpressionAttributeValues={
                ':group_name': update_item['group_name'],
                ':updated': update_item['updated']
                }
            )

def webhook_url(email,webhook,webhook_url):
    return query_table.update_item(
                Key={'email': email, 'item': 'account'
                },
                UpdateExpression='SET webhook = :webhook, webhook_url = :webhook_url',
                ExpressionAttributeValues={
                    ':webhook': webhook,
                    ':webhook_url': webhook_url
                }
            )

def user_group_update_member(email,group_member):
    return query_table.update_item(
                Key={'email': email, 'item': 'account'
                },
                UpdateExpression='SET group_member = :group_member',
                ExpressionAttributeValues={
                    ':group_member': group_member
                }
            )

def user_group_update_admin(email, group_admin):
    return query_table.update_item(
                Key={'email': email, 'item': 'account'
                },
                UpdateExpression='SET group_admin = :group_admin',
                ExpressionAttributeValues={
                    ':group_admin': group_admin
                }
            )

def user_group_update_creator(email, group_creator):
    return query_table.update_item(
                Key={'email': email, 'item': 'account'
                },
                UpdateExpression='SET group_creator= :group_creator',
                ExpressionAttributeValues={
                    ':group_creator': group_creator
                }
            )

def user_group_update(email,group_member,group_admin):
    return query_table.update_item(
                Key={'email': email, 'item': 'account'
                },
                UpdateExpression='SET group_member = :group_member, group_admin = :group_admin',
                ExpressionAttributeValues={
                    ':group_member': group_member,
                    ':group_admin': group_admin
                }
            )

def update_subscription(email,item_limit,subscription_end_date,account_type,limit_filesize,notify_date):
    return query_table.update_item(
                Key={'email': email, 'item': 'account'
                },
                UpdateExpression='SET item_limit = :item_limit, subscription_end_date = :subscription_end_date, account_type = :account_type, limit_filesize = :limit_filesize, notify_date= :notify_date',
                ExpressionAttributeValues={
                    ':item_limit': item_limit,
                    ':subscription_end_date': subscription_end_date,
                    ':account_type': account_type,
                    ':limit_filesize': limit_filesize,
                    ':notify_date': notify_date
                }
            )

# Helper class to convert a DynamoDB item to JSON.
class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            if o % 1 > 0:
                return float(o)
            else:
                return int(o)
        return super(DecimalEncoder, self).default(o)