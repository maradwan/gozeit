from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, date, timedelta
import boto3
import simplejson as json
from os import environ as env
import stripe
from controller.auth import gen_time, token_email
from controller.models import delete_all_files, get_record, get_records, add_record, delete_record, delete_records, update_record, webhook_url, update_subscription, user_group_update, update_group_record, update_group ,user_group_update_creator ,user_group_update_member, user_group_update_admin
from uuid import uuid4

global_group_limit = env.get("GROUP_LIMIT")
global_group_limit_items = env.get("GROUP_LIMIT_ITEMS")

source_email = env.get("SOURCE_EMAIL")
group_subject_permission = env.get("GROUP_SUBJECT_PERMISSION")
group_subject_invitation = env.get("GROUP_SUBJECT_INVITATION")
item_limit = env.get("LIMIT")
UserPoolId = env.get("USERPOOLID")
s3_bucket = env.get("S3_BUCKET")
subj_remove_account = env.get("SUBJ_REMOVE_ACCOUNT")

stripe_keys = {
  'secret_key': env.get("STRIPE_SECRET_KEY"),
  'publishable_key': env.get("STRIPE_PUBLISHABLE_KEY")
}

stripe.api_key = stripe_keys["secret_key"]
region_name  = env.get("REGION_NAME")

app = Flask(__name__)
CORS(app)

def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps('Hello from GoZeit!')
    }

@app.route('/charge/standard', methods=['POST'])
def charge():
    email = token_email()

    # amount in cents
    amount = 200
    item_limit = 100
    account_type = 'Standard'
    limit_filesize = 10485790
    customer = stripe.Customer.create(
        email=email,
        source=request.form['stripeToken']
    )
    stripe.Charge.create(
        customer=customer.id,
        amount=amount,
        currency='eur',
        description='Yearly Standard'
    )

    user_settings = get_record(email,'account')

    if 'subscription_end_date' in user_settings[0]:
        subscription = user_settings[0]['subscription_end_date']
        iso_subscription = date.fromisoformat(subscription) + timedelta(days=365)
        notify = iso_subscription - timedelta(days=7)
        notify_date = notify.strftime("%Y-%m-%d")
        subscription_end_date = iso_subscription.strftime("%Y-%m-%d")
        update_subscription(email,item_limit,subscription_end_date,account_type,limit_filesize,notify_date)
    else:
        req_date = date_subscription()
        notify_date = req_date[0]
        subscription_end_date = req_date[1]
        update_subscription(email,item_limit,subscription_end_date,account_type,limit_filesize,notify_date)

    return jsonify('successfully charged')

@app.route('/item/download/<item>', methods=['POST'])
def download_file(item):
    email = token_email()
    s3 = boto3.client('s3')

    try:
        check_file = get_record(email,item)
        filename = check_file[0]['filename']
        item = check_file[0]['item']
        key = 'customers/' + email + '/' + item + '_' + filename

        response = {}
        response['filename'] = filename
        response['filesize'] = check_file[0]['filesize']
        response['item'] = item

        signedurl = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': s3_bucket, 'Key': key},
            ExpiresIn=129600)

        response['signedurl'] = signedurl
        return jsonify(response)

    except:
        return jsonify('Misunderstood Request'),400

@app.route('/item/upload/<item>', methods=['POST'])
def upload_file(item):
    ssm = boto3.client('ssm', region_name=region_name, verify=False)
    access_key = ssm.get_parameter(Name='/gozeit/s3/aws_access_key')
    aws_access_key = access_key['Parameter']['Value']
    secret_key = ssm.get_parameter(Name='/gozeit/s3/aws_secret_access_key', WithDecryption=True)
    aws_secret_key= secret_key['Parameter']['Value']
    email = token_email()
    item_key = gen_time()
    s3 = boto3.client('s3',
    aws_access_key_id=aws_access_key,
    aws_secret_access_key=aws_secret_key)

    user_settings = get_record(email,'account')
    if 'deny_upload' in user_settings[0] and user_settings[0]['deny_upload'] == 'true':
        return jsonify('Gozeit has suspended your storage service.'),405

    if 'limit_filesize' in user_settings[0]:
        limit_filesize = user_settings[0]['limit_filesize']
    else:
        limit_filesize = 1048579


    response = s3.generate_presigned_post(
        Bucket= s3_bucket,
        Key='customers/' + email + '/' + item_key + '_' + item,
        Conditions=[
            ['content-length-range', 1, int(limit_filesize)]
        ]
    )

    response['item'] = item_key

    return jsonify(response)

