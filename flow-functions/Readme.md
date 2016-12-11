# Flow file functions for Tufin

These are a series of python functions you can use with flow files.  Flow files look like this:

```javascript
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
```

You can generate them anyway you want.  Maybe [convert an APG](https://github.com/packetinspector/Tufin/tree/master/apg2flows) , parse firewall logs or perhaps try an [automated approach](https://github.com/packetinspector/Tufin/tree/master/suricata)

##### Parse Flow File
```python
def parse_flow_file(file_location):
    #Parse Flow file
    #Returns a tuple of: list of unique ips, list of unique services, list of flows
```
###### Example
```shell
Flow file found.  Parsing...
Found 39 unique IPs and 106 unique Services inside 168 flow(s)
```

##### Validate flows against topology
```python
def validate_flows_topology(fl):
    # Input: list of flows
    # Output: list of flow with topology information added

print "validate with topology: "
print json.dumps(validate_flows_topology(test_sample), indent=4, separators=(',',':'))
```
###### Example
```shell
Flow file found.  Parsing...
Found 40 unique IPs and 106 unique Services inside 168 flow(s)
validate with topology:
[
    {
        "src_ip":"172.16.120.1",
        "dst_ip":"172.16.120.2",
        "traffic_allowed":true,
        "service":"55984",
        "proto":"UDP"
    },
    {
        "traffic_allowed":false,
        "service":"443",
        "proto":"TCP",
        "devices":[
            "Generic02",
            "Pe_1",
            "RTR6",
            "RTR4",
            "FG-SITE-B",
            "FG-External",
            "SMCPM"
        ],
        "src_ip":"172.16.130.1",
        "dst_ip":"172.16.140.2"
    }
]
```

##### Validate flows against USP
```python
def validate_flows_usp(fl, only_return_violations=False):
    #Input: set of flows
    #Output: set of flows with USP violations added or just flows with violations

validate_flows_usp(flows, True)
```
###### Example
```shell
[
    {
        "src_zone":"Amsterdam_Ext",
        "service":"55984",
        "proto":"UDP",
        "proto_num":17,
        "src_ip":"172.16.120.1",
        "dst_zone":"Amsterdam_Ext",
        "dst_ip":"172.16.120.2",
        "violations":[
            {
                "src_zone":"Amsterdam_SiteC",
                "type":"blocked_matrix_cell_violation",
                "severity":"LOW",
                "dst_zone":"Amsterdam_SiteC",
                "USP":"Network AUP"
            },
            {
                "src_zone":"Amsterdam_SiteC",
                "type":"blocked_matrix_cell_violation",
                "severity":"HIGH",
                "dst_zone":"Amsterdam_Ext",
                "USP":"Corporate Matrix (Physical + AWS)"
            },
            {
                "src_zone":"Amsterdam_Ext",
                "type":"blocked_matrix_cell_violation",
                "severity":"HIGH",
                "dst_zone":"Amsterdam_SiteC",
                "USP":"Corporate Matrix (Physical + AWS)"
            },
            {
                "src_zone":"Amsterdam_Ext",
                "type":"blocked_matrix_cell_violation",
                "severity":"LOW",
                "dst_zone":"Amsterdam_Ext",
                "USP":"Network AUP"
            }
        ]
    }
]
```

##### Add Zones to Flows
```python
def add_zones_to_flows(unique_ips, fl):
    # Input: set of flow records
    # Output: Queries SecureTrack and adds zone names to a set of flow records. Blank if no zone found.  

(unique_ips, unique_services, flows) = parse_flow_file(sys.argv[1])
sample = flows[0:5]
print "add_zones_to_flows: "
print json.dumps(add_zones_to_flows(unique_ips, sample), indent=4, separators=(',',':'))
```
###### Example
```shell
Flow file found.  Parsing...
Found 39 unique IPs and 106 unique Services inside 168 flow(s)
add_zones_to_flows:
[
    {
        "src_zone":"Amsterdam_Ext",
        "service":"55984",
        "proto":"UDP",
        "src_ip":"172.16.120.1",
        "dst_zone":"Amsterdam_Ext",
        "dst_ip":"172.16.120.2"
    },
    {
        "src_zone":"192.168.100.2",
        "service":"31433",
        "proto":"UDP",
        "src_ip":"192.168.100.2",
        "dst_zone":"192.168.100.31",
        "dst_ip":"192.168.100.31"
    },
    {
        "src_zone":"192.168.100.49",
        "service":"53",
        "proto":"UDP",
        "src_ip":"192.168.100.49",
        "dst_zone":"192.168.100.2",
        "dst_ip":"192.168.100.2"
    },
    {
        "src_zone":"192.168.100.2",
        "service":"56468",
        "proto":"UDP",
        "src_ip":"192.168.100.2",
        "dst_zone":"192.168.100.75",
        "dst_ip":"192.168.100.75"
    },
    {
        "src_zone":"192.168.100.2",
        "service":"55910",
        "proto":"UDP",
        "src_ip":"192.168.100.2",
        "dst_zone":"192.168.100.37",
        "dst_ip":"192.168.100.37"
    }
]
```

##### Create a USP from a flow file
```python
def flows_to_usp(fl):
    # Create a USP assuming the flow records represent allowed traffic.  Defaults can be easily modified.
    # Assume you are calling this after add_zones_to_flows

(unique_ips, unique_services, flows) = parse_flow_file(sys.argv[1])
sample = flows[0:5]
print flows_to_usp(add_zones_to_flows(unique_ips, sample))
```
###### Example
```shell
Flow file found.  Parsing...
Found 39 unique IPs and 106 unique Services inside 168 flow(s)
Found 6 matching zones in flows
Building USP...
from domain,from zone,to domain,to zone,severity,access type,services,rule properties,flows
default,192.168.100.2,default,192.168.100.2,low,allow all,,,
default,192.168.100.2,default,192.168.100.49,low,allow all,,,
default,192.168.100.2,default,192.168.100.31,low,allow all,,,
default,192.168.100.2,default,192.168.100.37,low,allow only,UDP 55910,,
default,192.168.100.2,default,Amsterdam_Ext,low,allow all,,,
default,192.168.100.2,default,192.168.100.75,low,allow all,,,
default,192.168.100.49,default,192.168.100.2,low,allow only,UDP 53,,
default,192.168.100.49,default,192.168.100.49,low,allow all,,,
default,192.168.100.49,default,192.168.100.31,low,allow all,,,
default,192.168.100.49,default,192.168.100.37,low,allow all,,,
default,192.168.100.49,default,Amsterdam_Ext,low,allow all,,,
default,192.168.100.49,default,192.168.100.75,low,allow all,,,
default,192.168.100.31,default,192.168.100.2,low,allow all,,,
default,192.168.100.31,default,192.168.100.49,low,allow all,,,
default,192.168.100.31,default,192.168.100.31,low,allow all,,,
default,192.168.100.31,default,192.168.100.37,low,allow all,,,
default,192.168.100.31,default,Amsterdam_Ext,low,allow all,,,
default,192.168.100.31,default,192.168.100.75,low,allow all,,,
default,192.168.100.37,default,192.168.100.2,low,allow all,,,
default,192.168.100.37,default,192.168.100.49,low,allow all,,,
default,192.168.100.37,default,192.168.100.31,low,allow all,,,
default,192.168.100.37,default,192.168.100.37,low,allow all,,,
default,192.168.100.37,default,Amsterdam_Ext,low,allow all,,,
default,192.168.100.37,default,192.168.100.75,low,allow all,,,
default,Amsterdam_Ext,default,192.168.100.2,low,allow all,,,
default,Amsterdam_Ext,default,192.168.100.49,low,allow all,,,
default,Amsterdam_Ext,default,192.168.100.31,low,allow all,,,
default,Amsterdam_Ext,default,192.168.100.37,low,allow all,,,
default,Amsterdam_Ext,default,Amsterdam_Ext,low,allow only,UDP 55984,,
default,Amsterdam_Ext,default,192.168.100.75,low,allow all,,,
default,192.168.100.75,default,192.168.100.2,low,allow all,,,
default,192.168.100.75,default,192.168.100.49,low,allow all,,,
default,192.168.100.75,default,192.168.100.31,low,allow all,,,
default,192.168.100.75,default,192.168.100.37,low,allow all,,,
default,192.168.100.75,default,Amsterdam_Ext,low,allow all,,,
default,192.168.100.75,default,192.168.100.75,low,allow all,,,
```

You could paste this into the [USP Editor](https://github.com/packetinspector/Tufin/tree/master/USP-Generator) if you wanted to.

##### Create a zone with entries
```python
def create_zone_with_entries(zone_name, entries):
    # Example: create_zone_with_entries('internal_net', ['192.168.100.0/24', '172.26.45.1/32'])
    # In, Zonename and list of CIDR/s
    # Create Zone, Add Entries
    # Return zone id
```
###### Example
```python
#Add a zone for every IP
(unique_ips, unique_services, flows) = parse_flow_file(sys.argv[1])
for i in unique_ips:
    ipre = str(i) + '/32'
    create_zone_with_entries(i,[ipre])
```

Lots of other ways to use that one...


###What can I do with this?

#### Create an entire Unified Security Policy automatically

Sample Code
```python
(unique_ips, unique_services, flows) = parse_flow_file(sys.argv[1])
baseline = flows[1:6]
test_sample = flows[1:10]
for i in unique_ips:
    ipre = str(i) + '/32'
    create_zone_with_entries(i,[ipre])
#Now we have all the zones created...
#Make a USP
print flows_to_usp(add_zones_to_flows(unique_ips, baseline))
#Hopefully we can bypass this manual step...
raw_input("Add USP to ST then hit Enter to continue...")
print "Validate flows against USPs:"
print json.dumps(validate_flows_usp(test_sample, True), indent=4, separators=(',',':'))
```

###### Output
```shell
$ python gogo.py ./flows.json
Flow file found.  Parsing...
Found 39 unique IPs and 106 unique Services inside 168 flow(s)
Found 6 matching zones in flows
Building USP...
from domain,from zone,to domain,to zone,severity,access type,services,rule properties,flows
default,192.168.100.2,default,192.168.100.2,low,allow all,,,
default,192.168.100.2,default,192.168.100.49,low,allow all,,,
default,192.168.100.2,default,192.168.100.31,low,allow all,,,
default,192.168.100.2,default,192.168.100.37,low,allow only,UDP 55910,,
default,192.168.100.2,default,192.168.100.76,low,allow all,,,
default,192.168.100.2,default,192.168.100.75,low,allow all,,,
default,192.168.100.49,default,192.168.100.2,low,allow only,UDP 53,,
default,192.168.100.49,default,192.168.100.49,low,allow all,,,
default,192.168.100.49,default,192.168.100.31,low,allow all,,,
default,192.168.100.49,default,192.168.100.37,low,allow all,,,
default,192.168.100.49,default,192.168.100.76,low,allow all,,,
default,192.168.100.49,default,192.168.100.75,low,allow all,,,
default,192.168.100.31,default,192.168.100.2,low,allow all,,,
default,192.168.100.31,default,192.168.100.49,low,allow all,,,
default,192.168.100.31,default,192.168.100.31,low,allow all,,,
default,192.168.100.31,default,192.168.100.37,low,allow all,,,
default,192.168.100.31,default,192.168.100.76,low,allow all,,,
default,192.168.100.31,default,192.168.100.75,low,allow all,,,
default,192.168.100.37,default,192.168.100.2,low,allow all,,,
default,192.168.100.37,default,192.168.100.49,low,allow all,,,
default,192.168.100.37,default,192.168.100.31,low,allow all,,,
default,192.168.100.37,default,192.168.100.37,low,allow all,,,
default,192.168.100.37,default,192.168.100.76,low,allow all,,,
default,192.168.100.37,default,192.168.100.75,low,allow all,,,
default,192.168.100.76,default,192.168.100.2,low,allow only,UDP 53,,
default,192.168.100.76,default,192.168.100.49,low,allow all,,,
default,192.168.100.76,default,192.168.100.31,low,allow all,,,
default,192.168.100.76,default,192.168.100.37,low,allow all,,,
default,192.168.100.76,default,192.168.100.76,low,allow all,,,
default,192.168.100.76,default,192.168.100.75,low,allow all,,,
default,192.168.100.75,default,192.168.100.2,low,allow all,,,
default,192.168.100.75,default,192.168.100.49,low,allow all,,,
default,192.168.100.75,default,192.168.100.31,low,allow all,,,
default,192.168.100.75,default,192.168.100.37,low,allow all,,,
default,192.168.100.75,default,192.168.100.76,low,allow all,,,
default,192.168.100.75,default,192.168.100.75,low,allow all,,,

Add USP to ST then hit Enter to continue...
Validate flows against USPs:
[
    {
        "service":"53",
        "proto":"UDP",
        "proto_num":17,
        "src_ip":"192.168.100.2",
        "dst_ip":"192.168.100.37",
        "violations":[
            {
                "src_zone":"192.168.100.2",
                "type":"restricted_matrix_cell_violation",
                "severity":"LOW",
                "dst_zone":"192.168.100.37",
                "USP":"FlowFile"
            }
        ]
    }
]
```

![USP in ST](/flow-functions/flow_usp.png)

