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

You can generate them anyway you want.  Or perhaps try an [automated approach](https://github.com/packetinspector/Tufin/tree/master/suricata)

##### Parse Zone File
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
    # Output: set of flow records with zone_name added to src/dst.  Blank if no zone found

(unique_ips, unique_services, flows) = parse_flow_file(sys.argv[1])
sample = flows[0:5]
print "add_zones_to_flows: "
print json.dumps(add_zones_to_flows(unique_ips, sample), indent=4, separators=(',',':'))
```
###### Example
```shell
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
    #Assume you are calling this after add_zones_to_flows

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