def group_limit_items(group):
    group_settings = get_record(group,'account')
    get_data = get_records(group)
    group_items = len(get_data['Items'])
    group_limit_items.group_items = len(get_data['Items'])

    if 'items_limit' in group_settings[0]:

        items_limit = group_settings[0]['items_limit']
        if items_limit > group_items:
            return False
        return True

    if int(global_group_limit_items) > int(group_items):
        return False
    return True

def creating_group_limit():
    email = token_email()
    user_settings = get_record(email,'account')
    # Check group_creator is exsit
    if 'group_creator' not in user_settings[0]:
        user_settings[0]['group_creator'] = []

    creating_group_limit.group_limit = len(user_settings[0]['group_creator'])

    if 'group_limit' in user_settings[0]:
        group_limit = user_settings[0]['group_limit']
        if group_limit > len(user_settings[0]['group_creator']):
            return False
        return True

    if int(global_group_limit) > len(user_settings[0]['group_creator']):
        return False
    return True

def user_limit():
    """
    Get User Limit from DB, if not use global limit
    """
    try:
        email = token_email()
        get_limit= get_record(email,'account')
        get_item()
        if get_limit[0]['item_limit'] > get_item.item_limit:
            return False
        return True
    except:
        get_item()
        if item_limit > get_item.item_limit:
            return False
        return True

@app.route('/')
def index():
    return "Welcome To GoZeit."

