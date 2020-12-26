# Fluffy app Using Flask MySql Nginx Gunicorn

## Requirements

* [Docker]
* [Docker-compose]


### Run

    $ docker-compose up -d


### Open Browser
       http://localhost/

## Admin User
Email: admin@admin.com
Password: Oothai1y@Z3e5fzGa@2hV1aes

## Test User
Email: demo@demo.com
Password: Demo1234


## To Get Metrics for Prometheus
        http://localhost/metrics

## Using AWS Lambda and AWS Pipeline for CI/CD
Create lambda Layer for kubernetes python client
- How to create a layer in lambda/layer.txt
- Deploy script lambda/k8-deploy.py

## For AWS EKS
kubectl create serviceaccount --namespace kube-system tiller
kubectl create clusterrolebinding tiller-cluster-rule --clusterrole=cluster-admin --serviceaccount=kube-system:tiller
