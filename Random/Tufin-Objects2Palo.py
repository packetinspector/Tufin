#!/usr/local/bin/python

import requests
import re
from requests.packages.urllib3.exceptions import InsecureRequestWarning,InsecurePlatformWarning,SNIMissingWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
# requests.packages.urllib3.disable_warnings(InsecurePlatformWarning)
# requests.packages.urllib3.disable_warnings(SNIMissingWarning)
import argparse
from pandevice import base
from pandevice import firewall
from pandevice import panorama
from pandevice import policies
from pandevice import objects
from pandevice import network
from pandevice import device

#Lib gives many connections options. Pano, ThroughPano and Direct
fw_serial = '111111111111'
pano_user = 'admin'
pano_pass = 'admin'
pano_addr = '192.168.200.29'
#Tufin ST
tufin_user = 'admin'
tufin_pass = 'admin'
tufin_addr = '192.168.200.98'
#Tag used to mark added objects
tufin_tag = 'TufinImport'


#Going to go through Pano here...
def pano_connect():
    # Instantiate a Firewall with serial
    fw = firewall.Firewall(serial=fw_serial)
    # Instantiate a Panorama with hostname and credentials
    pano = panorama.Panorama(pano_addr, pano_user, pano_pass)
    # Add the Firewall as a child of Panorama
    pano.add(fw)
    return fw, pano


def fw_connect():
    return firewall.Firewall(pano_addr, pano_user, pano_pass)


def fetch_objects(device_id):
    return getSA_JSON('https://{}/securetrack/api/devices/{}/network_objects'.format(tufin_addr,device_id))


def process_objects(device_json):
    # hostNetworkObjectDTO  - ip
    # subnetNetworkObjectDTO - ip and subnet
    # networkObjectGroupDTO - group
    # print device_json
    groups = []
    for n in device_json['network_objects']['network_object']:
        if (n['@xsi.type'] == 'hostNetworkObjectDTO'):
            print "Found Address Object. Name: {} IP: {}".format(n['display_name'], n['ip'])
            create_object(n['display_name'], n['ip'], n['comment'])
        elif (n['@xsi.type'] == 'subnetNetworkObjectDTO'):
            print "Found Subnet Object. Name: {} IP: {} / {}".format(n['display_name'], n['ip'], n['netmask'])
            create_object(n['display_name'], n['ip'] + '/' + sub_to_pre(n['netmask']), n['comment'])
        elif (n['@xsi.type'] == 'networkObjectGroupDTO'):
            print "Found Group Object. Defering"
            groups.append(n)
        else:
            print "Ignoring Type: {}".format(n['@xsi.type'])
    #Groups
    for g in groups:
        try:
            members = []
            try:
                members.append(g['member']['display_name'])
            except: 
                for m in g['member']:
                    members.append(m['display_name'])
            print "Creating group: {}".format(g['display_name'])
            create_group(g['display_name'], members, g['comment'])
        except:
            print "Group is empty"


def create_object(obj_name, obj_value, obj_desc):
    # sanitize name
    obj_name = re.sub(r'[^\w\.]', '_', obj_name)
    fw.add(objects.AddressObject(obj_name, obj_value, None, obj_desc, tufin_tag)).create()


def create_group(group_name, member_list, desc):
    # Convert member names to pa objoects
    pa_members = []
    for m in member_list:
        m = re.sub(r'[^\w\.]', '_', m)
        res = fw.find(m, objects.AddressObject)
        if (res is None):
            print "Member Not Found Ignoring " + m
        else:
            pa_members.append(res)
    if not pa_members:
        print "Group Empty " + group_name
        return False
    # Add to device
    fw.add(objects.AddressGroup(group_name, pa_members, None, desc, tufin_tag)).create()


def remove_all():
    objects.AddressObject.refreshall(fw, add=True)
    for e in fw.children:
        if tufin_tag in e.tag:
            print "Deleting " + e.name
            e.delete()


def sub_to_pre(netmask):
    # eugene y
    return str(sum([bin(int(x)).count("1") for x in netmask.split(".")]))


def parse_args():
    # Get command line arguments
    parser = argparse.ArgumentParser(description="Copy Network Objects from a Tufin Device to a PA-FW")
    parser.add_argument('-d', '--device', help="Device ID")
    parser.add_argument('-R', '--remove', action='store_true', help="Remove things with Tufin Tag.  Easier to revert though.")
    args = parser.parse_args()

    if args.device is None and not args.remove:
        print "Device ID required"
        exit(-1)

    return args


def getSA_JSON(url):
    headers = {
        'accept': "application/json",
        'content-type': "application/json",
        'cache-control': "no-cache"
        }

    return requests.request("GET", url, headers=headers, auth=(tufin_user, tufin_pass), verify=False).json()


#Main
if __name__ == '__main__':
    #Grab the arguments
    options = parse_args()
    #Go through Pano
    print "Connecting to Firewall through Panorama"
    (fw, pano) = pano_connect()
    # fw = fw_connect()
    if options.remove:
        print "Are you sure you want to remove?"
        resp = raw_input("Type YES in all caps: ")
        if resp == 'YES':
            remove_all()
        else:
            print "No Go."
    else:
        print "Adding Tufin Tag"
        fw.add(objects.Tag(tufin_tag, 'orange', 'Converted Object')).create()
        print "Converting Objects"
        process_objects(fetch_objects(options.device))