# Change members of the group
@app.route('/group/account/<group>', methods=['POST'])
def change_members_group(group):
      try:
          email = token_email()
          group_settings = get_record(group,'account')
          # Check if the user has access to the group
          if email in group_settings[0]['group_creator'] or email in group_settings[0]['group_admin']:
              data = request.json
              if not data['member'] or not data['request']:
                  return jsonify("You must fill in all of the required fields *"),400

              if data['member'] and data['request'] and len(data) == 2:
                  member_settings = get_record(data['member'],'account')
                  if not (member_settings):
                      msg = msg_group_invitation(group_settings[0]['group_name'],email)
                      notification(data['member'], msg, group_subject_invitation)
                      return jsonify("This email is not yet joined Gozeit. Invitation email has been sent"),404

                  # if user has no group_member or group_admin keys then will be created
                  if 'group_admin' not in member_settings[0]:
                      member_settings[0]['group_admin'] = []

                  if 'group_member' not in member_settings[0]:
                      member_settings[0]['group_member'] = []

                  if data['request'] == 'add_admin':
                    # Added to Group
                      if data['member'] not in group_settings[0]['group_admin']:
                          group_admin = group_settings[0]['group_admin']
                          group_admin.append(data['member'])
                          group_settings[0]['group_admin'] = group_admin

                          msg = msg_group_permission(group_settings[0]['group_name'],'admin')
                          notification(data['member'], msg, group_subject_permission)

                          # If user was member and be admin then he will be removed from member
                      if data['member'] in group_settings[0]['group_member']:
                          group_member = group_settings[0]['group_member']
                          group_member.remove(data['member'])
                          group_settings[0]['group_member'] = group_member

                          # Add admin group to user account
                    # Added to user
                      if group not in member_settings[0]['group_admin']:
                          user_group_admin = member_settings[0]['group_admin']
                          user_group_admin.append(group)
                          member_settings[0]['group_admin'] = user_group_admin
                          # If user was member and the be admin then he will be removed from member
                      if group in member_settings[0]['group_member']:
                          user_group_member = member_settings[0]['group_member']
                          user_group_member.remove(group)
                          member_settings[0]['group_member'] = user_group_member

                  elif data['request'] ==  'add_member':
                      if data['member'] not in group_settings[0]['group_member']:
                          group_member = group_settings[0]['group_member']
                          group_member.append(data['member'])
                          group_settings[0]['group_member'] = group_member

                          msg = msg_group_permission(group_settings[0]['group_name'],'member')
                          notification(data['member'], msg, group_subject_permission)

                          # Add group to user account
                      if group not in member_settings[0]['group_member']:
                          user_group_member = member_settings[0]['group_member']
                          user_group_member.append(group)
                          member_settings[0]['group_member'] = user_group_member

                  elif data['request'] ==  'remove_member':
                      if data['member'] in group_settings[0]['group_member']:
                          group_member = group_settings[0]['group_member']
                          group_member.remove(data['member'])
                          group_settings[0]['group_member'] = group_member

                          msg = msg_group_permission(group_settings[0]['group_name'],'not member')
                          notification(data['member'], msg, group_subject_permission)

                          # Remove group from user account
                      if group in member_settings[0]['group_member']:
                          user_group_member = member_settings[0]['group_member']
                          user_group_member.remove(group)
                          member_settings[0]['group_member'] = user_group_member


                  elif data['request'] ==  'remove_admin':
                      if data['member'] in group_settings[0]['group_admin']:
                          group_admin = group_settings[0]['group_admin']
                          group_admin.remove(data['member'])
                          group_settings[0]['group_admin'] = group_admin

                          msg = msg_group_permission(group_settings[0]['group_name'],'not admin')
                          notification(data['member'], msg, group_subject_permission)


                          # remove admin group from user account
                      if group in member_settings[0]['group_admin']:
                          user_group_admin = member_settings[0]['group_admin']
                          user_group_admin.remove(group)
                          member_settings[0]['group_admin'] = user_group_admin


                  else:
                      return jsonify('Misunderstood Request'),400


                  user_group_update(group,group_settings[0]['group_member'],group_settings[0]['group_admin'])
                  user_group_update(data['member'],member_settings[0]['group_member'],member_settings[0]['group_admin'])
                  return jsonify('request has been successfully'),201

          else:
              return jsonify("Only the group owner and admins can perform this change"),403
      except:
          return jsonify('Misunderstood Request'),400

# Get Members of the group
@app.route('/group/account/<group>', methods=['GET'])
def get_members_group(group):
      try:
          email = token_email()
          group_settings = get_record(group,'account')
          # Check if the user has access to the group
          if email in group_settings[0]['group_creator'] or email in group_settings[0]['group_admin']:
              return jsonify(group_settings),200
          else:
              return jsonify("You don't have permission to access this group"),403
      except:
          return jsonify('Misunderstood Request'),400

# Get items from group
@app.route('/group/<group>', methods=['GET'])
def get_group(group):
      try:
          email = token_email()
          response = get_record(group,'account')
          # Check if the user has access to the group
          if email in response[0]['group_creator'] or email in response[0]['group_admin'] or email in response[0]['group_member']:

              get_data = get_records(group)
              if 'updated' in response[0]:
                  data = { 'created': response[0]['created'] ,'updated': response[0]['updated'],'group_admin': response[0]['group_admin'] ,'group_creator': response[0]['group_creator'],'group_member': response[0]['group_member'] ,'group_name': response[0]['group_name'], 'Items': get_data }
              else:
                  data = { 'created': response[0]['created'] , 'group_admin': response[0]['group_admin'] ,'group_creator': response[0]['group_creator'] ,'group_member': response[0]['group_member'] ,'group_name': response[0]['group_name'], 'Items': get_data }

              if data is None:
                  return jsonify('Not Found'),404
              return jsonify(data)

          return jsonify("You don't have permission to access this group"),403
      except:
          return jsonify('Misunderstood Request'),400

