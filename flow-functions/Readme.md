## Flow file functions for Tufin

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