from datetime import datetime
import jwt
from flask import request, jsonify
from os import environ as env

clientid = env.get("CLIENTID")

secret=b'''-----BEGIN PUBLIC KEY-----
-----END PUBLIC KEY-----'''

def token_email():
    token = None
    try:
        if 'Authorization' in request.headers:
           token = request.headers['Authorization']
           if token.split()[0] == "Bearer":
               user=jwt.decode(token.split()[1], secret ,audience=clientid,verify=True)
               # To split as the token has one space
           user=jwt.decode(token.split()[0], secret ,audience=clientid,verify=True)
        return user['email']
    except:
        return jsonify('Misunderstood Request'),401

def gen_time():
    timenow = datetime.now()
    return timenow.strftime("%d-%m-%Y_%H-%M-%S-%f")

def check_email(email):
    if email == token_email():
        return True
    return False