# Delete item in Group
@app.route('/group/<group>/<item>', methods=['DELETE'])
def delete_item_group(group, item):
      try:
          email = token_email()
          response = get_record(group,'account')

          # Check if the user has access to the group
          if email in response[0]['group_member'] or email in response[0]['group_admin'] or email in response[0]['group_creator']:
              get_item = get_record(group,item)
              if get_item[0]['creator'] == email or email in response[0]['group_admin'] or email in response[0]['group_creator']:
                  delete_record(group,item)
                  return jsonify("Deleted: {}".format(item)),200

              return jsonify("You don't have permission to delete this record"),403
          else:
              return jsonify("You don't have permission to access this group"),403
      except:
          return jsonify('Misunderstood Request'),400

# update item in Group
@app.route('/group/<group>/<item>', methods=['PUT'])
def update_item_group(group, item):
      try:
          email = token_email()
          data = request.json
          data['updated'] = gen_time()
          if data['item_info'] and len(data['item_info']) <= 64 and data['item_name'] and len(data['item_name']) <= 64 and data['item_type'] and len(data['item_type']) <= 64 and data['end_date'] and len(data['end_date']) <= 10 and data['notify_date'] and len(data['notify_date']) <= 10 and data['updated'] and len(data['updated']) <= 26 and len(data) <= 6:
              response = get_record(group,'account')
              # Check if the user has access to the group
              if email in response[0]['group_member'] or email in response[0]['group_admin'] or email in response[0]['group_creator']:
                  get_item = get_record(group,item)
                  if get_item[0]['creator'] == email or email in response[0]['group_admin'] or email in response[0]['group_creator']:
                      data['email'] = group
                      data['item'] = item
                      update_group_record(group,item,data)
                      return jsonify("Updated: {}".format(item)),200

              return jsonify("You don't have permission to update this record"),403
          else:
              return jsonify("You must fill in all of the required fields *"),400
      except:
          return jsonify('Misunderstood Request'),400

# Create item in Group
@app.route('/group/<group>', methods=['POST'])
def create_item_group(group):
      try:
          email = token_email()
          response = get_record(group,'account')
          # Check if the user has access to the group

          if email in response[0]['group_member'] or email in response[0]['group_admin'] or email in response[0]['group_creator']:
              data = request.json
              if data['item_info'] and len(data['item_info']) <= 64 and data['item_name'] and len(data['item_name']) <= 64 and data['item_type'] and len(data['item_type']) <= 64 and data['end_date'] and len(data['end_date']) <= 10 and data['notify_date'] and len(data['notify_date']) <= 10 and len(data) <= 5:

                  ## Group Limit
                  if (group_limit_items(group)):
                      return jsonify('{} Records Limit Reached'.format(group_limit_items.group_items)),426

                  data['email'] = group

                  if 'filename' in data:
                      data['item'] = data['filename'][:26]
                      data['filename'] = data['filename'][27:]
                  else:
                      data['item'] = gen_time()
                      data['creator'] = email
                  add_record(data)
                  return jsonify(data),201

              return jsonify('You must fill in all of the required fields *'),400
          else:
              return jsonify("You don't have permission to access this group"),403
      except:
          return jsonify('Misunderstood Request'),400

# Delete Group
@app.route('/group/<group>', methods=['DELETE'])
def delete_group(group):
      try:
          email = token_email()

          group_creator = get_record(group,'account')
          # Check if the user has access to the group
          if email not in group_creator[0]['group_creator']:
              return jsonify("Only the group owner can perform this action"),403

          if 'group_admin' in group_creator[0] and len(group_creator[0]['group_admin']) != 0:

             # Remove group from user group_admin
              for i in range(len(group_creator[0]['group_admin'])):
                  member_settings = get_record(group_creator[0]['group_admin'][i],'account')
                  user_group_admin = member_settings[0]['group_admin']

                  if group in user_group_admin:
                      user_group_admin.remove(group)
                      user_group_update_admin(group_creator[0]['group_admin'][i],member_settings[0]['group_admin'])


          if 'group_member' in group_creator[0] and len(group_creator[0]['group_member']) != 0:

            for j in range(len(group_creator[0]['group_member'])):
                member_settings = get_record(group_creator[0]['group_member'][j],'account')
                user_group_member = member_settings[0]['group_member']
                if group in user_group_member:
                    user_group_member.remove(group)
                    user_group_update_member(group_creator[0]['group_member'][j], member_settings[0]['group_member'])


          member_settings = get_record(email,'account')
          user_group_creator = member_settings[0]['group_creator']
          user_group_creator.remove(group)
          member_settings[0]['group_creator'] = user_group_creator
          user_group_update_creator(email, member_settings[0]['group_creator'])

          delete_records(group,account=True)
          return jsonify("Deleted: {}".format(group)),200

      except:
          return jsonify('Misunderstood Request'),400

