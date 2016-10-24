#!/usr/bin/python
# Written for 2.7
# Takes the eve file from Suricata and turns it into unique flows for easy consumption. Stick with regular flows, not netflow. Left code for netflow just in case. 
# Imports
import json

# Vars
eve_file = '/var/log/suricata/eve.json'
sep = ':'
flows = set()
netflows = set()

with open(eve_file) as f:
    for l in f:
        #print l
       
        try:
            j = json.loads(l)
        except:
            print "Failed to load line: " + l
            continue

        #Check if it is a flow record
        if j['event_type'] not in ('flow', 'netflow'):
            print "Skipping non-flow"
            continue

        #Create a unique string
        try:
            flow = sep.join([str(j['src_ip']), str(j['dest_ip']), str(j['dest_port']), str(j['proto'])])
            # Add to Set, sets are unique...
            if j['event_type'] == 'netflow':
                #netflows.add(flow)
            else:
                flows.add(flow)
        except:
            print "Error joining. Skipping"
            continue

        #print flow
        

print "Finished Parsing."
# Now display set
print "Flow Records"
rules = []
for p in flows:
    pe = p.split(':')
    print pe
    rule = {"src_ip": pe[0], "dst_ip": pe[1], "service": pe[2], "proto": pe[3]}
    rules.append(rule)
print json.dumps({"flows": rules}, separators=(',', ':'))
with open('flows.json', 'w') as outfile:
    json.dump({"flows": rules}, outfile)

# print "Netflow"
# for n in netflows:
#     print n.split(':')
