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
def validate_flows_usp(fl, only_return_violations=False):
    #Input: set of flows
    #Output: set of flows with USP violations added or just flows with violations

validate_flows_usp(flows, True)
```
###### Example
```shell