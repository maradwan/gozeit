from os import environ as env
import boto3

region_name  = env.get("REGION_NAME")
ecs_cluster_name = env.get("ECS_CLUSTER_NAME")
ecs_task_definition = env.get("ECS_TASK_DEFINITION")
ecs_task_count = int(env.get("ECS_TASK_COUNT"))
ecs_subnets = ['','','']
ecs_securitygroups = ['']

def run_ecs(event, cluster_name=ecs_cluster_name, task=ecs_task_definition, count=ecs_task_count, subnets=ecs_subnets, securitygroups=ecs_securitygroups):
    ecs = boto3.client('ecs', region_name = region_name, verify=False)
    response = ecs.run_task(
    cluster=cluster_name,
    launchType = 'FARGATE',
    taskDefinition=task,

    overrides={
        'containerOverrides': [
            {
                'name': task.split(':')[0],
                'environment': [
                    {
                        'name': 'email',
                        'value': event['email']
                    },
                    {
                        'name': 'request',
                        'value': event['request']
                    },
                    {
                        'name': 'item',
                        'value': event['item']
                    },
                    {
                        'name': 's3_key_file',
                        'value': event['s3_key_file']
                    }
                ]
            },
        ],
    },
    count = count,
    platformVersion='LATEST',
    networkConfiguration={
        'awsvpcConfiguration': {
            'subnets': subnets
            ,
            'securityGroups':
                securitygroups
            ,
            'assignPublicIp': 'ENABLED'
        }
    })
    return response