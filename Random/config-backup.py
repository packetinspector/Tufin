#!/usr/bin/python3.4
import os
from pytos.securetrack.helpers import Secure_Track_Helper

#Files go here
confbackdir = '/tmp/tufin/'
t_ip = '<IP>'
t_user = '<USER>'
t_pass = '<PASS>'

# No edit past here...
st_helper = Secure_Track_Helper(t_ip, (t_user, t_pass))
print("Fetching Devices...")
try:
    devices = st_helper.get_devices_list()
except:
    print("Error reading devices")
    exit()

if (not os.path.exists(confbackdir)):
    os.makedirs(confbackdir)

# print(devices)
for d in devices:
    filename = d.name + '-' + str(d.id)
    print("Getting config for {}".format(filename))
    try:
        c = st_helper.get_device_config_by_id(d.id)
    except:
        print("Config failed for {}".format(filename))
        continue

    print("Success! Saving Config")
    c = bytes.decode(c)
    c.replace('\n',"\n")
    with open(confbackdir + filename + '.txt', 'w') as f:
        print(c,file=f)
