#!/usr/bin/python
import sys
import json

#Start the main program
#Parse APG
try:
    sys.argv[1]
except:
    print "You must supply an APG csv file as an argument"
    sys.exit(1)

with open(sys.argv[1]) as apg_csv:
    flows = []
    for l in apg_csv:
        p = l.translate(None, "\"").split(",")
        if (len(p) == 7):
            if (p[0] == 'Name'):
                continue
            #Should be an APG line
            (src_ip, src_prefix) = p[1].split("/")
            (dst_ip, dst_prefix) = p[2].split("/")
            service = p[3]
            proto = p[4]
            flow = {"src_ip": src_ip, "src_prefix": src_prefix, "dst_ip": dst_ip, "dst_prefix": dst_prefix, "service": service, "proto": proto}
            flows.append(flow)


print json.dumps({"flows": flows}, indent=4, separators=(',', ':'))

with open('apg-flows.json', 'w') as outfile:
    json.dump({"flows": flows}, outfile)
