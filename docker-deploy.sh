#!/bin/bash

git pull
docker build -t akiba .
docker run -d -p 3001:3001 --restart=always akiba
