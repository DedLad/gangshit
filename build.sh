#!/bin/bash
rm -rf *
git clone https://github.com/anirudhsudhir/gangshit.git
cp -r gangshit/site .
curl -L https://github.com/anna-ssg/anna/releases/download/v3.0.0/anna_Linux_x86_64.tar.gz >anna_Linux_x86.tar.gz
tar -xvzf anna_Linux_x86.tar.gz
./anna