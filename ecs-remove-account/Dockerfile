FROM python:3.8
LABEL maintainer="Mohamed Radwan"

# Place app in container.
COPY . /opt/www
WORKDIR /opt/www

# Install dependencies.
RUN pip install -r requirements.txt

CMD python remove_account.py
