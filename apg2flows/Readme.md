## APG to Flows

This will convert the output of an APG result into a flow file.  From there you could do lots of things.

Example:

```shell
pi@canary:~$ ./apg2flows.py apg.csv
{
    "flows":[
        {
            "service":"161",
            "proto":"UDP",
            "src_ip":"139.65.137.133",
            "dst_prefix":"32",
            "dst_ip":"144.5.138.18",
            "src_prefix":"32"
        },
        {
            "service":"",
            "proto":"Any",
            "src_ip":"199.103.14.4",
            "dst_prefix":"24",
            "dst_ip":"144.5.138.0",
            "src_prefix":"32"
        },
        {
            "service":"161",
            "proto":"UDP",
            "src_ip":"139.65.136.0",
            "dst_prefix":"24",
            "dst_ip":"144.5.138.0",
            "src_prefix":"24"
        },
        ...
```
```
pi@canary:~$ cat apg-flows.json
{"flows": [{"service": "161", "proto": "UDP", "src_ip": "139.65.137.133", "dst_prefix": "32", "dst_ip": "144.5.138.18", "src_
prefix": "32"}, {"service": "", "pro....
```
```
pi@canary:~$ ./flows2zones.py apg-flows.json
Flow file found.  Parsing...
Found 25 unique IPs and 6 unique Services inside 23 flow(s)
[]
[
    {
        "src_zone":"Internet",
        "service":"161",
        "proto":"UDP",
        "proto_num":17,
        "src_ip":"139.65.137.133",
        "dst_zone":"Internet",
        "dst_ip":"144.5.138.18"
    },
    ...
```