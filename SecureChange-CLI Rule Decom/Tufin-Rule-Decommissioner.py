#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Input: User Selected
Output: Ticket in SecureChange
Written in tutorial style python3 aka lots of comments and structured as-you-go
"""
from pick import pick
import json
import getpass
import requests
import sys
from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

# User Input Defaults (Defaults, Will ask the user)
# Workflow created on SC
workflow_name = "Rule Decommission/Disable Flow"
# Your Ticket Name
ticket_name = "Test 101"
# ST Info Defaults
st_ip = '192.168.200.99'
st_user = 'r'
st_pass = 'tufin'

# Ask user for things
st_ip = input("Enter SecureTrack IP [{}] : ".format(st_ip)) or st_ip
st_user = input("Enter SecureTrack User [{}] : ".format(st_user)) or st_user
st_pass = getpass.getpass("Enter SecureTrack Pass: ") or st_pass


# Simple Function to query ST
def getSA_JSON(url):
    # Get something from TOS
    headers = {
        'accept': "application/json",
        'content-type': "application/json",
        'cache-control': "no-cache"
    }

    return requests.request("GET", url, headers=headers, auth=(st_user, st_pass), verify=False).json()


# Function to format display for device picker
def device_display(option):
    # format the option data for display
    return '{0} ({1})'.format(option.get('name'), option.get('vendor'))


# Get devices from ST, stop if failure
try:
    devices = getSA_JSON('https://' + st_ip + '/securetrack/api/devices/')
except ValueError:
    print("Invalid Credentials")
    sys.exit(1)

# Create a pruned list for display, remove or alter criteria for your own use
pruned = [d for d in devices['devices']['device'] if d["virtual_type"] == "" or d["model"] in ["nsx_fw", "fmg_vdom", "Panorama", "fmc"]]

# Ask the user to pick a device
selected_device, index = pick(pruned, 'Please choose your Device: ', indicator='=>', options_map_func=device_display)


# Function to format display for rule picker
def rule_display(rule):
    # Organize the fields
    display = [
                        [d['display_name'] for d in rule['src_network']],
                        [d['display_name'] for d in rule['dst_network']],
                        [d['display_name'] for d in rule['dst_service']],
                        [rule['action']]
    ]
    # Return string and set max width and justify for table
    return "\t".join(list(map(lambda x: ",".join(x)[:30].ljust(30), display)))


print("Getting rules from device...")

# From the selected device grab some rules (limiting to 40 for demo)
rules = getSA_JSON('https://' + st_ip + '/securetrack/api/devices/' + selected_device['id'] + '/rules?count=40')

# Ask the user to pick a rule
selected_rule, index = pick(rules['rules']['rule'], "Please choose the rule \n   {:<30}\t{:<30}\t{:<30}\t{:<30}\t".format('Source', 'Destination', 'Service', 'Action'), indicator='=>', options_map_func=rule_display)

# Ask the user for workflow and ticket name
workflow_name = input("Enter Workflow Name [{}] : ".format(workflow_name)) or workflow_name
ticket_name = input("Enter Ticket Subject/Name [{}] : ".format(ticket_name)) or ticket_name

# We now have all the info needed to start a Rule Decom request

# These are the distinct fields needed for a RuleDecomm (tested on ASA/SRX)
# Fill them in with user input and info from API
try:
    things_needed = {
        "ticket_name": ticket_name,
        "workflow_name": workflow_name,
        "management_id": selected_device['id'],
        "revision_id": selected_device['latest_revision'],
        "binding_uid": selected_rule['binding'][0]['uid'],
        "rule_uid": selected_rule['uid']
    }
except KeyError:
    print("Error with API Info")
    sys.exit(1)


# Base template pulled from test ticket, pared down to min values
# Get your own via API via GET /securechangeworkflow/api/securechange/tickets/{{id}}
# Dict/JSON, but I'll leave it as string for templating and easy viewing
ticket_template = '''{{
    "ticket": {{
        "subject": "{ticket_name}",
        "priority": "Normal",
        "domain_name": "",
        "workflow": {{
            "name": "{workflow_name}",
            "uses_topology": "False"
        }},
        "steps": {{
            "step": [
                {{
                    "name": "Rules to Remove/Disable",
                    "tasks": {{
                        "task": {{
                            "fields": {{
                                "field": [
                                    {{
                                        "@xsi.type": "rule_decommission",
                                        "name": "Rule Decommission Flow",
                                        "read_only": "False",
                                        "devices": {{
                                            "device": {{
                                                "revision_id": {revision_id},
                                                "management_id": {management_id},
                                                "bindings": {{
                                                    "binding": {{
                                                        "binding_uid": "{binding_uid}",
                                                        "rules": {{
                                                            "rule": {{
                                                                "@xsi.type": "slimRuleWithMetadataDTO",
                                                                "uid": "{rule_uid}"
                                                            }}
                                                        }}
                                                    }}
                                                }}
                                            }}
                                        }},
                                        "action": "Remove"
                                    }}
                                ]
                            }}
                        }}
                    }}
                }}
            ]
        }}
    }}
}}'''


try:
    # Simple Sanity Test of merged template back to JSON
    payload = json.loads(ticket_template.format(**things_needed))
except ValueError:
    print("Error Merging")
    sys.exit(1)

# Successfully created a payload for SC, let's send it
print("Creating ticket in SecureChange...\n\n")
# Assuming same creds and server, this is not always true
sc_result = requests.request("POST", "https://" + st_ip + "/securechangeworkflow/api/securechange/tickets/", data=json.dumps(payload), headers={'content-type': "application/json"}, auth=(st_user, st_pass), verify=False)

# Lets find out what happened
if sc_result.status_code == 201:
    # It worked!
    print("\x1b[48;5;22mTicket for {} successfully submitted\x1b[0m".format(selected_device['name']))
    print("Direct Link: " + sc_result.headers['Location'])
    print("\n")
else:
    # It did not work :-(
    print("\x1b[1;37;41mSomething else happended.\x1b[0m")
    try:
        r = sc_result.json()
        print("Error Code: {}".format(r['result']['code']))
        print("Details: {}".format(r['result']['message']))
    except KeyError:
        print(sc_result.text)
