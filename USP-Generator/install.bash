#!/bin/bash

if [ ! -d "/tmp/usp-generator/" ]; then
    mkdir /tmp/usp-generator/
fi

if [ -d "/tmp/usp-generator/" ]; then
    echo "Downloading Files"
    cd /tmp/usp-generator
    curl -L "https://raw.githubusercontent.com/packetinspector/Tufin/master/USP-Generator/index.html" > usp.htm
    curl -L "https://raw.githubusercontent.com/packetinspector/Tufin/master/USP-Generator/usp.js" > usp.js
    cp -f usp.htm /var/www/html/tools/
    cp -f usp.js /var/www/html/tools/
    chown apache.st /var/www/html/tools/usp.htm
    chown apache.st /var/www/html/tools/usp.js
    INSERTED=`psql -qt -U postgres securetrack -c "SELECT 1 from user_tools where link = 'usp.htm';" | grep -c 1`
    if [ $INSERTED -ne 1 ]; then
        echo "Inserting Tools Link"
        psql -qAt1 -U postgres securetrack -c "INSERT INTO user_tools (link, description, user_allowed, user_enabled) VALUES ('usp.htm', 'USP Editor', TRUE, FALSE);"
        if [ $? -ne 0 ]; then
            echo "Error adding to Tools"
            exit
        fi
    fi
    IP=`ip -o -f inet addr show | grep -v " lo " | grep -oP "(?<=inet )([0-9\.]+)(?=\/)"`
    echo "Installation Complete. Visit https://$IP/tools/"

else
    echo "Error Creating Temp Directory. Stopping."
fi

