FROM python:3.6-slim
COPY app /app
RUN pip install --trusted-host pypi.python.org --trusted-host pypi.org --trusted-host files.pythonhosted.org Flask
RUN pip install --trusted-host pypi.python.org --trusted-host pypi.org --trusted-host files.pythonhosted.org requests

RUN apt-get update
RUN apt-get install nano
RUN apt-get -y install sshpass

ENV ROOT_PWD=wago
ENV BRIDGE_IP_HOST=172.17.0.1
ENV OPENCELLID_KEY=NoKeyEntered

WORKDIR /app

ENTRYPOINT ["python", "app.py"]