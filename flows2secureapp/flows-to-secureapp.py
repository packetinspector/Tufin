#!/usr/bin/python
'''
usage:

some-machine#./flows-to-secureapp.py <json_flow_file>

Flow file looks like:
{ "flows": [{src_ip: 'x.x.x.x', dst_ip: 'x.x.x.x', service: 'x', proto: 'x'}]    
}
e.g.
{
  "flows": [
    {
      "src_ip": "192.168.100.18",
      "dst_ip": "192.168.100.2",
      "service": "53",
      "proto": "UDP"
    },
    {
      "src_ip": "192.168.100.16",
      "dst_ip": "192.168.100.255",
      "service": "138",
      "proto": "UDP"
    },
    {
      "src_ip": "192.168.100.70",
      "dst_ip": "192.168.100.13",
      "service": "58708",
      "proto": "TCP"
    }
  ]
}
Creates an entire local SecureApp App.  Written in python 2.x
'''

import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
import time
import socket
import sys
import json

#Stuff you set
secureApp_user = '<sa_user>'
secureApp_pass = '<sa_pass>'
secureApp_server = 'https://<sa_ip>'
#Stuff you leave alone
app_create_payload = "<applications><application><name>%s</name><owner><id>%s</id></owner></application></applications>"



# Set AppName
appname = 'East-West-' + str(int(time.time()))


def getSA_JSON(url):
    headers = {
        'accept': "application/json",
        'content-type': "application/json",
        'cache-control': "no-cache"
        }

    return requests.request("GET", url, headers=headers, auth=(secureApp_user, secureApp_pass), verify=False).json()

def postSA_XML(url, payload):
    headers = {
        'accept': "application/xml",
        'content-type': "application/xml",
        'cache-control': "no-cache"
        }

    return requests.request("POST", url, data=payload, headers=headers, auth=(secureApp_user, secureApp_pass), verify=False)

def pushServices(service_set, app_id):
    #set of proto:port combos
    service_template = '<service xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="singleServiceDTO">'\
    '<name>%s</name>'\
        '<type>%s_service</type>'\
        '<max>%s</max>'\
        '<min>%s</min>'\
        '<timeout>default</timeout>'\
    '</service>'
    i = 0
    services = ''
    for s in service_set:
        i = i + 1
        (proto, port) = s.split(':')
        try:
            s_name = socket.getservbyport(int(port), str(proto).lower())
            s_name = s_name + '-' + str(proto)
        except:
            s_name = "Service-" + str(port) + '-' + str(proto)

        services = services + service_template % (s_name, str(proto).lower(), str(port), str(port))

    payload = '<services>' + services + '</services>'

    resp = postSA_XML("%s/securechangeworkflow/api/secureapp/repository/applications/%s/services" % (secureApp_server, app_id), str(payload))
    if resp.status_code != 200:
        print "Error Creating Services( " + str(resp.status_code) + ":" + str(resp.text)
        sys.exit(1)


def pushServers(ip_set,app_id):
    # DNS resolution?
    server_template = '<network_object xsi:type="hostNetworkObjectDTO">'\
          '<comment>Created by East-West-Flows</comment>'\
          '<name>%s</name>'\
          '<ip>%s</ip>'\
      '</network_object>'
    servers = ''
    for ip in ip_set:
        servers = servers + server_template % ('host-' + ip, ip)

    payload = '<network_objects xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' + servers + '</network_objects>'

    resp = postSA_XML("%s/securechangeworkflow/api/secureapp/repository/applications/%s/network_objects" % (secureApp_server, app_id), str(payload))
    if resp.status_code != 200:
        print "Error Creating Servers( " + str(resp.status_code) + ":" + str(resp.text)
        sys.exit(1)


#Start the main program
#Parse Flow file
try:
    sys.argv[1]
except:
    print "You must supply a flow file as an argument"
    sys.exit(1)

with open(sys.argv[1]) as flow_file:
    try:
        flows = json.load(flow_file)
    except:
        print "Unable to parse JSON file. Check the format"
        sys.exit(1)

try:
    flows['flows']
except:
    print "Flow file malformed."
    exit

print "Flow file found.  Parsing..."

ips = set()
services = set() #proto:port

for f in flows['flows']:
    ips.add(f['src_ip'])
    ips.add(f['dst_ip'])
    services.add(str(f['proto']) + ':' + str(f['service']))

print "Found %s unique IPs and %s unique Services" % (len(ips), len(services))

#Grab user id of user
user_list = getSA_JSON(secureApp_server + '/securechangeworkflow/api/securechange/users/')
user_id = 0
for u in user_list['users']['user']:
    if u['name'] == secureApp_user:
        user_id = u['id']
        break

if user_id == 0:
    print "Unable to locate SecureApp User"
    sys.exit(1)

print "Found SecureApp User(" + secureApp_user + ") with id of " + str(user_id)
print "Creating Application"


resp = postSA_XML(secureApp_server + '/securechangeworkflow/api/secureapp/repository/applications/', app_create_payload % (appname, user_id))
if resp.status_code != 201:
    print "Error Creating App:" + str(resp.text)

# SA doesn't return the new app ID...so lets look it up

app_list = getSA_JSON(secureApp_server + '/securechangeworkflow/api/secureapp/repository/applications/')
app_id = 0
for a in app_list['applications']['application']:
    if a['name'] == appname:
        app_id = a['id']
        break

if app_id == 0:
    print "Unable to locate SecureApp App"
    sys.exit(1)

print "Found SecureApp App(" + appname + ") with id of " + str(app_id)
print "Adding Servers to Application..."
pushServers(ips, app_id)
print "Retrieving Server IDs"
server_list = getSA_JSON("%s/securechangeworkflow/api/secureapp/repository/applications/%s/network_objects" % (secureApp_server, app_id))
servers = {}
for s in server_list['network_objects']['network_object']:
    if s["type"] == 'host':
        servers[s["ip"]] = s["id"]
    
print "Adding Services to Application"
pushServices(services,app_id)
services_list = getSA_JSON("%s/securechangeworkflow/api/secureapp/repository/applications/%s/services" % (secureApp_server, app_id))
services = {}
for s in services_list["services"]["service"]:
    key = s['type'].split("_")[0] + ":" + str(s['max'])
    services[key] = s['id']

print "Building Connections"
connection_template = '<connection>'\
          '<name>Connection %s</name>'\
          '<comment>East-West Rule</comment>'\
          '<sources>'\
              '<source>'\
                  '<id>%s</id>'\
              '</source>'\
          '</sources>'\
          '<services>'\
              '<service>'\
                  '<id>%s</id>'\
              '</service>'\
          '</services>'\
          '<destinations>'\
              '<destination>'\
                  '<id>%s</id>'\
              '</destination>'\
          '</destinations>'\
      '</connection>'
i = 0
connections = ''
for f in flows['flows']:
    i = i + 1
    service_key = f['proto'].lower() + ':' + str(f['service'])
    connections = connections + connection_template % (str(i), servers[f['src_ip']], services[service_key], servers[f['dst_ip']])

connection_payload = '<connections>' + connections + '</connections>'
print "Adding Connections to Application"
resp = postSA_XML("%s/securechangeworkflow/api/secureapp/repository/applications/%s/connections" % (secureApp_server, app_id), str(connection_payload))
if resp.status_code != 200:
    print "Error Creating Connections( " + str(resp.status_code) + ":" + str(resp.text)
    sys.exit(1)
print "Finished!"