# Get Groups for the user
@app.route('/groups', methods=['GET'])
def get_groups():
      try:
          data = {}
          email = token_email()
          response = get_record(email,'account')
          data['Items'] = []

          if 'group_admin' in response[0]:
              group_admin = response[0]['group_admin']
          else:
              group_admin = []
          if 'group_member' in response[0]:
              group_member = response[0]['group_member']
          else:
              group_member = []

          if 'group_creator' in response[0]:
              group_creator = response[0]['group_creator']
          else:
              group_creator = []


          data['Items'] = {'group_member':group_member, 'group_admin': group_admin, 'group_creator': group_creator }
          return jsonify(data)
      except:
          return jsonify('Misunderstood Request'),400

# Create new Group
@app.route('/group', methods=['POST'])
def create_group():

    if (creating_group_limit()):
        return jsonify('{} Records Limit Reached'.format(creating_group_limit.group_limit)),426

    email = token_email()
    try:
        data = request.json
        if data['group_name'] and len(data) == 1:
            data['email'] = str(uuid4())[:13] + '_g@gozeit.com'
            user_settings = get_record(email,'account')

            if 'group_creator' not in user_settings[0]:
                user_settings[0]['group_creator'] = []
            group_creator = user_settings[0]['group_creator']

            group_creator.append(data['email'])
            user_settings[0]['group_creator'] = group_creator
            group_email = data['email']
            group_name = data['group_name']

            created = gen_time()
            item= {'created': created,'email':group_email, 'item': 'account', 'group_creator': [email], 'group_name': group_name, 'group_admin': [], 'group_member': [] }
            add_record(item)

            # create group_member if not exsit
            if 'group_member' not in user_settings[0]:
                user_settings[0]['group_member'] = []

            user_group_update_creator(email, user_settings[0]['group_creator'])
            return jsonify(data),201
        return jsonify('You must fill in all of the required fields *'),400
    except:
        return jsonify('Misunderstood Request'),400

# update Group name
@app.route('/group/<group>', methods=['PUT'])
def group_update(group):
      try:
          email = token_email()
          data = request.json
          data['updated'] = gen_time()
          if data['group_name'] and data['updated'] and len(data) == 2:
              response = get_record(group,'account')
              # Check if the user has access to the group
              if email in response[0]['group_admin'] or email in response[0]['group_creator']:
                  data['email'] = group
                  update_group(group,'account',data)
                  return jsonify("Updated: {}".format(group)),200

              return jsonify("Only group admins or creator can perform this update"),403
          else:
              return jsonify("You must fill in all of the required fields *"),400
      except:
          return jsonify('Misunderstood Request'),400

@app.route('/item', methods=['GET'])
def get_item():
      email = token_email()
      try:
          data = get_records(email)

          if data is None:
              return jsonify('Not Found'),404

          get_item.item_limit =len(data['Items'])
          return jsonify(data)
      except:
          return jsonify('Misunderstood Request'),400

@app.route('/account', methods=['GET'])
def user_account():
      try:
          email = token_email()
          data = get_record(email,'account')

          if data is None:
              return jsonify('Not Found'),404

          return jsonify(data)
      except:
          return jsonify('Misunderstood Request'),400

