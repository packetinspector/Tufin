Flows to SecureApp
====================

Takes a file of flows and converts it to an application in SecureApp.  You can then provision it...
Lots and lots of uses for this. 

Change the user, pass, and SA ip in the script. 

Sample Flow file
---------
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
You can use Suricata to generate this.  Details [here](https://github.com/packetinspector/Tufin/tree/master/suricata)

Sample Run
--------
```ShellSession
~$ ./flows-to-secureapp.py ./flows.json
Flow file found.  Parsing...
Found 32 unique IPs and 23 unique Services
Found SecureApp User(b) with id of 19
Creating Application
Found SecureApp App(East-West-1477349983) with id of 135
Adding Servers to Application...
Retrieving Server IDs
Adding Services to Application
Building Connections
Adding Connections to Application
Finished!
```

Result
---------
![ScreenShot](https://raw.githubusercontent.com/packetinspector/Tufin/master/flows2secureapp/screen1.png)