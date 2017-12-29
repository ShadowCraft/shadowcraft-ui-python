#!/bin/sh

cp shcreact.nginx /etc/nginx/sites-available/shcreact.conf
ln -sf /etc/nginx/sites-available/shcreact.conf /etc/nginx/sites-enabled/shcreact.conf
cp shcreact.supd /etc/supervisor/conf.d/shcreact.conf
cp shcreact.sudoers /etc/sudoers.d/shcreact.conf