@app.route('/account', methods=['DELETE'])
def delete_account():
    email = token_email()
    try:
        cognito = boto3.client('cognito-idp',region_name = region_name, verify=False)
        cognito.admin_delete_user(
            UserPoolId= UserPoolId,
            Username= email
            )
        delete_records(email, account=True)
        delete_all_files(email)
        msg = message_body_deleted_account(email)
        notification(email, msg, subj_remove_account)
        return jsonify('Removing account has been requested'),200
    except:
        return jsonify('Misunderstood Request'),400

@app.route('/account/webhook', methods=['PUT'])
def webhook():
    email = token_email()
    try:
        data = request.json
        if data['webhook'] and len(data) <= 2:
            data['email'] = email
            if data['webhook'] == 'Enabled' or data['webhook'] == 'Disabled':
                webhook_url(email,data['webhook'],data['webhook_url'])
                return jsonify("status: {}".format(data['webhook']))

        return jsonify('You must fill in all of the required fields *'),400
    except:
        return jsonify('Misunderstood Request'),400

@app.route('/item', methods=['POST'])
def add_data():
    if (user_limit()):
        return jsonify('{} Records Limit Reached'.format(get_item.item_limit)),426

    email = token_email()
    try:
        data = request.json
        if data['itemname'] and data['end_date'] and data['notify_date'] and data['typename'] and data['remarks'] and len(data) <= 6:
            data['email'] = email
            if 'filename' in data:
                data['item'] = data['filename'][:26]
                data['filename'] = data['filename'][27:]
            else:
                data['item'] = gen_time()
            add_record(data)
            return jsonify(data),201
        return jsonify('You must fill in all of the required fields *'),400
    except:
        return jsonify('Misunderstood Request'),400

# Delete item
@app.route('/item/<item>', methods=['DELETE'])
def delete_item(item):
  email = token_email()
  try:
      response = get_record(email,item)
      if 'filename' in response[0]:
          s3 = boto3.resource('s3',region_name= region_name, verify=False)
          item = response[0]['item']
          filename = response[0]['filename']
          s3_key_file= 'customers/' + email + '/' +  item + '_' + filename
          file_remove = s3.Object(s3_bucket, s3_key_file)
          file_remove.delete()
      delete_record(email,item)
      return jsonify("Deleted: {}".format(item)),200
  except:
      return jsonify('Misunderstood Request'),400

# Delete All items
@app.route('/items', methods=['DELETE'])
def delete_items():
  email = token_email()
  try:
      delete_records(email)
      return jsonify("Deleted: {}".format(email)),204
  except:
      return jsonify('Misunderstood Request'),400

# Update items
@app.route('/item/<item>', methods=['PUT'])
def update_item(item):
    email = token_email()
    try:
        data = request.json
        data['updated'] = gen_time()
        if data['itemname'] and data['end_date'] and data['notify_date'] and data['typename'] and data['remarks'] and data['updated'] and len(data) == 6:
            data['email'] = email
            data['item'] = item
            update_record(email,item,data)
            return jsonify("updated: {}".format(item)),204
        return jsonify('You must fill in all of the required fields *'),400
    except:
        return jsonify('Misunderstood Request'),400

def date_subscription():
    subscription = datetime.today() + timedelta(days=365)
    subscription_end_date = subscription.strftime("%Y-%m-%d")
    notify =  subscription - timedelta(days=7)
    notify_date = notify.strftime("%Y-%m-%d")
    return notify_date,subscription_end_date

def message_body_deleted_account(email):
    return """Hello!

We deleted your account {} as requested.

Thank you.

Best Regards,
Gozeit Team""".format(email)

def msg_group_permission(group_name,permission):
    return """Hello!

This is notification for {} group, now you are {} of the group.

Thank you for using our application!

Regards,
Gozeit Team""".format(group_name,permission)

def msg_group_invitation(group_name,requester):
    return """Hello!

This is notification for {} group. You need to have account to access this group.
Please register to http://app.gozeit.com

This invitation from {}.

Thank you!

Regards,
Gozeit Team""".format(group_name,requester)

def notification(to_addresses, msg, subj,source_email=source_email):
    email_client = boto3.client('ses',region_name= region_name, verify=False)
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

if __name__ == '__main__':
    app.run(debug=True)