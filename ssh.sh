#!/bin/bash

# Helper script to ssh into your server

SERVER_IP=$(grep SERVER_IP .env | cut -d '=' -f2)
SERVER_USER=$(grep SERVER_USER .env | cut -d '=' -f2)

ssh $SERVER_USER@$SERVER_IP
