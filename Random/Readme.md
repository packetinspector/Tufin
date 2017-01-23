## Random Scripts for Tufin

##### Convert Tufin Network Objects to Palo Groups
Script will convert network objects and groups from ST into Palo objects. CKP, ASA, Stonesoft, Openstack, NSX, AWS are examples...

```bash
$ ./Tufin-Objects2Palo.py -d 8
Connecting to Firewall through Panorama
Adding Tufin Tag
Converting Objects
Ignoring Type: basicNetworkObjectDTO
Ignoring Type: basicNetworkObjectDTO
Ignoring Type: basicNetworkObjectDTO
Ignoring Type: basicNetworkObjectDTO
Found Subnet Object. Name: interface Datacenter IP: 10.3.3.1 / 255.255.255.255
Found Subnet Object. Name: interface External IP: 10.2.2.2 / 255.255.255.255
Found Subnet Object. Name: interface GigabitEthernet0/2 IP: 255.255.255.255 / 255.255.255.255
Found Subnet Object. Name: interface management IP: 10.100.200.109 / 255.255.255.255
Found Address Object. Name: 10.10.20.15 IP: 10.10.20.15
```