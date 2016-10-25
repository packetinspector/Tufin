Suricata Misc
=======================================================

Suricata Config
--------
Included a sample config of suricata for flow tracking.  Only flows are sent to eve.json.  Pay close attention to the bpf filter, it's how you narrow down the flows you want to record:
```
bpf-filter: src net 192.168.0.0/16 and dst net 192.168.0.0/16
```

Flow Parser
--------
Parses flows and outputs all unique flows into a json text file

Example JSON output
```json
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