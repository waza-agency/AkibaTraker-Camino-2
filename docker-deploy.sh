#!/bin/bash

git pull
docker build -t akiba .
docker stop $(docker ps | awk '$2=="akiba" {print $NF}')
docker run -d -p 3001:3001 --restart=always --mount type=volume,src=akiba,dst=/usr/src/app/public akiba
